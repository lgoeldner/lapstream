import { JSX, useState } from "react";
import { TopBar } from "./TopBar";
import { ReceptionPage } from "./reception/Reception";
import { ConnectionState } from "./reception/ReceptionWs";
import { useAuthStore } from "@/stores/authStore";

export function RolesRouter(): JSX.Element {
    const { config } = useAuthStore();
    const [connStatus, setConnStatus] = useState<ConnectionState>("connecting");

    if (!config) return <></>;

    return (
        <div className="w-full h-full flex flex-col items-center">
            <TopBar connStatus={connStatus} />
            <RolePage page={config.role} setConnStatus={setConnStatus} />
        </div>
    );
}

const RolePage = ({
    page,
    setConnStatus,
}: {
    page: string;
    setConnStatus: (status: ConnectionState) => void;
}) => {
    switch (page) {
        case "reception":
            return <ReceptionPage setConnStatus={setConnStatus} />;
        default:
            return <div>Unknown page: {page}</div>;
    }
};
