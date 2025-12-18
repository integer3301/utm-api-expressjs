import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../schemas/utms";
import path from "path";
import fs from "fs";

const dbDir = path.join(process.cwd(), "data");
const dbPath = path.join(dbDir, "egais.db");

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let sqlite: Database;
try {
  sqlite = new Database(dbPath);

  sqlite.run("PRAGMA journal_mode = WAL;");
  sqlite.run("PRAGMA foreign_keys = ON;");
  sqlite.run("PRAGMA busy_timeout = 5000;"); // Таймаут для занятой БД
  sqlite.run("PRAGMA synchronous = NORMAL;"); // Баланс производительности/надежности

  console.log(`[Drizzle] Connected to ${dbPath}`);
} catch (error) {
  console.error(`[Drizzle] Failed to connect to ${dbPath}:`, error);
  throw error;
}

export const db = drizzle(sqlite, {
  schema,
  logger: process.env.NODE_ENV === "development", // Логирование
});

export const rawDb = sqlite;

process.on("SIGINT", () => {
  console.log("[Drizzle] Closing database connection...");
  sqlite.close();
  process.exit(0);
});
