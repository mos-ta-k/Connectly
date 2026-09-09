import express from "express";
import * as userController from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middlware.js";
import { upload } from "../services/cloudinary.service.js";

const userRouter = express.Router();

userRouter.put(
  "/update-profile",
  authMiddleware,
  upload.single("file"),
  userController.updateProfile
);

export default userRouter;
