import { RequestHandler } from "express";
import { Role } from "../controllers/auth.controller.js";
import { logger } from "../logger.js";
import * as jose from 'jose';
import { env } from "../config/env.js";

export const reqRole = (required: Role): RequestHandler => async (req, res, next) => {
    const a = req.headers.authorization;
    const jwt = a?.replace(/Bearer\s/i, '');
    if (!jwt) {
        logger.warn('Auth Missing!');
        return res.status(403).json({
            status: 'failure',
            err: `missing authentication! enroll device with '${required}' permissions first`
        });
    }

    // verify the JWT
    const verified = await jose.jwtVerify(jwt, env.JWT_SECRET);

    // check for expiry date
    if (!verified.payload.exp || verified.payload.exp <= new Date().getSeconds()) {
        logger.warn(`device with expired JWT Token  tried to access api with requirement='${required}' token=${JSON.stringify(verified.payload)}`);
        return res.status(403).json({
            status: 'failure',
            err: `Authentication expired! use refresh token to get new JWT!`
        });
    }

    // check role
    const jwt_role: string = verified.payload['role'] as string;
    // admin is able to access all roles
    if (required == jwt_role || jwt_role == 'admin') {
        next()
    } else {
        logger.warn(`device with role=${jwt_role} tried to access api with requirement='${required}'`);
        return res.status(403).json({
            status: 'failure',
            err: `wrong role! required: '${required}', you have: ${jwt_role}`
        });
    }
};
