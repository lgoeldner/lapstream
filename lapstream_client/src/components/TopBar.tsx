import { JSX } from "react";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { ConnectionState } from "./reception/ReceptionWs";
import { Badge } from "./ui/badge";
import { Spinner } from "./ui/spinner";
import { LucideCheck, LucideX } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

function StatusBadge({ status }: { status: ConnectionState }): JSX.Element {
    switch (status) {
        case "connecting":
            return (
                <Badge variant="secondary">
                    <Spinner data-icon="inline-start" />
                    Connecting...
                </Badge>
            );
        case "disconnected":
            return (
                <Badge variant="destructive">
                    <LucideX data-icon="inline-start" />
                    Disconnected
                </Badge>
            );
        case "connected":
            return (
                <Badge variant="default" className="">
                    <LucideCheck data-icon="inline-start" />
                    Connected
                </Badge>
            );
        case "error":
            return (
                <Badge variant="destructive">
                    <LucideX data-icon="inline-start" />
                    Server Connection Error
                </Badge>
            );
        default:
            throw new Error("invalid State");
    }
}

export const TopBar = ({
    connStatus,
}: {
    connStatus: ConnectionState | null;
}): JSX.Element => {
    const { config, logout } = useAuthStore();

    return (
        <div className="flex flex-col w-full gap-2 p-2">
            <div className="flex flex-row items-center mx-4 mb-1 gap-4">
                <p className="font-bold text-xl">lapstream</p>

                {connStatus && <StatusBadge status={connStatus} />}

                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            className="ml-auto px-3 py-2 rounded-2xl outline "
                            variant="outline"
                        >
                            <p className="font-bold">{config?.deviceName}</p>
                            <Separator orientation="vertical" />
                            <p className="">{config?.role}</p>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Logout?</DialogTitle>
                            <DialogDescription>
                                This will require a new OTP from the admin.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="destructive" onClick={logout}>
                                Logout
                            </Button>
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    autoFocus
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Separator className="w-full" />
        </div>
    );
};
