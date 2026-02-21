import { Router } from "express";
import { assignPlayerToSlotController, registerPlayerController } from "../controllers/playerAdmin.controller.js";

export const playerRouter = Router();

playerRouter.post('/register', registerPlayerController)



