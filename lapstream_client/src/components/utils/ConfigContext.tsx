import { Config } from "@/lib/config_provider";
import { createContext } from "react";

export const ConfigContext = createContext<{
    config: Config | null;
    refreshCreds: () => Promise<void>;
}>({
    config: null,
    refreshCreds: async () => {},
});
