import z from "zod";
import { useAuthStore } from "@/stores/authStore";

export type ErrorUnionResponse<T, E = any> =
    | { status: "ok"; data: T }
    | { status: "err"; err: E };

const errorUnionSchema = <T>(successSchema: T) =>
    z.union([
        z.object({ status: z.literal("ok"), data: successSchema }),
        z.object({ status: z.literal("err"), err: z.any() }),
    ]);

export const registerDeviceResponseSchema = z.object({
    id: z.number(),
    deviceName: z.string(),
    role: z.string(),
    registeredAt: z.string(),
    credentials: z.object({
        jwt: z.string(),
        refresh_token: z.string(),
    }),
});

export const refreshAuthResponseSchema = z.object({
    jwt: z.string(),
    refresh_token: z.string(),
});

/** React hook — subscribes to auth store so callers re-render after login/logout. */
export const useApi = () => {
    const { refreshCreds } = useAuthStore();
    return new Api(refreshCreds);
};

export class Api {
    reception: ReceptionApi;

    constructor(refreshCreds: () => Promise<void>) {
        this.reception = new ReceptionApi(refreshCreds);
    }

    static async registerDevice(
        base_url: string,
        otp: string,
    ): Promise<
        ErrorUnionResponse<z.infer<typeof registerDeviceResponseSchema>>
    > {
        const res = await fetch(`${base_url}/auth/device`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ otp }),
        });

        const body = await res.json();
        return errorUnionSchema(registerDeviceResponseSchema).parse(body);
    }
}

class ReceptionApi {
    constructor(private refreshCreds: () => Promise<void>) {}

    async registerPlayer(
        name: string,
        age: number,
    ): Promise<ErrorUnionResponse<z.infer<typeof registerPlayerResponseSchema>>> {
        // refreshCreds is idempotent — it returns early if JWT is still valid.
        await this.refreshCreds();

        // Always read config from store *after* refresh so we use the new JWT.
        const config = useAuthStore.getState().config!;

        const res = await fetch(`${config.base_url}/player`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.credentials.jwt}`,
            },
            body: JSON.stringify({ name, age }),
        });

        const body = await res.json();
        return errorUnionSchema(registerPlayerResponseSchema).parse(body);
    }
}

const registerPlayerResponseSchema = z.object({
    name: z.string(),
    age: z.number(),
    id: z.number(),
});
