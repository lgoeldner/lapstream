import { JSX, useContext } from "react";
import { ConfigContext } from "./ConfigContext";
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
    const config = useContext(ConfigContext);

    return (
        <div className="flex flex-col w-full gap-2 p-2 justify-center items-center">
            <div className="flex flex-row  px-6 pb-1 w-full items-center">
                <p className="ml-2 bg-muted">{config?.deviceName}</p>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="ml-auto" variant="outline">
                            Logout
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
                                <Button type="button">Close</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Separator className="w-full" />
        </div>
    );
};
