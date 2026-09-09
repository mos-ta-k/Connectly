import cookieParser from "cookie-parser";
import morgan from "morgan";
import crypto from "node:crypto";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

import cors from "cors";
import express from "express";
import config from "./configs/config.js";
import { isDatabaseReady } from "./configs/database.js";

function applySecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
}

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((request, response, next) => {
    const requestId = request.get("x-request-id") || crypto.randomUUID();
    request.id = requestId;
    response.setHeader("X-Request-Id", requestId);
    applySecurityHeaders(response);
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (
          !origin ||
          config.CLIENT_ORIGINS.includes("*") ||
          config.CLIENT_ORIGINS.includes(origin)
        ) {
          return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.use(express.json({ limit: config.BODY_LIMIT, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: config.BODY_LIMIT }));
  app.use(morgan("dev"));
  app.use(cookieParser());

  app.get("/health", (request, response) => {
    response.status(200).json({ status: "ok", requestId: request.id });
  });

  app.get("/ready", (request, response) => {
    const status = isDatabaseReady() ? "ready" : "not ready";
    response.status(status === "ready" ? 200 : 503).json({
      status,
      requestId: request.id,
    });
  });

  app.get("/api/v1", (request, response) => {
    response.status(200).json({
      name: "Connectly API",
      version: "v1",
      status: "online",
      requestId: request.id,
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);

  app.use((request, response) => {
    response.status(404).json({
      error: { code: "NOT_FOUND", message: "Route not found" },
      requestId: request.id,
    });
  });

  app.use((error, request, response, next) => {
    if (response.headersSent) return next(error);

    const status = error.statusCode || error.status || 500;
    const isClientError = status >= 400 && status < 500;
    const message = isClientError ? error.message : "Internal server error";

    if (status === 413) {
      return response.status(413).json({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "Request body is too large",
        },
        requestId: request.id,
      });
    }

    if (config.NODE_ENV !== "test") {
      console.error(
        JSON.stringify({
          level: "error",
          requestId: request.id,
          method: request.method,
          path: request.originalUrl,
          status,
          error: error.message,
        }),
      );
    }

    return response.status(status).json({
      error: {
        code: isClientError ? "BAD_REQUEST" : "INTERNAL_ERROR",
        message,
      },
      requestId: request.id,
    });
  });

  return app;
}

export { createApp };

