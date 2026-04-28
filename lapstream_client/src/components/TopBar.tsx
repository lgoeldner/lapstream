import { JSX, useContext } from "react";
import { ConfigContext } from "./utils/ConfigContext";
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

export const TopBar = ({ reauth }: { reauth: () => void }): JSX.Element => {
    const { config, refreshCreds } = useContext(ConfigContext);

    return (
        <div className="flex flex-col w-full gap-2 p-2">
            <div className="flex flex-row items-center mx-4 mb-1 gap-4">
                <p className="font-bold text-xl">lapstream</p>

                <Button onClick={refreshCreds} variant="outline">
                    refresh Authentication
                </Button>
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
                            <Button variant="destructive" onClick={reauth}>
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
