import { Router } from "express";
import { registerPlayerController } from "../controllers/playerAdmin.controller.js";

export const playerRouter = Router();

playerRouter.post('/register', registerPlayerController)



