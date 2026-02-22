import { timingSafeEqual } from "crypto";
import { RequestHandler } from "express";
import { z } from 'zod';
import { env } from "../config/env.js";
import { logger } from "../logger.js";
import { generateOTPs } from "../services/auth.services.js";



const otpRequestsSchema = z.array(z.object({
    role: z.enum(['reception', 'lane_assign', 'lane_count']),
    name: z.string().optional()
}));
export type otpRequest = z.infer<typeof otpRequestsSchema>


export const generateOTPsAdminController: RequestHandler = async (req, res) => {
    // authenticate admin via admin api token
    const input = req.headers.authorization;

    if (!input) {
        logger.warn(`no admin token on request to gen OTPs`)
        return res.status(401).json({ status: 'failure', error: 'missing admin token' })
    }
    // remove 'Bearer ' prefix
    const input_token = input.replace(/Bearer\s/i, '');
    const a = Buffer.from(input_token, "utf8");
    const b = Buffer.from(env.ADMIN_API_TOKEN, "utf8");

    logger.info(`${a} === ${b}`)

    if (a.byteLength != b.byteLength || !timingSafeEqual(a, b)) {
        logger.warn('admin token wrong')
        return res.status(401).json({ status: 'failure', error: 'Admin Token mismatch' })
    }
    // authentication as admin OK

    const claims = otpRequestsSchema.safeParse(req.body);
    if (claims.error) {
        return res.status(400).json({ status: 'failure', error: claims.error })
    }

    // generate and return OTPs
    const ret = await generateOTPs(claims.data);
    return res.status(200).json(ret);
};

