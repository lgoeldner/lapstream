/**
 * Config/credential types and localStorage persistence helpers.
 * JWT is never written to localStorage — only sessionStorage.
 */

export type ClientData = {
    id: number;
    deviceName: string;
    role: string;
    registeredAt: string;
    credentials: {
        jwt: string;
        refresh_token: string;
    };
    base_url: string;
};

export type Config = Omit<ClientData, "credentials"> & {
    credentials: {
        jwt: string | null;
        refresh_token: string;
    };
};

/**
 * Persist config to localStorage (jwt stripped) and jwt to sessionStorage.
 */
export function storeConfig(config: Config | ClientData): void {
    const c = structuredClone(config) as Config;
    c.credentials.jwt = null;
    sessionStorage.setItem("jwt", config.credentials.jwt ?? "");
    localStorage.setItem("config", JSON.stringify(c));
}

/**
 * Restore config from localStorage + jwt from sessionStorage.
 */
export function getStoredConfig(): Config | null {
    const raw = localStorage.getItem("config");
    if (!raw) return null;

    const c = JSON.parse(raw) as Config;
    const jwt = sessionStorage.getItem("jwt");
    if (jwt) c.credentials.jwt = jwt;

    return c;
}

export function clearStoredConfig(): void {
    localStorage.removeItem("config");
    sessionStorage.removeItem("jwt");
}
