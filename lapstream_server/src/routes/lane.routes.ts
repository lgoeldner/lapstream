import { Router } from "express";
import { setLanePlayerController } from "../controllers/lane.controller.js";
import { reqRole } from "../middleware/requireRole.js";
import { deleteLanePlayerController } from "../controllers/player.controller.js";


export const laneRouter = Router();

// Add and remove a player from a specific lane
laneRouter.put('/:paceGroup/:position/player', reqRole('lane_assign'), setLanePlayerController)
laneRouter.delete('/:paceGroup/:position/player', reqRole('lane_assign'), deleteLanePlayerController)
