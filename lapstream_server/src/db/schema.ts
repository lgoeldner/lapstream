import { sql, relations } from "drizzle-orm";
import { integer, pgTable, varchar, text, primaryKey, timestamp, pgEnum, boolean, char } from "drizzle-orm/pg-core";
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

export const rolesEnum = pgEnum('device_role', ['reception', 'lane_assign', 'lane_count']);
export const otpCodeTable = pgTable("otp_codes", {
    otp: char({ length: 6 }).primaryKey(),
    deviceName: text('device_name').notNull(),
    role: rolesEnum('role').notNull(),
    issuedAt: timestamp('issued_at').defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
    wasUsed: boolean('was_used').default(false)
})

export const slotTableRelations = relations(playerSlotTable, (r) => ({
    assignedPlayer: r.one(playersTable, {
        fields: [playerSlotTable.assignedPlayer],
        references: [playersTable.id]
    })
}));
