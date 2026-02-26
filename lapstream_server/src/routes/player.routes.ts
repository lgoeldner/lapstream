import { Router } from "express";
import { reqRole } from "../middleware/requireRole.js";
import {
    newPlayerController,
    removePlayerFromSlotController,
    assignPlayerToSlotController,
    getPlayerController
} from "../controllers/playerAdmin.controller.js";

/**
 * The player API contains CRUD methods for creating and managing players
 */

export const playerRouter = Router();

playerRouter.put('/assign', reqRole('lane_assign'), assignPlayerToSlotController);
playerRouter.post('/new', reqRole('reception'), newPlayerController)

// filter by id is optional on GET /player/
playerRouter.get('/{:id}', reqRole('reception'), getPlayerController)
//playerRouter.get('/', reqRole('reception'), getPlayerController)

playerRouter.delete('/:id', reqRole('reception'), removePlayerFromSlotController);
