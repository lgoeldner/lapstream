import { randomInt } from "crypto";
import { RequestHandler } from "express";
import { logger } from "../logger.js";
import { otpRequest as otpRequests } from "../controllers/auth.controller.js";
import { db } from "../config/db.js";
import { otpCodeTable } from "../db/schema.js";




// TODO: move to db
// the list of generated OTPs (key) to their associated permissions, expiry and wether they were already used (val)
// const OTPs: Record<string, { claims: AccessClaims, expiry: Date, unused: boolean }> = {};
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_LENGTH = 6;

// use server side to get an OTP enrollment code
export const generateOTPs = async (claims: otpRequests) => {
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
    db.insert(otpCodeTable).values(otps).returning();

    logger.info(`issued ${JSON.stringify(otps)}`)
    return otps;
};

// use an OTP to get a JWT Access Token + refresh token
// only valid for the permissions intended by the admin (when creating the OTP)
export const validateOTP: RequestHandler = async (req, res) => { };
