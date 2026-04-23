export type AppConfig = {
    base_url?: string;
    device?: {
        device_name: string;
        role: "admin" | "reception" | "lane_assign" | "lane_count";
        refresh_token: string;
    };
};

// use localStorage for config
export async function getConfig(): Promise<AppConfig | null> {
    const config = localStorage.getItem("config");
    if (!config) {
        return null;
    }

    return JSON.parse(config);
}

export async function saveConfig(config: AppConfig): Promise<void> {
    localStorage.setItem("config", JSON.stringify(config));
}
