import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../config/db.js';
import { assignPlayerDTO } from '../controllers/playerAdmin.controller.js';
import { playerSlotRow, playerSlotRow as PlayerSlotRow, playerSlotTable, playersTable } from '../db/schema.js';
import { logger } from '../logger.js';

export type NewUserInput = {
    name: string;
    age: number;
};

/**
 * Register a new Player, returning the new ID
 */
export const registerPlayer = async (input: NewUserInput): Promise<typeof playersTable.$inferSelect | 'failure'> => {
    const toInsert: typeof playersTable.$inferInsert = input;
    const result = await db
        .insert(playersTable)
        .values(toInsert)
        .returning();

    return result[0] ?? 'failure';
};

type AssignPlayerResult = { status: 'ok', data: PlayerSlotRow }
    | { status: 'failure', reason: 'player already assigned' | "slot doesn't exist" | 'slot taken' };
export const assignPlayerToSlot = async (player: assignPlayerDTO): Promise<AssignPlayerResult> => {
    // todo: check for player already assigned
    const playerIsAlreadyAssigned = await db.query.playerSlotTable
        .findFirst({ where: eq(playerSlotTable.assignedPlayer, player.id) });

    if (playerIsAlreadyAssigned) {
        return { status: 'failure', reason: 'player already assigned' };
    }

    // todo: check if the slot exists and was empty
    const updated = await db.update(playerSlotTable)
        .set({ assignedPlayer: player.id })
        .where(
            and(
                isNull(playerSlotTable.assignedPlayer),
                eq(playerSlotTable.paceGroup, player.assign_to.pace_group),
                eq(playerSlotTable.slotIndex, player.assign_to.slot)
            )
        ).returning();
    // if no slot was updated, something failed
    if (updated.length !== 1) {
        logger.warn(`player id=${player.id} could not be assigned to ${JSON.stringify(player.assign_to)}`);
        return { status: 'failure', reason: 'slot taken' };
    }

    return { status: 'ok', data: updated[0]! };
};

type removePlayerResult = { status: 'ok', data: playerSlotRow } | { status: 'failure' };

export const removePlayerFromSlot = async (player_id: number): Promise<removePlayerResult> => {
    const ret = await db.update(playerSlotTable)
        .set({ assignedPlayer: null })
        .where(eq(playerSlotTable.assignedPlayer, player_id))
        .returning();

    // send 'player_left' event to 'lap_counter' type clients

    return (ret[0]) ? { status: 'ok', data: ret[0] } : { status: 'failure' };
};

export const getPlayerSlots = async (): Promise<typeof playerSlotTable.$inferSelect[]> => {
    return await db.select().from(playerSlotTable);
};
