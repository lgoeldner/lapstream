import { Router } from "express";
import { assignPlayerToSlotController, getPlayerSlotsController, removePlayerFromSlotController } from "../controllers/playerAdmin.controller.js";


export const slotRouter = Router();

slotRouter.put('/assign', assignPlayerToSlotController);
slotRouter.delete('/player/:id', removePlayerFromSlotController);
slotRouter.get('/', getPlayerSlotsController);
