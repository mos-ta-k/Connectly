import express from "express";
import * as authController from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middlware.js";

const authRouter = express.Router();

/**
 * POST /api/auth/register
 * @summary Register a new user
 * @tags Authentication
 */
authRouter.post("/register", authController.register);

/**
 * POST /api/auth/forgot-password
 * @summary Send a password reset OTP
 * @tags Authentication
 */
authRouter.post("/forgot-password", authController.forgotPassword);

/**
 * POST /api/auth/login
 * @summary Authenticate an existing user
 * @tags Authenticat ion
 */
authRouter.post("/login", authController.login);

/**
 * GET /api/auth/get-me
 * @summary Get the current user's information
 * @tags Authentication
 */
authRouter.get("/get-me", authMiddleware, authController.getMe);

/**
 * GET /api/auth/refresh-token
 * @summary generate new access token using refresh token
 * @tags Authentication
 */
authRouter.get("/refresh-token", authController.refreshToken);

/**
 * GET /api/auth/logout
 * @summary Logout the current user and revoke the refresh token
 * @tags Authentication
 */
authRouter.get("/logout", authController.logout);

/**
 * GET /api/auth/logout-all-device
 * @summary Logout the current user and revoke the refresh token
 * @tags Authentication
 */
authRouter.get("/logout-all", authController.logoutAll);

/**
 * POST /api/auth/verify-email
 * @summary Verify email
 * @tags Authentication
 */
authRouter.post("/verify-email", authController.verifyEmail);

/**
 * POST /api/auth/change-password
 * @summary Change password for logged-in user
 * @tags Authentication
 */
authRouter.post("/change-password", authMiddleware, authController.changePassword);

/**
 * POST /api/auth/reset-password
 * @summary Reset password using OTP
 * @tags Authentication
 */
authRouter.post("/reset-password", authController.resetPassword);

export default authRouter;
