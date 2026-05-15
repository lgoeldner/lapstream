import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { info, warn } from "@tauri-apps/plugin-log";
import z from "zod";

export type ConnectionState =
    | "connecting"
    | "connected"
    | "disconnected"
    | "error";
export type WsMessage = { type: string; data?: any | undefined };
type HandlerT<S extends z.ZodType = z.ZodType> = {
    schema: S;
    handler: (data: z.infer<S>) => void;
};

/**
 * Define a typed handler for WebSocket messages.
 * @param handler
 * @param schema
 * @returns
 */
export const Handler = <S extends z.ZodType>(
    schema: S,
    handler: (data: z.infer<S>) => void,
): HandlerT<S> => ({
    schema,
    handler,
});

type Handlers = {
    [type: string]: HandlerT;
};

const WsMessageSchema = z.object({
    type: z.string(),
    data: z.any(),
});

type QueuedMessage = {
    message: WsMessage;
    // Whether the message should be resent when it is not immediately sent
    persist: boolean;
};

export const useWs = (handlers: Handlers) => {
    const [connStatus, setConnStatus] =
        useState<ConnectionState>("disconnected");
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );

    const messageQueueRef = useRef<QueuedMessage[]>([]);

    const handlersRef = useRef<Handlers>(handlers);
    handlersRef.current = handlers;

    const config = useAuthStore((s) => s.config);

    if (!config) {
        throw new Error("useWs requires an authenticated session");
    }

    useEffect(() => {
        const parsedUrl = new URL(config.base_url);
        const wsUrl = `ws://${parsedUrl.host}`;

        if (!socketRef.current) {
            const connect = () => {
                const socket = new WebSocket(wsUrl);
                socketRef.current = socket;

                socket.onclose = (e) => {
                    if (e.code !== 1000) {
                        warn(
                            `Websocket Closed! code: ${e.code}, reason: ${e.reason}, reconnecting!`,
                        );

                        reconnectTimeoutRef.current = setTimeout(connect, 3000);
                        setConnStatus("error");
                    } else {
                        setConnStatus("disconnected");
                    }
                };
                socket.onopen = () => {
                    setConnStatus("connected");
                    messageQueueRef.current.forEach(({ message, persist }) => {
                        if (persist) {
                            socketRef.current!.send(JSON.stringify(message));
                        }

                        info(
                            `WebSocket queued message sent: ${JSON.stringify(message)}`,
                        );
                    });
                    messageQueueRef.current = [];
                };
                socket.onerror = (_) => setConnStatus("error");
                socket.onmessage = (e) => {
                    info(`WebSocket message received: ${e.data}`);
                    try {
                        const data = JSON.parse(e.data);
                        const parsed = WsMessageSchema.safeParse(data);
                        const handler = handlersRef.current[data.type];
                        if (parsed.success && handler) {
                            const parsedData = handler.schema.safeParse(
                                parsed.data,
                            );
                            if (parsedData.success) {
                                handler.handler(parsedData.data);
                            }
                        }
                    } catch (e) {}
                };
            };

            setConnStatus("connecting");
            connect();
        }

        return () => {
            clearTimeout(reconnectTimeoutRef.current ?? undefined);
            socketRef.current?.close(1000);
            socketRef.current = null;
        };
    }, []);

    const sendMessage = useCallback((data: WsMessage) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            info(`WebSocket message sent: ${JSON.stringify(data)}`);
            socketRef.current.send(JSON.stringify(data));
            return "ok";
        } else {
            warn(
                `WebSocket is not open, message enqueued: ${JSON.stringify(data)}`,
            );
            messageQueueRef.current.push({ message: data, persist: true });
            return "err";
        }
    }, []);

    return { sendMessage, connStatus };
};
