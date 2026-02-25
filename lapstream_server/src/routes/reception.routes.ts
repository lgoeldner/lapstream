import { Router } from "express";
import { newPlayerController as newPlayerController } from "../controllers/playerAdmin.controller.js";
import { reqRole } from "../middleware/requireRole.js";

export const receptionRouter = Router();

receptionRouter.post('/player/new', reqRole('reception'), newPlayerController)



