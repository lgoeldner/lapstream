/**
 * provides uniform interface when logged in based on auth context
 */

import { ConfigContext } from "./ConfigContext";
import { JSX, useContext } from "react";
import { TopBar } from "./TopBar";

const parseJwt = (token: string) => {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
};

const jwtIsExpired = (token: string) => {
    const decoded = parseJwt(token);
    const now = Math.floor(Date.now() / 1000);
    return decoded.exp < now;
};

export function RolesRouter({
    page,
    reauth,
}: {
    page: string;
    reauth: () => void;
}): JSX.Element {
    const config = useContext(ConfigContext);

    if (!config) {
        reauth();
        return <></>;
    }

    // check if the jwt is still valid
    if (!config.credentials.jwt || jwtIsExpired(config.credentials.jwt)) {
        // trigger refresh flow
    }

    return (
        <div className="w-full flex flex-col">
            <TopBar reauth={reauth}></TopBar>
        </div>
    );
}
