import { Router } from "express";
import { setLanePlayerController } from "../controllers/lane.controller.js";
import { reqRole } from "../middleware/requireRole.js";


export const laneRouter = Router();

laneRouter.put('/:paceGroup/:position/player', reqRole('lane_assign'), setLanePlayerController)
