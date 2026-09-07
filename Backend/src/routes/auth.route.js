import express from "express";
import * as authController from "../controllers/auth.controller.js";

const authRouter = express.Router();

/**
 * POST /api/auth/register
 * @summary Register a new user
 * @tags Authentication
 */
authRouter.post("/register", authController.register);

/**
 * GET /api/auth/get-me
 * @summary Get the current user's information
 * @tags Authentication
 */
authRouter.get("/get-me", authController.getMe);

/**
 * GET /api/auth/refresh-token
 * @summary generate new access token using refresh token
 * @tags Authentication
 */
authRouter.get("/refresh-token", authController.refreshToken);


export default authRouter;
