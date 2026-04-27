import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { Badge } from "./ui/badge";
import { JSX, useEffect, useState } from "react";
import { Spinner } from "./ui/spinner";
import { LucideCheck, LucideX } from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import z from "zod";
import { Api, registerDeviceResponseSchema } from "@/lib/api_access";

// display a badge with three possible states: "loading" | "not_connected" | "connected"

function StatusBadge({ status }: { status: string }): JSX.Element {
    switch (status) {
        case "loading":
            return (
                <Badge variant="secondary">
                    <Spinner data-icon="inline-start" />
                    Loading...
                </Badge>
            );
        case "not_connected":
            return (
                <Badge variant="destructive">
                    <LucideX data-icon="inline-start" />
                    Not Connected
                </Badge>
            );
        case "connected":
            return (
                <Badge variant="default" className="bg-green-500">
                    <LucideCheck data-icon="inline-start" />
                    Connected
                </Badge>
            );
        default:
            throw new Error("invalid State");
    }
}

export type ClientData = z.infer<typeof registerDeviceResponseSchema> & {
    base_url: string;
};

type DialogState =
    | { status: "loading" }
    | { status: "ok"; data: ClientData }
    | { status: "failure"; err: string };

export default function LoginDialog({
    onLogin,
}: {
    onLogin: (a: ClientData) => void;
}) {
    const [urlInput, setUrlInput] = useState("");
    const [status, setStatus] = useState("not_connected");
    const [otpInput, setOtpInput] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [finalDialogState, setFinalDialogState] = useState<DialogState>({
        status: "loading",
    });

    useEffect(() => {
        if (!urlInput) {
            setStatus("not_connected");
            return;
        }

        setStatus("loading");

        // abort the request if the user continues to type the URL
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(urlInput, {
                    signal: controller.signal,
                });
                if (!res.ok) {
                    setStatus("not_connected");
                    return;
                }

                const data = await res.json();

                if (data.service === "lapstream-server") {
                    setStatus("connected");
                    return;
                }

                setStatus("not_connected");
            } catch (e) {
                if ((e as Error).name !== "AbortError") {
                    setStatus("not_connected");
                }
            }
        }, 500);

        return () => {
            clearTimeout(timer);
            controller.abort(); // cancel in-flight request on URL change
        };
    }, [urlInput]);

    useEffect(() => {
        if (otpInput.length == 6) {
            const doRegisterDevice = async () => {
                try {
                    const res = await Api.registerDevice(urlInput, otpInput);

                    if (res.status !== "ok") {
                        setFinalDialogState({
                            status: "failure",
                            err: res.err,
                        });
                        return;
                    }

                    setFinalDialogState({
                        status: "ok",
                        data: { ...res.data, base_url: urlInput },
                    });
                    return;
                } catch (ex) {}
            };
            doRegisterDevice();

            setDialogOpen(true);
        }
    }, [otpInput]);

    return (
        <div className=" h-dvh w-dvw flex justify-center items-center">
            <Card className="flex min-w-md min-h-fit max-h-3/4">
                <CardHeader className="">
                    <CardTitle>Login</CardTitle>
                    <CardDescription>
                        Enter missing information to connect to Server
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Label className="pt-4 pb-2">
                        Base URL <StatusBadge status={status} />
                    </Label>

                    <Input
                        type="text"
                        id="base_url"
                        placeholder="https://example.com"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                    />

                    <Label className="pt-4 pb-1">OTP</Label>
                    <div className="flex flex-row  w-full">
                        <InputOTP
                            maxLength={6}
                            pattern={REGEXP_ONLY_DIGITS}
                            value={otpInput}
                            onChange={setOtpInput}
                            disabled={status !== "connected"}
                        >
                            {" "}
                            <InputOTPGroup>
                                {[...Array(6).keys()].map((_, i) => (
                                    <InputOTPSlot index={i} key={i} />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>

                        <Dialog
                            open={dialogOpen}
                            onOpenChange={(ch) => {
                                setDialogOpen(ch);
                                // when successfully logged in, return to the start
                                if (!ch && finalDialogState.status == "ok") {
                                    onLogin(finalDialogState.data);
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button
                                    className="ml-auto p-3 mr-3"
                                    type="submit"
                                    disabled={status !== "connected"}
                                    id="login-submit"
                                >
                                    Submit
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="flex flex-col min-w-md h-64 max-h-3/4">
                                <LoginResultDialog result={finalDialogState} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function LoginResultDialog({ result }: { result: DialogState }) {
    switch (result.status) {
        case "loading":
            return (
                <DialogHeader>
                    <DialogTitle className="flex flex-row items-center gap-2">
                        Loading...
                    </DialogTitle>
                    <Spinner />
                </DialogHeader>
            );
        case "ok":
            return (
                <>
                    <DialogHeader>
                        <DialogTitle className="flex flex-row items-center gap-2">
                            <Badge variant="default" className="bg-green-500">
                                <LucideCheck /> Success
                            </Badge>
                            Successfully registered
                        </DialogTitle>
                    </DialogHeader>

                    <Card
                        className="h-full grid grid-cols-4 grid-rows-2
                        items-center p-6"
                    >
                        <Label className="ml-2 col-start-1">Name:</Label>
                        <p className="font-mono col-start-2">
                            {(() => {
                                console.log(result.data);
                                return "";
                            })()}
                            {result.data.deviceName}
                        </p>

                        <Label className="ml-2 col-start-1">Role:</Label>
                        <p className="font-mono col-start-2">
                            {result.data.role}
                        </p>
                    </Card>
                </>
            );
        case "failure":
            return (
                <>
                    <DialogHeader className="flex flex-row">
                        <DialogTitle>
                            <Badge variant="destructive">
                                <LucideX /> Error
                            </Badge>
                        </DialogTitle>
                        Failure
                    </DialogHeader>

                    <p>{result.err}</p>
                </>
            );
    }
}
