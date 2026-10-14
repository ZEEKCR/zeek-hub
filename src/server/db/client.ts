import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
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
    if (target && target !== "memory") mkdirSync(target, { recursive: true });
    const client = new PGlite(
      target === "memory" || target === "" ? undefined : target,
    );
    return drizzlePglite(client, { schema });
  }
  if (url.includes("neon.tech")) {
    return drizzleNeon(neon(url), { schema }) as unknown as AppDb;
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
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);
  const db = getDb();
  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
}
