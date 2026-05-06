import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApi } from "@/lib/api_access";
import { toast } from "sonner";
import { ConnectionState, Handler, useWs } from "./ReceptionWs";
import z from "zod";

export const ReceptionPage = ({
    setConnStatus: setConnStatus,
}: {
    setConnStatus: (status: ConnectionState) => void;
}) => {
    const [age, setAge] = useState<number | undefined>(undefined);
    const [name, setName] = useState<string | undefined>(undefined);

    const ws = useWs({
        confirmCreated: Handler(z.string(), (data) => {
            toast.success(`Player ${data} created`, {
                position: "bottom-right",
            });
        }),
    });
    useEffect(() => {
        setConnStatus(ws.connStatus);
    }, [ws.connStatus]);

    useEffect(() => {
        ws.sendMessage({ type: "echo", data: "test" });
    }, []);
    const api = useApi();
    const onSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!name || !age) {
            toast.error("No new player registered", {
                description: "Please enter a name and age",
                position: "bottom-left",
                closeButton: true,
            });
            return;
        }

        toast.promise(api.reception.registerPlayer(name!, age!), {
            loading: "Registering Player...",
            success: (res) => {
                if (res.status === "ok") {
                    return (
                        <div className="flex flex-col">
                            <p className="font-bold text-lg">
                                Player registered
                            </p>
                            <p className="font-mono text-sm text-secondary-foreground">
                                name: "{res.data.name}" id: {res.data.id}
                            </p>
                        </div>
                    );
                }
                return (
                    <div className="flex flex-col">
                        <p className="font-bold">No new player registered</p>
                        <p className="">err: {res.err}</p>
                    </div>
                );
            },
            error: (res) => `Failed to register Player: ${res}`,
            position: "bottom-left",
            closeButton: true,
        });
    };

    return (
        <div className="p-6 w-full h-full xl:max-w-[70%] lg:gap-12 gap-6 grid grid-cols-2 grid-rows-1 justify-center items-center">
            <Card className="">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">
                        Register Player
                    </CardTitle>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    placeholder="Enter Name"
                                    autoComplete=""
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    id="name"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Age</Label>
                                <Input
                                    placeholder="Enter Age"
                                    type="number"
                                    value={age}
                                    onChange={(e) =>
                                        setAge(Number(e.target.value))
                                    }
                                    aria-valuemin={1}
                                    aria-valuemax={120}
                                    id="age"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="mt-4 border-t ">
                        <Button type="submit" className="w-full">
                            Submit
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">
                        All Players
                    </CardTitle>
                </CardHeader>
            </Card>
        </div>
    );
};
