import { Router } from "express";
import { setLanePlayerController } from "../controllers/lane.controller.js";
import { reqRole } from "../middleware/requireRole.js";
import { deleteLanePlayerController } from "../controllers/player.controller.js";
import { getPaceGroups } from "../services/lane.services.js";
import { ok } from "../lib/apiResponse.js";


export const laneRouter = Router();

// Add and remove a player from a specific lane
laneRouter.put('/:paceGroup/:position/player', reqRole('lane_assign'), setLanePlayerController)
laneRouter.delete('/:paceGroup/:position/player', reqRole('lane_assign'), deleteLanePlayerController)

laneRouter.get('/pace-groups', (_req, res) => {
    res.json(ok(getPaceGroups()));
});
