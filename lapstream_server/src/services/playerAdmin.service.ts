import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { playerSlotRow, playerSlotTable, playersTable } from '../db/schema.js';
import { ApiResponse, err, ok } from '../lib/apiResponse.js';

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


type removePlayerResult = ApiResponse<playerSlotRow>;

export const removePlayerFromSlot = async (player_id: number): Promise<removePlayerResult> => {
    const ret = await db.update(playerSlotTable)
        .set({ assignedPlayer: null })
        .where(eq(playerSlotTable.assignedPlayer, player_id))
        .returning();

    // send 'player_left' event to 'lap_counter' type clients

    return ret[0] ? ok(ret[0]) : err(`${player_id} is not assigned to a lane`);
};

export const getPlayerSlots = async (): Promise<typeof playerSlotTable.$inferSelect[]> => {
    return db.select().from(playerSlotTable);
};

export const getPlayerByID = async (player_id: number): Promise<typeof playersTable.$inferSelect | null> => {
    return db.select()
        .from(playersTable)
        .where(eq(playersTable.id, player_id))
        .then(it => it[0] ?? null);
};

export const getPlayers = async (): Promise<typeof playersTable.$inferSelect[]> => db.select().from(playersTable);
