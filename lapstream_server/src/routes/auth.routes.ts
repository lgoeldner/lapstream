import { Router } from "express";
import { enrollController, generateOTPsAdminController } from "../controllers/auth.controller.js";


export const authRouter = Router();
// use generated OTP to authenticate device, returns jwt token + refresh token
authRouter.post('/enroll', enrollController);

// generate OTPs with admin api key
authRouter.post('/admin/otp', generateOTPsAdminController)