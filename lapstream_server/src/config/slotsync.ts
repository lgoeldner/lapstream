/**
 * this module is supposed to sync the serverConfig.paceGroups
 * to the playerSlotTable by keeping a versioned Table of paceGroups in the serverConfig, 
 * comparing after each server start and repopulating on a config change
 */

import { desc } from "drizzle-orm";
import { playerSlotTable, playerSlotVersionTable } from "../db/schema.js";
import { db } from "./db.js";
import { serverConfig } from "./env.js";
import { logger } from "../logger.js";

export const doSync = async () => {

    const lastState = await db.select().from(playerSlotVersionTable)
        .orderBy(desc(playerSlotVersionTable.id))
        .limit(1);

    const s = JSON.stringify(serverConfig.paceGroups);
    logger.debug({ paceGroups: s }, 'pace groups snapshot');
    if (lastState[0]?.val === s) {
        return
    } else {
        await db.insert(playerSlotVersionTable).values({ val: s })
    }

    const to_insert = [];
    for (const x of serverConfig.paceGroups) {
        for (let i = 0; i <= x.count; i += 1) {
            logger.debug({ paceGroup: x.name, slotIndex: i }, 'creating slot');
            to_insert.push({ paceGroup: x.name, slotIndex: i })
        }
    }

    await db.delete(playerSlotTable);
    await db.insert(playerSlotTable).values(to_insert);

    logger.info('slot sync completed');
};
