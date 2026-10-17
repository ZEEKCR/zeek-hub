import { eq } from "drizzle-orm";
import { normalizeUsername } from "../src/server/auth/credentials";
import { getDb } from "../src/server/db/client";
import { user } from "../src/server/db/schema";
import { provisionUser } from "../src/server/services/users";
import { INITIAL_TEAMS } from "../src/server/repositories/memory/store";

type SeedUser = { username: string; email: string; team: string };

function loadUsers(): SeedUser[] {
  const raw = process.env.SEED_USERS?.trim();
  if (!raw) {
    console.error(
      'Falta SEED_USERS. Definilo en .env como JSON, por ejemplo [{"username":"NombreA","email":"correo@ejemplo.com","team":"Growth"}].',
    );
    process.exit(1);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("SEED_USERS no es JSON válido.");
    process.exit(1);
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    console.error("SEED_USERS debe ser un arreglo con username, email y team.");
    process.exit(1);
  }
  return parsed as SeedUser[];
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
