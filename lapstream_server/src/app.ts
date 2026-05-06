import cors from "cors";
import express, { type Express } from "express";
import { laneRouter } from "./routes/lane.routes.js";
import { playerRouter } from "./routes/player.routes.js";
import { httpLogger } from "./middleware/httpLogger.js";
import { authRouter } from "./routes/auth.routes.js";
import { ok } from "./lib/apiResponse.js";
import expressWs from "express-ws";

export const buildApp = (): Express => {
    const app_ = express();
    const ws = expressWs(app_);
    const app = ws.app;

    app.use(httpLogger);
    app.use(cors());
    app.use(express.json());

    app.get("/", (_req, res) =>
        res.json(ok({ service: "lapstream-server", online: true })),
    );
    app.use("/lane", laneRouter);
    app.use("/player", playerRouter);
    app.use("/auth", authRouter);

    app.ws("/", (ws, _req) => {
        ws.on("message", (data) => {
            console.log(data);
            ws.send(data);
        });
        ws.on("")
    });

    return app;
};
