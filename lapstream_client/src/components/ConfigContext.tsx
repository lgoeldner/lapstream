import { Config } from "@/lib/config_provider";
import { createContext } from "react";

export const ConfigContext = createContext<Config | null>(null);
