import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import config from "../configs/config.js";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../services/token.service.js";
import { generateOTP } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";
import {
  sendEmail,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendRegisterEmail,
} from "../services/email.service.js";

/** register controller */
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: {
        message: "Please provide a valid email address.",
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

  const otp = generateOTP();
  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  await otpModel.create({
    email,
    otpHash,
    user: user._id,
    expiresAt: Date.now() + 10 * 60 * 1000, //10 minutes
  });

  await sendOTPEmail(email, otp, username);

  res.status(201).json({
    message: "User registered successfully.",
    user: {
      email: user.email,
      username: user.username,
      verified: user.verified
    },
  });
}

/** Request a password reset OTP. */
export async function forgotPassword(req, res) {
  const email = req.body?.email?.trim().toLowerCase();

  if (!email) {
    return res.status(400).json({
      error: {
        message: "Email is required.",
      },
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: {
        message: "Please provide a valid email address.",
      },
    });
  }

  const user = await User.findOne({ email });

  if (user) {
    const otp = generateOTP();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    await otpModel.deleteMany({ email, user: user._id });
    await otpModel.create({
      email,
      otpHash,
      user: user._id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendPasswordResetEmail(email, otp, user.username);
  }

  return res.status(200).json({
    message: "If an account exists for that email, a password reset code has been sent.",
  });
}

/**
 * login controller
 */
export async function login(req, res) {
  const email = req.body?.email?.trim().toLowerCase();
  const password = req.body?.password;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        message: "Email and password are required.",
      },
    });
  }

  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    return res.status(401).json({
      message: "Invalid email of password",
    });
  }

  if(!user.verified){
    return res.status(403).json({
      error:{
        message:"Please verify your email first"
      }
    })
  }

  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Invalid email or password.",
    });
  }

  const refreshToken = generateRefreshToken(user._id);
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await Session.create({
    user: user._id,
    refreshToken: refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"] || "unknown",
  });

  const accessToken = generateAccessToken(user._id, session._id);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: "Login successful.",
    accessToken,
    user: {
      email: user.email,
      username: user.username,
    },
  });
}

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);

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

// generate new refresh token and access token using refresh token
export async function refreshToken(req, res) {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Refresh token is not found!",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      res.clearCookie("refreshToken");
      return res.status(401).json({
        message: "The refresh token is invalid or expired.",
      });
    }

    throw error;
  }

  if (
    typeof decoded !== "object" ||
    decoded.tokenType !== "refresh" ||
    !decoded.id
  ) {
    return res.status(401).json({
      message: "The refresh token is invalid.",
    });
  }

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await Session.findOne({
    refreshToken: refreshTokenHash,
    revoked: false,
  });

  if (!session) {
    res.clearCookie("refreshToken");
    return res.status(401).json({
      message: "Session not found!",
    });
  }

  if (String(session.user) !== String(decoded.id)) {
    res.clearCookie("refreshToken");
    return res.status(401).json({
      message: "The refresh token is invalid.",
    });
  }

  const accessToken = generateAccessToken(decoded.id, session._id);
  const newRefreshToken = generateRefreshToken(decoded.id);

  // update session with new refresh token hash
  const newRefreshTokenHash = crypto
    .createHash("sha256")
    .update(newRefreshToken)
    .digest("hex");
  session.refreshToken = newRefreshTokenHash;
  await session.save();

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

// logout controller
export async function logout(req, res) {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token is not found!",
    });
  }

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await Session.findOne({
    refreshToken: refreshTokenHash,
    revoked: false,
  });

  if (!session) {
    return res.status(400).json({
      message: "Session not found!",
    });
  }

  session.revoked = true;
  await session.save();

  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "Logged out successfully.",
  });
}

/** logout from all devices  */

export async function logoutAll(req, res) {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh Token is not found",
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, config.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      message: "The refresh token is invalid or expired.",
    });
  }

  await Session.updateMany(
    {
      user: decoded.id,
    },
    {
      revoked: true,
    },
  );

  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "Logged out from all devices successfully.",
  });
}

/** 
 * verify email controller 
*/
export async function verifyEmail(req, res){
  const {email, otp} = req.body;

  if(!email || !otp){
    return res.status(400).json({
      message: "Email and OTP are required",
    })
  }

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

  const otpDoc = await otpModel.findOne({
    email,
    otpHash
  })

  if(!otpDoc){
    return res.status(400).json({
      message: "Invalid OTP",
    })
  }

  const user = await User.findByIdAndUpdate(
    otpDoc.user,
    {
      verified: true,
    },
    { returnDocument: "after" },
  );

  await sendRegisterEmail(user.email, user.username);

  await otpModel.deleteMany({email, user: otpDoc.user})

  return res.status(200).json({
    message: "Email verified successfully",
    user: {
      email: user.email,
      username: user.username,
    },
  })
}

/**
 * Change password for logged-in user
 */
export async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body || {};
  const userId = req.user?.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      error: {
        message: "Current password and new password are required.",
      },
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: {
        message: "New password must be at least 8 characters.",
      },
    });
  }

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    return res.status(404).json({
      error: {
        message: "User not found.",
      },
    });
  }

  const matches = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!matches) {
    return res.status(400).json({
      error: {
        message: "Current password is incorrect.",
      },
    });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  return res.status(200).json({
    message: "Password changed successfully.",
  });
}

/**
 * Reset password using OTP (forgot password flow)
 */
export async function resetPassword(req, res) {
  const email = req.body?.email?.trim().toLowerCase();
  const otp = req.body?.otp;
  const newPassword = req.body?.newPassword;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      error: {
        message: "Email, OTP, and new password are required.",
      },
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      error: {
        message: "New password must be at least 8 characters.",
      },
    });
  }

  const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
  const otpDoc = await otpModel.findOne({ email, otpHash });

  if (!otpDoc) {
    return res.status(400).json({
      error: {
        message: "Invalid or expired OTP.",
      },
    });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await User.findByIdAndUpdate(otpDoc.user, { passwordHash });
  await otpModel.deleteMany({ email, user: otpDoc.user });

  return res.status(200).json({
    message: "Password has been reset successfully.",
  });
}