import type { RequestHandler } from 'express';
import { z } from 'zod';
import { setLanePlayer } from '../services/lane.services.js';
import { logger } from '../logger.js';



const lanePlayerAssignBodySchema = z.object({
    player_id: z.int(),
});

export type setLanePlayerDTO = z.infer<typeof lanePlayerAssignBodySchema>;

const laneIdParamSchema = z.object({
    paceGroup: z.string(),
    position: z.string().transform(it => parseInt(it)),
});

/**
 * Assign a player to a lane slot
 * @route PUT /:paceGroup/:position/player
 * Route parameters:
 * - paceGroup: string
 * - position: string
 * Body parameters:
 * - player_id: number
 * Response:
 * - 201: { status: 'success', data: { pace_group: string, position: string, player_id: number } }
 * - 400: { status: 'failure', err: string }
 */
export const setLanePlayerController: RequestHandler = async (req, res) => {
    logger.info({ par: req.params });
    const parseRes = laneIdParamSchema.safeParse(req.params);
    if (!parseRes.success) {
        return res.status(400).json({ status: 'failure', err: parseRes.error });
    }

    const { paceGroup, position } = parseRes.data;

    const r = lanePlayerAssignBodySchema.safeParse(req.body);

    if (!r.success) {
        return res.status(400).json({ status: "failure", err: r.error });
    }

    const rs = await setLanePlayer(paceGroup, position, r.data.player_id);

    if (rs.status === 'failure')
        return res.status(400).json(rs);

    return res.status(200).json(rs);
};