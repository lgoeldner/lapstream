/**
 * Utility functions for saving configuration in localStorage.
 * Does not save the jwt to localStorage.
 */

import { ClientData } from "@/components/LoginPage";

// omit the jwt and flatten to include refresh_token directly inside Config
export type Config = {
    id: number;
    deviceName: string;
    role: string;
    registeredAt: string;
    credentials: {
        jwt: string | null;
        refresh_token: string;
    };
} & {
    base_url: string;
};

/**
 * save the client data and base_url to localStorage
 */
export function saveClientData(config: ClientData): void {
    // do not save jwt to memory
    const c = structuredClone(config) as Config;
    c.credentials.jwt = null;

    localStorage.setItem("config", JSON.stringify(c));
}

export function saveConfig(config: Config) {
    // do not save jwt
    const c = structuredClone(config) as Config;
    c.credentials.jwt = null;

    localStorage.setItem("config", JSON.stringify(c));
}

/**
 * Try to retrieve configuration from localStorage
 */
export function getConfig(): Config | null {
    const config = localStorage.getItem("config");
    if (!config) {
        return null;
    }

    return JSON.parse(config);
}
