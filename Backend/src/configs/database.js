const mongoose = require("mongoose");

let connectionPromise;

function getDatabaseUri() {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!uri) {
    throw new Error("MONGODB_URI or DATABASE_URL must be set");
  }

  return uri;
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
        serverSelectionTimeoutMS: Number.parseInt(
          process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || "5000",
          10,
        ),
        maxPoolSize: Number.parseInt(
          process.env.MONGODB_MAX_POOL_SIZE || "10",
          10,
        ),
        minPoolSize: Number.parseInt(
          process.env.MONGODB_MIN_POOL_SIZE || "0",
          10,
        ),
        socketTimeoutMS: Number.parseInt(
          process.env.MONGODB_SOCKET_TIMEOUT_MS || "45000",
          10,
        ),
      })
      .then(() => mongoose.connection)
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  return connectionPromise;
}

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

module.exports = { connectDatabase, disconnectDatabase, isDatabaseReady };
