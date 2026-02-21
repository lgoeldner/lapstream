import { sql, relations } from "drizzle-orm";
import { integer, pgTable, varchar, text, primaryKey, timestamp } from "drizzle-orm/pg-core";
/**
 * contains all registered Users
 */
export const playersTable = pgTable("players", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    age: integer().notNull(),
});

/**
 * contains all slots for players. Every slot may be taken by up to one player.
 * TODO: make paceGroup and slotIndex be the primary Key
 */
export const playerSlotTable = pgTable("player_slot", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    paceGroup: text("pace_group").notNull(),
    slotIndex: integer("slot_index").notNull(),
    assignedPlayer: integer().default(sql`NULL`).references(() => playersTable.id)
});
export type playerSlotRow = typeof playerSlotTable.$inferSelect


export const playerSlotVersionTable = pgTable("player_slot_versioning", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    val: text().notNull(),
})

export const slotTableRelations = relations(playerSlotTable, (r) => ({
    assignedPlayer: r.one(playersTable, {
        fields: [playerSlotTable.assignedPlayer],
        references: [playersTable.id]
    })
}));