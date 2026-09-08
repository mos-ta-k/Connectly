import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import config from "../configs/config.js";
import Session from "../models/session.model.js";

export function generateAccessToken(userId, sessionId) {
  return jwt.sign(
    {
      id: userId,
      tokenType: "access",
      ...(sessionId ? { sessionId } : {}),
    },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
      jwtid: crypto.randomUUID(),
    },
  );
}

export function generateRefreshToken(userId) {
  return jwt.sign(
    {
      id: userId,
      tokenType: "refresh",
    },
    config.JWT_SECRET,
    {
      expiresIn: "15d",
      jwtid: crypto.randomUUID(),
    },
  );
}
