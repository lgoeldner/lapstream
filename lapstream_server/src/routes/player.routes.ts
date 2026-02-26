import { Router } from "express";
import { reqRole } from "../middleware/requireRole.js";
import {
    newPlayerController,
    removePlayerFromSlotController,
    getPlayerController
} from "../controllers/player.controller.js";

/**
 * The player API contains CRUD methods for creating and managing players
 */

export const playerRouter = Router();

playerRouter.post('/', reqRole('reception'), newPlayerController)

// filter by id is optional on GET /player/
playerRouter.get('/{:id}', reqRole('reception'), getPlayerController)
//playerRouter.get('/', reqRole('reception'), getPlayerController)

playerRouter.delete('/lane/:id', reqRole('reception'), removePlayerFromSlotController);
