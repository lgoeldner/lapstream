import { JSX, useContext } from "react";
import { ConfigContext } from "./ConfigContext";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";

export const TopBar = ({ reauth }: { reauth: () => void }): JSX.Element => {
    const config = useContext(ConfigContext);

    return (
        <div className="flex flex-col w-full gap-2 p-2 justify-center">
            <div className="flex flex-row">
                <p>Test!!!</p>
                <Button className="ml-auto" onClick={reauth}>
                    Logout
                </Button>
            </div>
            <Separator className="w-full" />
        </div>
    );
};
