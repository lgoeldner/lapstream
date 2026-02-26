/**
 * contains the Logic for registering a user and assigning to a specific lane slot
*/


import type { RequestHandler } from 'express';
import { z } from 'zod';
import { assignPlayerToSlot, getPlayerByID as getPlayerByID, getPlayers, getPlayerSlots, registerPlayer as newPlayer, removePlayerFromSlot } from '../services/playerAdmin.service.js';
import { logger } from '../logger.js';

const newUserSchema = z.object({
    name: z.string(),
    age: z.int(),
});

/**
 * 
 * @returns status and participant id, if successful
 */
export const newPlayerController: RequestHandler = async (req, res) => {
    const p = newUserSchema.safeParse(req.body);
    if (p.success) {
        const data = await newPlayer(p.data);
        return res.status(201).json({ status: 'ok', data });
    }

    return res.status(500).json({ status: 'failure', err: p.error });
};


const assignPlayerSchema = z.object({
    id: z.int(),
    assign_to: z.object({
        pace_group: z.string(),
        slot: z.int()
    })
});

export type assignPlayerDTO = z.infer<typeof assignPlayerSchema>;

export const assignPlayerToSlotController: RequestHandler = async (req, res) => {
    const r = assignPlayerSchema.safeParse(req.body);
    logger.debug({ parseResult: r }, 'assign player payload parsed');
    if (!r.success)
        return res.status(500).json({ status: "failure", err: r.error });
    const rs = await assignPlayerToSlot(r.data);

    if (rs.status === 'failure')
        return res.status(400).json(rs);

    return res.status(201).json(rs);
};

export const getPlayerController: RequestHandler = async (req, res) => {
    if (req.params.id) {
        const player_id = parseInt(req.params.id as string);
        if (!player_id) {
            return res.status(400).json({ status: 'failure', err: 'failed to parse id: must be a number!' });
        }

        return res.status(200).json({ status: 'ok', data: await getPlayerByID(player_id) });
    }

    return res.status(200).json({ status: 'ok', data: await getPlayers() });
};

export const removePlayerFromSlotController: RequestHandler = async (req, res) => {
    const player_id = parseInt(req.params.id as string);

    if (!player_id)
        return res.status(400).json({ status: 'failure', err: 'missing player ID' });

    const ret = await removePlayerFromSlot(player_id);

    return res.status((ret.status === 'ok') ? 200 : 400).json(ret);
};

export const getPlayerSlotsController: RequestHandler = async (req, res) => {
    const data = await getPlayerSlots();
    logger.info(`returning: ${JSON.stringify(data)}`);
    return res.status(200).json(data);
};
