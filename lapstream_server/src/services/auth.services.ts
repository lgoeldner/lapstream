import { randomInt } from "crypto";
import { logger } from "../logger.js";
import { otpClaims } from "../controllers/auth.controller.js";
import { db } from "../config/db.js";
import { clientsTable, otpCodeTable } from "../db/schema.js";
import { and, DrizzleError, eq, gt, not } from "drizzle-orm";
import { ZodError } from "zod";




// TODO: move to db
// the list of generated OTPs (key) to their associated permissions, expiry and wether they were already used (val)
// const OTPs: Record<string, { claims: AccessClaims, expiry: Date, unused: boolean }> = {};
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_LENGTH = 6;

// use server side to get an OTP enrollment code
export const generateOTPs = async (claims: otpClaims) => {
    // TODO: handle collisions
    const otps = claims.map(claim => ({
        otp: randomInt(0, 1_000_000)
            .toString()
            .padStart(OTP_LENGTH, '0'),
        role: claim.role,
        deviceName: claim.name!,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    }));
    // add OTPs to DB
    await db.insert(otpCodeTable).values(otps).returning();

    logger.info(`issued ${JSON.stringify(otps)}`)
    return otps;
};

// use an OTP to get a JWT Access Token + refresh token
// only valid for the permissions intended by the admin (when creating the OTP)
type validateOTPResult =
    { status: 'failure', err: string }
    | {
        status: 'ok', data: {
            role: "reception" | "lane_assign" | "lane_count";
            name?: string | undefined;
        }
    };
export const validateOTP = async (otp_code: string): Promise<validateOTPResult> => {
    try {
        const s = await db.transaction(async (tx) => {
            const dr = await tx
                .delete(otpCodeTable)
                .where(
                    and(
                        eq(otpCodeTable.otp, otp_code),
                        gt(otpCodeTable.expiresAt, new Date()),
                    )
                ).returning();

            if (dr.length != 1) {
                logger.warn(`While validating OTP ${otp_code} got ${JSON.stringify(dr)} from DB, length != 1`);
                throw new Error(`could not verify OTP`);
            }

            const data = dr[0]!;

            return tx.insert(clientsTable).values({
                role: data.role,
                deviceName: data.deviceName,
            }).returning();
        })
        return { status: 'ok', data: s[0]! };
    } catch (err) {
        logger.error(`exception in validateOTP: ${err as Error}`)

        if (err instanceof ZodError) {
            return { status: 'failure', err: err.message };
        } else if (err instanceof DrizzleError) {
            return { status: 'failure', err: err.message };
        } else if (err instanceof Error) {
            return { status: 'failure', err: err.message };
        }

        return { status: 'failure', err: 'unknown' };
    }
};
