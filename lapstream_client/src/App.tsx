import { createContext, useContext, useEffect, useState } from "react";
import "./App.css";
import {
    Config,
    getConfig as getStoredConfig,
    saveClientData,
} from "./lib/config_provider.ts";
import LoginDialog, { ClientData } from "./components/LoginPage";
import { ThemeProvider } from "./components/theme_provider";
import { RolesRouter } from "./components/RolesRouter";
import { ConfigContext } from "./components/ConfigContext";

const unreachable = (): never => {
    throw new Error("unreachable");
};

function App() {
    // setup auth
    // first, check if there is a refresh_token still stored in localStorage
    // if so, use it{

    const [appPage, setAppPage] = useState("login"); // "login" | "reception" | "lane_count"
    const [config, setConfig] = useState<Config | null>(null);

    useEffect(() => {
        const d = getStoredConfig();
        if (d) {
            setConfig(d);
            setAppPage("reception");
        }
    }, []);

    return (
        <ThemeProvider>
            <main className=" w-full h-full overscroll-none fixed overflow-hidden">
                {appPage === "login" ? (
                    <LoginDialog
                        onLogin={(d) => {
                            saveClientData(d);
                            setConfig(getStoredConfig());
                            setAppPage("reception");
                        }}
                    />
                ) : (
                    <ConfigContext.Provider value={config}>
                        <RolesRouter
                            page={appPage}
                            reauth={() => {
                                setConfig(null);
                                setAppPage("login");
                                // bypass never type error since this wont return
                                return;
                            }}
                        />
                    </ConfigContext.Provider>
                )}
            </main>
        </ThemeProvider>
    );
}

export default App;
