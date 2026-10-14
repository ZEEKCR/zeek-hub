import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/env";
import * as schema from "@/server/db/schema";

type AppDb = ReturnType<typeof drizzlePglite<typeof schema>>;

let database: AppDb | undefined;
let migratePromise: Promise<void> | undefined;

function createDatabase(url: string): AppDb {
  if (url.startsWith("pglite:")) {
    const target = url.slice("pglite:".length);
    const dataDir =
      target === "memory" || target === ""
        ? undefined
        : path.resolve(process.cwd(), target);
    if (dataDir) mkdirSync(dataDir, { recursive: true });
    const client = new PGlite(dataDir);
    return drizzlePglite(client, { schema });
  }
  return drizzlePostgres(postgres(url, { max: 1 }), {
    schema,
  }) as unknown as AppDb;
}

export function getDb() {
  database ??= createDatabase(getEnv().DATABASE_URL);
  return database;
}

export async function ensureMigrated() {
  migratePromise ??= applyMigrations();
  await migratePromise;
}

async function applyMigrations() {
  const sqlPath = path.join(process.cwd(), "drizzle", "0000_init.sql");
  const sqlText = readFileSync(sqlPath, "utf8");
  const statements = sqlText
    .replaceAll("\r\n", "\n")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
  const db = getDb();
  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
}
