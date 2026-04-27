/**
 * contains the Logic for registering a user and assigning to a specific lane slot
*/


import type { RequestHandler } from 'express';
import { z } from 'zod';
import { getPlayerByID as getPlayerByID, getPlayers, getPlayerSlots, registerPlayer as newPlayer, removePlayerFromSlot } from '../services/playerAdmin.service.js';
import { logger } from '../logger.js';
import { err, ok } from '../lib/apiResponse.js';

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
        return res.status(201).json(ok(data));
    }

    return res.status(400).json(err(p.error));
};

export const getPlayerController: RequestHandler = async (req, res) => {
    if (req.params.id) {
        const player_id = parseInt(req.params.id as string);
        if (!player_id) {
            return res.status(400).json(err('failed to parse id: must be a number!'));
        }

        return res.status(200).json(ok(await getPlayerByID(player_id)));
    }

    return res.status(200).json(ok(await getPlayers()));
};

export const deleteLanePlayerController: RequestHandler = async (req, res) => {
    const player_id = parseInt(req.params.id as string);

    if (!player_id)
        return res.status(400).json(err('missing player ID'));

    const ret = await removePlayerFromSlot(player_id);

    return res.status((ret.status === 'ok') ? 200 : 400).json(ret);
};

export const getPlayerSlotsController: RequestHandler = async (req, res) => {
    const data = await getPlayerSlots();
    logger.info(`returning: ${JSON.stringify(data)}`);
    return res.status(200).json(ok(data));
};
