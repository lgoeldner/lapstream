import { Router } from "express";
import { enrollController as enrollDeviceController, generateOTPsAdminController } from "../controllers/auth.controller.js";


export const authRouter = Router();
// use generated OTP to authenticate device, returns jwt token + refresh token
authRouter.post('/device', enrollDeviceController);

// generate OTPs requiring admin api key
authRouter.post('/admin/otp', generateOTPsAdminController)