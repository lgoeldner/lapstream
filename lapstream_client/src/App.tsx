import { createContext, useContext, useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Button } from "./components/ui/button";
import { getConfig } from "./lib/config";
import LoginDialog from "./components/LoginDialog";
import { ThemeProvider } from "./components/theme_provider";

function App() {
    // setup auth
    // first, check if there is a refresh_token still stored in localStorage
    // if so, use it{

    let config;
    useEffect(() => {
        const s = getConfig();
        if (s) {
            config = s;
        }
    }, []);

    const [appPage, setAppPage] = useState("login"); // "login" | "reception" | "lane_count"

    return (
        <ThemeProvider>
            <main className="container w-full h-full overscroll-none fixed overflow-hidden">
                <LoginDialog onLogin={(_) => void 0}></LoginDialog>
            </main>
        </ThemeProvider>
    );
}

export default App;
