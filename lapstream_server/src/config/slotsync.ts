/**
 * this module is supposed to sync the serverConfig.paceGroups
 * to the playerSlotTable by keeping a versioned Table of paceGroups in the serverConfig, 
 * comparing after each server start and repopulating on a config change
 */

import { asc, desc } from "drizzle-orm";
import { playerSlotTable, playerSlotVersionTable, playersTable } from "../db/schema.js";
import { db } from "./db.js";
import { serverConfig } from "./env.js";

export const doSync = async () => {

    const lastState = await db.select().from(playerSlotVersionTable)
        .orderBy(desc(playerSlotVersionTable.id))
        .limit(1);

    const s = JSON.stringify(serverConfig.paceGroups);
    console.log(s)
    if (lastState[0]?.val === s) {
        return
    } else {
        await db.insert(playerSlotVersionTable).values({ val: s })
    }

    let to_insert = [];
    for (let x of serverConfig.paceGroups) {
        for (let i = 0; i <= x.count; i += 1) {
            console.log(`${x.name}${i}`)
            to_insert.push({ paceGroup: x.name, slotIndex: i })
        }
    }

    await db.delete(playerSlotTable);
    await db.insert(playerSlotTable).values(to_insert);

    console.log(`synced up!`);


};