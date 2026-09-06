const crypto = require("node:crypto");
const http = require("node:http");
const authRoutes = require("./routes/auth.route.js");

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const {
  connectDatabase,
  disconnectDatabase,
  isDatabaseReady,
} = require("./configs/database");

const config = {
  env: process.env.NODE_ENV || "development",
  host: process.env.HOST || "0.0.0.0",
  port: Number.parseInt(process.env.PORT || "5000", 10),
  clientOrigins: (process.env.CLIENT_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  bodyLimit: process.env.BODY_LIMIT || "1mb",
};

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

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
          config.clientOrigins.includes("*") ||
          config.clientOrigins.includes(origin)
        ) {
          return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.use(express.json({ limit: config.bodyLimit, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: config.bodyLimit }));

  app.get("/healthz", (request, response) => {
    response.status(200).json({ status: "ok", requestId: request.id });
  });

  app.get("/readyz", (request, response) => {
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

    if (config.env !== "test") {
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

async function startServer() {
  await connectDatabase();

  const server = http.createServer(createApp());
  let shuttingDown = false;

  server.listen(config.port, config.host, () => {
    console.log("Connectly API listening", config.port);
  });

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(
      JSON.stringify({ level: "info", message: "Shutdown requested", signal }),
    );

    server.close(async (error) => {
      if (error) {
        console.error(
          JSON.stringify({
            level: "error",
            message: "Shutdown failed",
            error: error.message,
          }),
        );
        process.exitCode = 1;
      }

      try {
        await disconnectDatabase();
      } catch (disconnectError) {
        console.error(
          JSON.stringify({
            level: "error",
            message: "Database shutdown failed",
            error: disconnectError.message,
          }),
        );
        process.exitCode = 1;
      }

      process.exit();
    });
  };

  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));

  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(
      JSON.stringify({
        level: "fatal",
        message: "Server startup failed",
        error: error.message,
      }),
    );
    process.exitCode = 1;
  });
}

module.exports = { createApp, startServer };
