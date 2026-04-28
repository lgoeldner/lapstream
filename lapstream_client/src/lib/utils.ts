import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Config } from "./config_provider.ts";
import z from "zod";
import { Api } from "./api_access.ts";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const parseJwt = (token: string) => {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
};

export const jwtIsExpired = (token: string) => {
    const decoded = parseJwt(token);
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
};

/*
export const refreshAuth = async (config: Config) => {
    const api = new Api(config);
    const result = await api.refreshAuth();

    if (result.status === "err") {
        throw new Error(result.err.message || "Failed to refresh JWT");
    }

    return result.data;
};
*/
