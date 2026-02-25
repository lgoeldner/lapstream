import { Router } from "express";
import { assignPlayerToSlotController, getPlayerSlotsController, removePlayerFromSlotController } from "../controllers/playerAdmin.controller.js";
import { reqRole } from "../middleware/requireRole.js";


export const slotRouter = Router();

slotRouter.put('/assign', reqRole('reception'), assignPlayerToSlotController);
slotRouter.delete('/player/:id', reqRole('reception'), removePlayerFromSlotController);
slotRouter.get('/', reqRole('reception'), getPlayerSlotsController);
