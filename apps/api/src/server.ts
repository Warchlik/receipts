import { app } from "@/main";
import { env } from "@/config/env";
import { pool } from "./db";

const server = app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing server...");
  server.close(async () => {
    console.log("Server closed.");
    await pool.end();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Closing server...");
  server.close(async () => {
    console.log("Server closed.");
    await pool.end();
    process.exit(0);
  });
});
