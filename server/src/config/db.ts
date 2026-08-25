import Database from "better-sqlite3";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url)); // server/src/config

// Database file lives outside the repo tree by default (server/data is
// git-ignored). Override with DATABASE_PATH for production deployments.
const dbPath = process.env.DATABASE_PATH
  ? resolve(process.env.DATABASE_PATH)
  : resolve(__dirname, "../../data/vitaltrack.db");

mkdirSync(dirname(dbPath), { recursive: true });

export const db: Database.Database = new Database(dbPath);

// PRAGMAs are per-connection. better-sqlite3 uses a single synchronous
// connection, so setting them once here is enough.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON"); // enables ON DELETE CASCADE
db.pragma("busy_timeout = 5000");
db.pragma("synchronous = NORMAL");

// Apply schema + global seeds on boot. Idempotent (IF NOT EXISTS / OR IGNORE),
// so it is safe to run every start and self-creates a fresh database file.
const schemaPath = resolve(__dirname, "../../../database/schema.sqlite.sql");
db.exec(readFileSync(schemaPath, "utf8"));
