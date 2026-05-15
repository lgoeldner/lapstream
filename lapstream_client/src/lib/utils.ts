import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
