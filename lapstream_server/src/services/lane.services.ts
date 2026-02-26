import { and, eq, isNull } from "drizzle-orm";
import { db } from "../config/db.js";
import { playerSlotTable } from "../db/schema.js";
import { logger } from "../logger.js";

type PlayerSlotRow = typeof playerSlotTable.$inferSelect;



type AssignPlayerResult = { status: 'ok', data: PlayerSlotRow }
    | { status: 'failure', err: string };

/**
 * Assign a player to a lane slot, if the slot is not already taken and the player is not already assigned to another slot
 * @param pace_group 
 * @param position 
 * @param player_id 
 * @returns 
 */
export const setLanePlayer = async (pace_group: string, position: number, player_id: number): Promise<AssignPlayerResult> => {
    // todo: check for player already assigned
    try {
        const updated = await db.transaction(async (tx) => {
            const playerIsAlreadyAssigned = await tx.query.playerSlotTable
                .findFirst({ where: eq(playerSlotTable.assignedPlayer, player_id) });

            if (playerIsAlreadyAssigned) {
                throw Error('player already assigned');
            }

            return await db.update(playerSlotTable)
                .set({ assignedPlayer: player_id })
                .where(
                    and(
                        isNull(playerSlotTable.assignedPlayer),
                        eq(playerSlotTable.paceGroup, pace_group),
                        eq(playerSlotTable.slotIndex, position)
                    )
                ).returning();
        });

        if (!updated[0]) {
            logger.warn(`player id=${player_id} could not be assigned to pace_group=${pace_group} position=${position}`);
            return { status: 'failure', err: 'slot taken' };
        }

        return { status: 'ok', data: updated[0] };
    } catch (err) {
        logger.error({ err }, 'Error during player assignment transaction');
        if (err instanceof Error) {
            return { status: 'failure', err: err.message };
        }

        return { status: 'failure', err: 'unknown error' };
    }
};