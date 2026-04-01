import { timingSafeEqual } from "crypto";
import { RequestHandler } from "express";
import { z } from 'zod';
import { env } from "../config/env.js";
import { logger } from "../logger.js";
import { enroll, generateOTPs } from "../services/auth.services.js";
import { refreshToken } from "../services/auth.services.js";



const otpClaimsSchema = z.array(z.object({
    role: z.enum(['admin', 'reception', 'lane_assign', 'lane_count']),
    name: z.string().optional()
}));
export type OtpClaims = z.infer<typeof otpClaimsSchema>;
export type Role = z.infer<typeof otpClaimsSchema.element.shape.role>;

const authenticateSuperUser = (auth_header: string | undefined): { status: 'ok' } | { status: 'failure', err: string } => {
    if (!auth_header) {
        logger.warn(`no admin token on request to gen OTPs`)
        return { status: 'failure', err: 'missing admin token' };
    }
    // remove 'Bearer ' prefix and transform to 
    const usr_input = auth_header.replace(/Bearer\s/i, '');
    const user_token = Buffer.from(usr_input, "utf8");
    const api_token = env.ADMIN_API_TOKEN;

    if (user_token.byteLength != api_token.byteLength || !timingSafeEqual(user_token, api_token)) {
        logger.warn('admin token wrong')
        return { status: 'failure', err: 'Admin Token mismatch' };
    }

    return { status: 'ok' };
};

export const generateOTPsAdminController: RequestHandler = async (req, res) => {
    // authenticate admin via admin api token
    const input = req.headers.authorization;
    const isAuthorized = authenticateSuperUser(input);
    if (isAuthorized.status === 'failure') {
        return res.status(401).json(isAuthorized.err);
    }

    // authentication as admin OK

    const claims = otpClaimsSchema.safeParse(req.body);
    if (claims.error) {
        return res.status(400).json({ status: 'failure', error: claims.error })
    }

    // generate and return OTPs
    const ret = await generateOTPs(claims.data);
    return res.status(200).json(ret);
};

const enrollSchema = z.object({ otp: z.string().length(6) });
export const enrollController: RequestHandler = async (req, res) => {
    const parseRes = enrollSchema.safeParse(req.body);
    if (!parseRes.success) {
        return res.status(400).json({ status: 'failure', err: parseRes.error });
    }
    const s = await enroll(parseRes.data.otp);

    return res.status((s.status == 'ok') ? 200 : 400).json(s);
};

const refreshSchema = z.object({
    refresh_token: z.string().min(10)
});

export const refreshController: RequestHandler = async (req, res) => {
    const parseRes = refreshSchema.safeParse(req.body);
    if (!parseRes.success) {
        return res.status(400).json({ status: 'failure', err: 'invalid request format' });
    }

    const result = await refreshToken(parseRes.data.refresh_token);

    return res.status((result.status === 'ok') ? 200 : 401).json(result);
};
