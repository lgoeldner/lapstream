/**
 * contains the Logic for registering a user and assigning to a specific lane slot
*/


import type { RequestHandler } from 'express';
import { z } from 'zod';
import { assignPlayerToSlot, registerPlayer, removePlayerFromSlot } from '../services/playerAdmin.service.js';

const newUserSchema = z.object({
    name: z.string(),
    age: z.int(),
});

/**
 * 
 * @returns status and participant id, if successful
 */
export const registerPlayerController: RequestHandler = async (req, res) => {
    const p = newUserSchema.safeParse(req.body);
    if (p.success) {
        const id = await registerPlayer(p.data);
        return res.status(201).json({ status: 'success', id });
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
    console.log(r);
    if (!r.success)
        return res.status(500).json({ status: "failure", err: r.error });
    const rs = await assignPlayerToSlot(r.data);

    if (rs === 'failure')
        return res.status(400).json({ status: "failure", err: 'player already assigned' });

    return res.status(201).json({ status: "success" });
};

const removePlayerSchema = z.object({
    id: z.int()
});
export type removePlayerDTO = z.infer<typeof removePlayerSchema>;

export const removePlayerFromSlotController: RequestHandler = async (req, res) => {
    const r = removePlayerSchema.safeParse(req.body);


    if (r.success) {
        const ret = await removePlayerFromSlot(r.data);

        if (ret === 'success')
            return res.status(200).json({ status: ret });
    }

    return res.status(400).json({ status: "failure", err: r.error ?? 'player not found' });
};