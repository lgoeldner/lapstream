import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Config } from "./config_provider.ts";
import z from "zod";
import { Api } from "./api_access.ts";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const refreshJwtResponseSchema = z.object({
    status: z.literal("ok"),
    data: z.object({
        jwt: z.string(),
        refresh_token: z.string(),
    }),
});

export const refreshJwt = async (config: Config) => {
    const api = new Api(config);

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

    if (!res.ok) {
        throw new Error(body.message || "Failed to refresh JWT");
    }

    const parsed = refreshJwtResponseSchema.parse(body);
};
