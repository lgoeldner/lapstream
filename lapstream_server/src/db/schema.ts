import { sql, relations } from "drizzle-orm";
import { integer, pgTable, varchar, text, timestamp, pgEnum, char } from "drizzle-orm/pg-core";
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
    assignedPlayer: integer("assigned_player").default(sql`NULL`).references(() => playersTable.id)
});
export type playerSlotRow = typeof playerSlotTable.$inferSelect

export const playerSlotVersionTable = pgTable("player_slot_versioning", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    val: text().notNull(),
})

export const rolesEnum = pgEnum('device_role', ['reception', 'lane_assign', 'lane_count', 'admin']);

export const otpCodeTable = pgTable("otp_codes", {
    otp: char({ length: 6 }).primaryKey(),
    deviceName: text('device_name').notNull(),
    role: rolesEnum('role').notNull(),
    issuedAt: timestamp('issued_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull(),
})

// each client is a device
export const clientsTable = pgTable('clients', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    deviceName: text('device_name').notNull(),
    role: rolesEnum('role').notNull(),
    registeredAt: timestamp('registered_at').notNull().defaultNow(),
});

export const refreshTokenTable = pgTable('refresh_token', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    clientId: integer("client_id").notNull(),
    tokenHash: varchar('token_hash').notNull(),
    issuedAt: timestamp('issued_at').notNull().defaultNow(),
    // token is invalid after usage, revoked_at set with each usage
    revokedAt: timestamp('revoked_at')
});

export const refreshRelations = relations(refreshTokenTable, (r) => ({
    tokenId: r.one(clientsTable, {
        fields: [refreshTokenTable.clientId],
        references: [clientsTable.id]
    })
}));

export const slotTableRelations = relations(playerSlotTable, (r) => ({
    assignedPlayer: r.one(playersTable, {
        fields: [playerSlotTable.assignedPlayer],
        references: [playersTable.id]
    })
}));
