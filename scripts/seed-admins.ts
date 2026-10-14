import { eq } from "drizzle-orm";
import { normalizeUsername } from "../src/server/auth/credentials";
import { getDb } from "../src/server/db/client";
import { user } from "../src/server/db/schema";
import { provisionUser } from "../src/server/services/users";
import { INITIAL_TEAMS } from "../src/server/repositories/memory/store";

type SeedUser = { username: string; email: string; team: string };

const defaults: SeedUser[] = [
  {
    username: "EmilioA",
    email: "emilioaalfaro@gmail.com",
    team: "Communications",
  },
  { username: "TamaraO", email: "tamaraov246@gmail.com", team: "Operations" },
  { username: "SebastianC", email: "jsebascp04@gmail.com", team: "Growth" },
  { username: "EstebanB", email: "brenesjosuee@gmail.com", team: "Technical" },
  { username: "JosueV", email: "jvalles.cr@gmail.com", team: "Logistics" },
];

function loadUsers(): SeedUser[] {
  const raw = process.env.SEED_USERS;
  if (!raw) return defaults;
  const parsed = JSON.parse(raw) as SeedUser[];
  if (!Array.isArray(parsed) || parsed.length === 0)
    throw new Error("SEED_USERS debe ser un JSON de usuarios");
  return parsed;
}

const teamId = new Map(
  INITIAL_TEAMS.map((team) => [team.name.toLowerCase(), team.id]),
);

for (const seed of loadUsers()) {
  const primaryTeamId = teamId.get(seed.team.toLowerCase());
  if (!primaryTeamId) {
    console.error(`Equipo desconocido: ${seed.team}`);
    process.exit(1);
  }
  const result = await provisionUser({
    username: seed.username,
    name: seed.username,
    email: seed.email,
    role: "admin",
    primaryTeamId,
    createdBy: null,
    makeHead: true,
  });
  if (!result.ok) {
    if (result.error.code === "conflict") {
      await getDb()
        .update(user)
        .set({ role: "admin", updatedAt: new Date() })
        .where(eq(user.username, normalizeUsername(seed.username)));
      console.log(`${seed.username}: ya existe, rol admin asegurado`);
      continue;
    }
    console.error(`${seed.username}: ${result.error.message}`);
    process.exit(1);
  }
  console.log(
    `${seed.username} contraseña temporal (una sola vez): ${result.data.tempPassword}`,
  );
}
