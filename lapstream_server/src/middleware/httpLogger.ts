import pinoHttp from "pino-http";
import type { LevelWithSilent } from "pino";
import type { IncomingMessage, ServerResponse } from "http";
import { logger } from "../logger.js";
import { Request, Response } from "express";

export const httpLogger = pinoHttp.default<Request, Response>({
    // @ts-expect-error this line gets a type error without ts-ignore TODO: fix
    logger,
    customLogLevel(
        _req: IncomingMessage,
        res: ServerResponse,
        error?: Error,
    ): LevelWithSilent {
        if (error || res.statusCode >= 500) {
            return "error";
        }

        if (res.statusCode >= 400) {
            return "warn";
        }

        return "info";
    },
    customSuccessMessage(req, res: ServerResponse) {
        return `${req.method} ${req.originalUrl} -> ${res.statusCode}`;
    },
    customErrorMessage(req, res: ServerResponse, error: Error) {
        return `${req.method} ${req.originalUrl} -> ${res.statusCode}: ${error.message}`;
    },
});
