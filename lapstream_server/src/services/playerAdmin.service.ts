import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../config/db.js';
import { assignPlayerDTO, removePlayerDTO } from '../controllers/playerAdmin.controller.js';
import { playerSlotTable, playersTable } from '../db/schema.js';
import e from 'cors';

export type NewUserInput = {
  name: string;
  age: number;
};

/**
 * Register a new Player, returning the new ID
 */
export const registerPlayer = async (input: NewUserInput): Promise<number | undefined> => {
  const toInsert: typeof playersTable.$inferInsert = input;
  const result = await db
    .insert(playersTable)
    .values(toInsert)
    .returning({ id: playersTable.id });

  return result[0]?.id;
};

export const assignPlayerToSlot = async (player: assignPlayerDTO) => {
  // todo: check for player already assigned
  const playerIsAlreadyAssigned = await db.query.playerSlotTable
    .findFirst({ where: eq(playerSlotTable.assignedPlayer, player.id) });

  if (playerIsAlreadyAssigned) {
    return 'failure';
  }

  await db.update(playerSlotTable)
    .set({ assignedPlayer: player.id })
    .where(
      and(
        isNull(playerSlotTable.assignedPlayer),
        eq(playerSlotTable.paceGroup, player.assign_to.pace_group),
        eq(playerSlotTable.slotIndex, player.assign_to.slot)
      )
    );

  return 'success';
};

export const removePlayerFromSlot = async ({ id }: removePlayerDTO): Promise<"failure" | "success"> => {
  const ret = await db.update(playerSlotTable)
    .set({ assignedPlayer: null })
    .where(eq(playerSlotTable.assignedPlayer, id))
    .returning();
  console.log(ret);

  return (ret[0]) ? 'success' : 'failure';
};