import http from "node:http";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import config from "./configs/config.js";
import { connectDatabase, disconnectDatabase } from "./configs/database.js";

async function startServer() {
  await connectDatabase();

  const server = http.createServer(createApp());
  let shuttingDown = false;

  server.listen(config.PORT, config.HOST, () => {
    console.log("Connectly API listening", config.PORT);
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

  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
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

export { startServer };

