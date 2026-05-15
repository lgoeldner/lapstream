import { create } from "zustand";
import z from "zod";
import { info, warn } from "@tauri-apps/plugin-log";
import { toast } from "sonner";
import {
    ClientData,
    Config,
    clearStoredConfig,
    getStoredConfig,
    storeConfig,
} from "@/lib/config_provider";
import { jwtIsExpired } from "@/lib/utils";

const refreshResponseSchema = z.object({
    jwt: z.string(),
    refresh_token: z.string(),
});

type AuthState = {
    config: Config | null;
    login: (clientData: ClientData) => void;
    logout: () => void;
    refreshCreds: () => Promise<void>;
};

// Deduplicates concurrent refresh calls — not stored in zustand state to avoid extra renders.
let refreshPromise: Promise<void> | null = null;

const REFRESH_MAX_ATTEMPTS = 3;
const REFRESH_RETRY_DELAY_MS = 2000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const useAuthStore = create<AuthState>((set, get) => ({
    config: getStoredConfig(),

    login: (clientData: ClientData) => {
        storeConfig(clientData);
        set({ config: { ...clientData } });
    },

    logout: () => {
        clearStoredConfig();
        set({ config: null });
    },

    refreshCreds: async () => {
        const { config } = get();
        if (!config) return;

        // JWT still valid — nothing to do.
        if (config.credentials.jwt && !jwtIsExpired(config.credentials.jwt)) {
            return;
        }

        // Deduplicate concurrent refresh calls.
        if (refreshPromise) {
            return refreshPromise;
        }

        info("Refreshing JWT credentials");

        refreshPromise = (async () => {
            let lastNetworkError: unknown;

            for (let attempt = 1; attempt <= REFRESH_MAX_ATTEMPTS; attempt++) {
                // --- Try to reach the server ---
                let res: Response;
                try {
                    res = await fetch(`${config.base_url}/auth/refresh`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            refresh_token: config.credentials.refresh_token,
                        }),
                    });
                } catch (networkErr) {
                    // Server unreachable — retry after delay.
                    lastNetworkError = networkErr;
                    warn(
                        `Refresh attempt ${attempt}/${REFRESH_MAX_ATTEMPTS} failed (network): ${networkErr}`,
                    );
                    if (attempt < REFRESH_MAX_ATTEMPTS) {
                        await sleep(REFRESH_RETRY_DELAY_MS);
                        continue;
                    }
                    // All retries exhausted.
                    toast.error("Server unreachable", {
                        description:
                            "Could not reach the server. Please check your connection.",
                        position: "bottom-left",
                    });
                    throw lastNetworkError;
                }

                // --- Server responded — check application-level result ---
                const body = await res.json();
                if (body.status !== "ok") {
                    // Server explicitly rejected the token (revoked, expired on server, etc.).
                    // Logging out is correct here: the refresh token is gone and there is no
                    // recovery path without a new OTP.
                    warn(`Auth refresh rejected by server: ${body.err}`);
                    toast.error("Session expired", {
                        description: "Please log in again.",
                        position: "bottom-left",
                    });
                    get().logout();
                    throw new Error(body.err ?? "Authentication rejected");
                }

                // --- Success ---
                const credentials = refreshResponseSchema.parse(body.data);
                const newConfig: Config = { ...get().config!, credentials };
                storeConfig(newConfig);
                set({ config: newConfig });
                info("JWT refreshed successfully");
                return;
            }
        })().finally(() => {
            refreshPromise = null;
        });

        return refreshPromise;
    },
}));
