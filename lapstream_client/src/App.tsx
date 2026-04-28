import { createContext, useContext, useEffect, useState } from "react";
import "./App.css";
import {
    Config,
    getStoredConfig as getStoredConfig,
    saveClientData,
    storeConfig,
} from "./lib/config_provider.ts";
import LoginDialog, { ClientData } from "./components/LoginPage";
import { ThemeProvider } from "./components/theme_provider";
import { RolesRouter } from "./components/RolesRouter";
import { ConfigContext } from "./components/utils/ConfigContext.tsx";
import { ErrorBoundary } from "./components/utils/ErrorBoundary.tsx";
import {
    GlobalErrorProvider,
    useGlobalError,
} from "./components/utils/GlobalErrorProvider.tsx";
import { info, warn } from "@tauri-apps/plugin-log";
import { Toaster } from "./components/ui/sonner.tsx";

const unreachable = (): never => {
    throw new Error("unreachable");
};

function App() {
    // setup auth
    // first, check if there is a refresh_token still stored in localStorage
    // if so, use it{

    const [appPage, setAppPage] = useState("login"); // "login" | "reception" | "lane_count"

    // Config is stored twice: once in localStorage/sessionStorage and once in state
    // To keep them in sync,
    const [config, setConfig] = useState<Config | null>(null);

    useEffect(() => {
        const d = getStoredConfig();
        if (d) {
            setConfig(d);
            setAppPage(d.role);
        }
    }, []);

    return (
        <ThemeProvider>
            <ErrorBoundary>
                <GlobalErrorProvider>
                    <main className=" w-full h-full overscroll-none fixed overflow-hidden">
                        {appPage === "login" ? (
                            <LoginDialog
                                onLogin={(d) => {
                                    saveClientData(d);
                                    setConfig(d);
                                    setAppPage(d.role);
                                }}
                            />
                        ) : (
                            <RolesRouter
                                page={appPage}
                                reauth={() => {
                                    setConfig(null);
                                    setAppPage("login");
                                    // bypass never type error since this wont return
                                    return;
                                }}
                                config={config!}
                                setConfig={(newConfig) => {
                                    info(
                                        `Stored new config: ${JSON.stringify(newConfig)}`,
                                    );
                                    setConfig(newConfig);
                                    storeConfig(newConfig);
                                }}
                            />
                        )}
                    </main>
                    <Toaster />
                </GlobalErrorProvider>
            </ErrorBoundary>
        </ThemeProvider>
    );
}

export default App;
