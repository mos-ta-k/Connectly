import mongoose from "mongoose";
import config from "./config.js";

let connectionPromise;

function getDatabaseUri() {
  return config.MONGODB_URI;
}

function configureConnectionLogging() {
  mongoose.connection.on("connected", () => {
    console.log("MONGODB connected");
  });

  mongoose.connection.on("disconnected", () => {
    console.warn(
      JSON.stringify({ level: "warn", message: "MongoDB disconnected" }),
    );
  });

  mongoose.connection.on("error", (error) => {
    console.error(
      JSON.stringify({
        level: "error",
        message: "MongoDB connection error",
        error: error.message,
      }),
    );
  });
}

configureConnectionLogging();

async function connectDatabase() {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(getDatabaseUri(), {
        dbName: config.MONGODB_DATABASE,
        serverSelectionTimeoutMS: Number.parseInt(
          config.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
        ),
        maxPoolSize: Number.parseInt(config.MONGODB_MAX_POOL_SIZE),
        minPoolSize: Number.parseInt(config.MONGODB_MIN_POOL_SIZE),
        socketTimeoutMS: Number.parseInt(config.MONGODB_SOCKET_TIMEOUT_MS),
      })
      .then(() => mongoose.connection)
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  return connectionPromise;
}

connectDatabase().catch((error) => {
  console.error(
    JSON.stringify({
      level: "error",
      message: "MongoDB connection failed; API is running in degraded mode",
      error: error.message,
    }),
  );
});

async function disconnectDatabase() {
  connectionPromise = undefined;

  if (
    mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected
  ) {
    await mongoose.disconnect();
  }
}

function isDatabaseReady() {
  return mongoose.connection.readyState === mongoose.ConnectionStates.connected;
}

export { connectDatabase, disconnectDatabase, isDatabaseReady };

