import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: path.resolve(fileURLToPath(new URL("../../.env", import.meta.url))),
});

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not defined in the environment variables.`);
  }

  return value;
}

const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  HOST: process.env.HOST || "0.0.0.0",
  PORT: Number.parseInt(process.env.PORT || "5000", 10),
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  BODY_LIMIT: process.env.BODY_LIMIT || "1mb",
  MONGODB_URI: requiredEnv("MONGODB_URI"),
  MONGODB_DATABASE: process.env.MONGODB_DATABASE || "connectly",
  JWT_SECRET: requiredEnv("JWT_SECRET"),
  CLIENT_ID: requiredEnv("CLIENT_ID"),
  CLIENT_SECRET: requiredEnv("CLIENT_SECRET"),
  REFRESH_TOKEN: requiredEnv("REFRESH_TOKEN"),
  EMAIL_USER: requiredEnv("EMAIL_USER"),
  MONGODB_SERVER_SELECTION_TIMEOUT_MS: Number.parseInt(
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || "5000",
    10,
  ),
  MONGODB_MAX_POOL_SIZE: Number.parseInt(
    process.env.MONGODB_MAX_POOL_SIZE || "10",
    10,
  ),
  MONGODB_MIN_POOL_SIZE: Number.parseInt(
    process.env.MONGODB_MIN_POOL_SIZE || "0",
    10,
  ),
  MONGODB_SOCKET_TIMEOUT_MS: Number.parseInt(
    process.env.MONGODB_SOCKET_TIMEOUT_MS || "45000",
    10,
  ),
};

if (!Number.isInteger(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

export default config;
