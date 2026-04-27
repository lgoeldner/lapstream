import z from "zod";
import { Config } from "./config_provider.ts";
import { useContext } from "react";
import { ConfigContext } from "@/components/ConfigContext.tsx";

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

export const useApi = () => {
    const config = useContext(ConfigContext);
    return new Api(config!);
};

export class Api {
    constructor(private config: Config) {
        this.config = config;
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
}
