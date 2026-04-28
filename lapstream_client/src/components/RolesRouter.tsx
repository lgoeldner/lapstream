/**
 * provides uniform interface when logged in based on auth context
 */

import { ConfigContext } from "./utils/ConfigContext";
import { JSX, useContext, useEffect, useRef } from "react";
import { TopBar } from "./TopBar";
import { jwtIsExpired } from "@/lib/utils";
import { Config } from "@/lib/config_provider";
import { useGlobalError } from "./utils/GlobalErrorProvider";
import { info, trace, warn } from "@tauri-apps/plugin-log";
import { ReceptionPage } from "./reception/Reception";
import { Api, useApi } from "@/lib/api_access";

export function RolesRouter({
    page,
    config,
    setConfig,
    reauth,
}: {
    page: string;
    config: Config;
    setConfig: (config: Config) => void;
    reauth: () => void;
}): JSX.Element {
    if (!config) {
        reauth();
        return <></>;
    }

    const { setErrorMessage } = useGlobalError();
    const inFlight = useRef(false);
    const refreshCreds = async () => {
        info("called refreshCreds");
        if (!config) {
            setErrorMessage("No Config available", `${JSON.stringify(config)}`);
            return;
        }

        if (config.credentials.jwt && !jwtIsExpired(config.credentials.jwt)) {
            return;
        }

        if (inFlight.current) {
            return;
        }
        inFlight.current = true;

        info("sending refresh request");

        try {
            const res = await Api.refreshAuth(config);
            if (res.status === "err") {
                warn("refreshAuth failed", res.err);
                throw new Error(res.err);
            }

            const credentials = res.data;

            setConfig({ ...config, credentials });
        } catch (e) {
            setErrorMessage("Failed to refresh JWT", (e as Error).message);
            reauth();
        }

        inFlight.current = false;
    };

    return (
        <ConfigContext.Provider value={{ config: config!, refreshCreds }}>
            <div className="w-full h-full flex flex-col items-center">
                <TopBar reauth={reauth} />
                <RolePage page={page} />
            </div>
        </ConfigContext.Provider>
    );
}

const RolePage = ({ page }: { page: string }) => {
    switch (page) {
        case "reception":
            return <ReceptionPage />;
        default:
            return <div>Unknown page: {page}</div>;
    }
};
