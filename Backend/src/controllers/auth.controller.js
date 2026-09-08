import bcrypt from "bcrypt";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import config from "../configs/config.js";
import User from "../models/user.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../services/token.service.js";
import Session from "../models/session.model.js";

export async function register(req, res) {
  const username = req.body?.username?.trim();
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!username || !email || !password) {
    return res.status(400).json({
      error: {
        message: "Username, email, and password are required.",
      },
    });
  }

  if (username.length < 3 || username.length > 30) {
    return res.status(400).json({
      error: {
        message: "Username must be between 3 and 30 characters.",
      },
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: {
        message: "Password must be at least 8 characters.",
      },
    });
  }

  // Check if the user already exists
  const isAlreadyRegistered = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (isAlreadyRegistered) {
    return res.status(409).json({
      error: {
        message: "A user with the provided username or email already exists.",
      },
    });
  }

  //hash password
  const passwordHash = await bcrypt.hash(password, 12);

  //create new user
  const user = await User.create({
    username,
    email,
    passwordHash,
  });

  const refreshToken = generateRefreshToken(user._id);
  const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  // create session 
  const session = await Session.create({
    user: user._id,
    refreshToken: refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"]
  });

  const accessToken = generateAccessToken(user._id, session._id);


  // set refresh token in httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  });

  res.status(201).json({
    message: "User registered successfully.",
    accessToken,
    user: {
      email: user.email,
      username: user.username,
    },
  });
}

// identify current user from jwt token
export async function getMe(req, res) {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization?.trim().split(/\s+/) ?? [];

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return res.status(401).json({
      message: "A Bearer access token is required.",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: "The access token is invalid or expired.",
      });
    }

    throw error;
  }

  if (typeof decoded !== "object" || decoded.tokenType !== "access" || !decoded.id) {
    return res.status(401).json({
      message: "The access token is invalid.",
    });
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    return res.status(401).json({
      message: "The user associated with this token was not found.",
    });
  }

  res.status(200).json({
    message: "User fetched successfully.",
    user: {
      username: user.username,
      email: user.email,
    },
  });
}

export async function refreshToken(req, res) {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token is not found!",
    });
  }

  // verify refresh token
  const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

  const accessToken = generateAccessToken(decoded.id);
  const newRefreshToken = generateRefreshToken(decoded.id);

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
  });

  res.status(200).json({
    message: "Access token refreshed successfully.",
    accessToken,
  });
}
