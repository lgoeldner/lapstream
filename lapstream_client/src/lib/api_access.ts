import z from "zod";
import { Config } from "./config_provider.ts";
import { useContext } from "react";
import { ConfigContext } from "@/components/utils/ConfigContext.tsx";
import { jwtIsExpired } from "./utils.ts";

export type ErrorUnionResponse<T, E = any> =
    | {
          status: "ok";
          data: T;
      }
    | {
          status: "err";
          err: E;
      };

const errorUnionSchema = <T>(successSchema: T) =>
    z.union([
        z.object({
            status: z.literal("ok"),
            data: successSchema,
        }),
        z.object({
            status: z.literal("err"),
            err: z.any(),
        }),
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

export const useApi = () => {
    const { config, refreshCreds } = useContext(ConfigContext);
    return new Api(config!, refreshCreds);
};

export class Api {
    reception: ReceptionApi;
    constructor(
        private config: Config,
        private refreshCreds: () => Promise<void>,
    ) {
        this.reception = new ReceptionApi(config, refreshCreds);
    }

    static async registerDevice(
        base_url: string,
        otp: string,
    ): Promise<
        ErrorUnionResponse<z.infer<typeof registerDeviceResponseSchema>>
    > {
        const res = await fetch(`${base_url}/auth/device`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ otp }),
        });

        const body = await res.json();
        const result = errorUnionSchema(registerDeviceResponseSchema).parse(
            body,
        );

        return result;
    }

    static async refreshAuth(
        config: Config,
    ): Promise<ErrorUnionResponse<z.infer<typeof refreshAuthResponseSchema>>> {
        const res = await fetch(`${config.base_url}/auth/refresh`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refresh_token: config.credentials.refresh_token,
            }),
        });

        const body = await res.json();
        const result = errorUnionSchema(refreshAuthResponseSchema).parse(body);

        return result;
    }
}

class ReceptionApi {
    constructor(
        private config: Config,
        private refreshAuth: () => Promise<void>,
    ) {}

    async registerPlayer(name: string, age: number) {
        if (
            !this.config.credentials.jwt ||
            jwtIsExpired(this.config.credentials.jwt)
        ) {
            await this.refreshAuth();
        }

        const res = await fetch(`${this.config.base_url}/player`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.config.credentials.jwt}`,
            },
            body: JSON.stringify({ name, age }),
        });

        const body = await res.json();
        const result = errorUnionSchema(registerPlayerResponseSchema).parse(
            body,
        );

        return result;
    }
}

const registerPlayerResponseSchema = z.object({
    name: z.string(),
    age: z.number(),
    id: z.number(),
});
