import { createHmac, randomBytes, randomInt } from "crypto";
import { logger } from "../logger.js";
import { OtpClaims, Role } from "../controllers/auth.controller.js";
import { db } from "../config/db.js";
import { clientsTable, otpCodeTable, refreshTokenTable } from "../db/schema.js";
import { and, eq, gt } from "drizzle-orm";
import { SignJWT } from 'jose';
import { env } from "../config/env.js";


// TODO: move to db
// the list of generated OTPs (key) to their associated permissions, expiry and wether they were already used (val)
// const OTPs: Record<string, { claims: AccessClaims, expiry: Date, unused: boolean }> = {};
const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_LENGTH = 6;

type ValidateResult = { status: 'ok', data: ClientData } | { status: 'failure', err: string };
// Known Data about a client, including client id, role, name, and registered_at
type ClientData = typeof clientsTable.$inferSelect;

type EnrollResult =
    { status: 'failure', err: string }
    | {
        status: 'ok', data: {
            role: Role,
            name?: string | undefined,
            credentials: {
                jwt: string,
                refresh_token: string
            }
        }
    };

// OTPs are bound to their device name and role
export const generateOTPs = async (claims: OtpClaims) => {
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
    await db.insert(otpCodeTable).values(otps);

    logger.info(`issued ${JSON.stringify(otps)}`);
    return otps;
};

// use an OTP to get a JWT Access Token + refresh token
// only valid for the permissions intended by the admin (when creating the OTP)


export const enroll = async (otp_code: string): Promise<EnrollResult> => {
    // validate the OTP and create the new User
    const new_user = await validateOTP(otp_code);
    // generate JWT, refresh token
    if (new_user.status === 'failure') return new_user;

    const credentials = await generateCredentials(new_user.data);
    return { status: 'ok', data: { ...new_user.data, credentials } };
};


const validateOTP = async (otp_code: string): Promise<ValidateResult> => {
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

        if (err instanceof Error) {
            return { status: 'failure', err: err.message };
        }

        return { status: 'failure', err: 'unknown' };
    }
};



const generateCredentials = async (client: ClientData): Promise<{ jwt: string, refresh_token: string }> => {
    const jwt = await generateJWT(client);
    const refresh_token = generateRefreshToken();
    // insert refresh token into db
    await db.insert(refreshTokenTable).values({
        tokenHash: hashRefreshToken(refresh_token),
        clientId: client.id
    });
    logger.info(`created client credentials for client ${client.id}`)

    return { jwt, refresh_token }
}

const generateRefreshToken = () => randomBytes(64).toString('base64');

const JWT_ALG = 'HS256';
const generateJWT = (client: ClientData): Promise<string> => {
    return new SignJWT({ role: client.role })
        .setProtectedHeader({ alg: JWT_ALG })
        .setIssuedAt()
        .setExpirationTime(new Date().getSeconds() + 10 * 60)
        .setSubject(client.id.toString())
        .setAudience("lapstream-api")
        .sign(env.JWT_SECRET);
};

const hashRefreshToken = (token: string) =>
    createHmac('sha256', env.REFRESH_TOKEN_PEPPER)
        .update(token)
        .digest('base64');
