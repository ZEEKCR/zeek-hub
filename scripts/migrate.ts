import { ensureMigrated } from "../src/server/db/client";

await ensureMigrated();
console.log("Migración aplicada.");
