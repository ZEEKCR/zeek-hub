import { and, eq, isNull } from "drizzle-orm";
import type { Actor, Role, Team } from "@/server/domain/types";
import { ensureMigrated, getDb } from "@/server/db/client";
import { account, auditLog, loginAttempts, user } from "@/server/db/schema";
import { writeAudit } from "@/server/audit/log";
import { readyAuth } from "@/server/auth/config";
import {
  GENERIC_LOGIN_ERROR,
  generateTempPassword,
  isPlaceholderEmail,
  normalizeUsername,
  placeholderEmail,
  publicEmail,
  USERNAME_PATTERN,
} from "@/server/auth/credentials";
import { isPasswordPwned } from "@/server/auth/hibp";
import {
  isLocked,
  isManualLock,
  lockoutAfterFailure,
} from "@/server/auth/lockout";
import { getDecoyHash, verifyPassword } from "@/server/auth/password";
import {
  passwordRejectionMessage,
  validatePassword,
} from "@/server/auth/password-policy";
import { authorize } from "@/server/auth/policy";
import { err, ok, type Result } from "@/server/domain/result";
import { LIMITS, consumeLimit } from "@/server/ratelimit/limiter";
import { repositories } from "@/server/container";
import { INITIAL_TEAMS } from "@/server/repositories/memory/store";
import { getEnv } from "@/env";
import { ensureAssigneeOption } from "@/server/repositories/notion/write";

const TEMP_PASSWORD_MS = 72 * 60 * 60 * 1000;

function asRole(value: string | null | undefined): Role {
  if (value === "head" || value === "admin" || value === "volunteer")
    return value;
  return "volunteer";
}

async function passwordHashFor(userId: string) {
  await ensureMigrated();
  const rows = await getDb()
    .select()
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential")),
    )
    .limit(1);
  return rows[0]?.password ?? null;
}

async function findUser(username: string) {
  await ensureMigrated();
  const rows = await getDb()
    .select()
    .from(user)
    .where(eq(user.username, username))
    .limit(1);
  return rows[0] ?? null;
}

export async function buildActor(userId: string): Promise<Actor | null> {
  await ensureMigrated();
  const rows = await getDb()
    .select()
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row || !row.username) return null;
  const repos = repositories();
  const volunteer =
    (row.notionVolunteerId
      ? await repos.volunteers.get(row.notionVolunteerId)
      : null) ?? (await repos.volunteers.findByUserId(row.id));
  const teams = await repos.teams.list();
  const volunteerId = volunteer?.id ?? null;
  const headOfTeamIds =
    asRole(row.role) === "volunteer" || !volunteerId
      ? []
      : teams
          .filter((team) => team.headIds.includes(volunteerId))
          .map((team) => team.id);
  return {
    userId: row.id,
    volunteerId,
    notionUserId: volunteer?.notionUserId ?? null,
    username: row.username,
    displayName: row.displayUsername || row.name,
    fullName: row.name,
    role: asRole(row.role),
    teamIds: volunteer?.teamIds ?? [],
    headOfTeamIds,
    banned: row.banned,
    mustChangePassword: row.mustChangePassword,
    privacyAcceptedAt: row.privacyAcceptedAt?.toISOString() ?? null,
    tempPasswordExpiresAt: row.tempPasswordExpiresAt?.toISOString() ?? null,
  };
}

async function recordFailure(username: string, ip?: string) {
  await ensureMigrated();
  const db = getDb();
  const current = await db
    .select()
    .from(loginAttempts)
    .where(eq(loginAttempts.userKey, username))
    .limit(1);
  const previous = current[0];
  const now = new Date();
  if (previous?.lockedUntil && isLocked(previous.lockedUntil, now))
    return previous;
  const next = lockoutAfterFailure(previous?.failures ?? 0, now);
  await db
    .insert(loginAttempts)
    .values({
      userKey: username,
      failures: next.failures,
      lockedUntil: next.lockedUntil,
      lastFailureAt: now,
    })
    .onConflictDoUpdate({
      target: loginAttempts.userKey,
      set: {
        failures: next.failures,
        lockedUntil: next.lockedUntil,
        lastFailureAt: now,
      },
    });
  if (next.lockedUntil) {
    await writeAudit({
      actorType: "system",
      action: "auth.lockout",
      entity: "user",
      entityId: username,
      after: {
        failures: next.failures,
        manual: isManualLock(next.lockedUntil),
      },
      ...(ip ? { ip } : {}),
    });
  }
  return { ...next, lastFailureAt: now };
}

async function clearFailures(username: string) {
  await getDb()
    .insert(loginAttempts)
    .values({
      userKey: username,
      failures: 0,
      lockedUntil: null,
      lastFailureAt: null,
    })
    .onConflictDoUpdate({
      target: loginAttempts.userKey,
      set: { failures: 0, lockedUntil: null, lastFailureAt: null },
    });
}

export async function loginWithPassword(input: {
  username: string;
  password: string;
  ip?: string;
  headers: Headers;
}): Promise<Result<{ mustChangePassword: boolean; needsConsent: boolean }>> {
  const username = normalizeUsername(input.username);
  const ipKey = input.ip ?? "unknown";
  const userAllowed = await consumeLimit(
    `login:${ipKey}:${username}`,
    LIMITS.loginUser,
  );
  const ipAllowed = await consumeLimit(`login-ip:${ipKey}`, LIMITS.loginIp);
  if (!userAllowed || !ipAllowed) {
    return err("rate_limited", "Demasiados intentos. Esperar un momento.");
  }

  const row = USERNAME_PATTERN.test(input.username)
    ? await findUser(username)
    : null;
  const attempt = row
    ? await getDb()
        .select()
        .from(loginAttempts)
        .where(eq(loginAttempts.userKey, username))
        .limit(1)
    : [];
  const locked = attempt[0]?.lockedUntil
    ? isLocked(attempt[0].lockedUntil, new Date())
    : false;

  if (!row) {
    await verifyPassword(await getDecoyHash(), input.password);
    await recordFailure(username, input.ip);
    await writeAudit({
      actorType: "system",
      action: "auth.login_failure",
      entity: "user",
      entityId: username,
      ...(input.ip ? { ip: input.ip } : {}),
    });
    return err("unauthorized", GENERIC_LOGIN_ERROR);
  }

  if (row.banned) {
    await verifyPassword(await getDecoyHash(), input.password);
    await writeAudit({
      actorType: "user",
      actorId: row.id,
      action: "auth.login_failure",
      entity: "user",
      entityId: row.id,
      ...(input.ip ? { ip: input.ip } : {}),
    });
    return err("forbidden", "La cuenta está inactiva.");
  }

  const passwordHash =
    (await passwordHashFor(row.id)) ?? (await getDecoyHash());
  const matches = await verifyPassword(passwordHash, input.password);
  if (!matches || locked) {
    if (!locked) await recordFailure(username, input.ip);
    await writeAudit({
      actorType: "user",
      actorId: row.id,
      action: "auth.login_failure",
      entity: "user",
      entityId: row.id,
      ...(input.ip ? { ip: input.ip } : {}),
    });
    return err("unauthorized", GENERIC_LOGIN_ERROR);
  }

  if (
    row.mustChangePassword &&
    row.tempPasswordExpiresAt &&
    row.tempPasswordExpiresAt.getTime() < Date.now()
  ) {
    return err(
      "validation",
      "La contraseña temporal venció. Pedir un reseteo.",
    );
  }

  const auth = await readyAuth();
  await auth.api.signInUsername({
    body: { username, password: input.password },
    headers: input.headers,
  });
  await clearFailures(username);
  await writeAudit({
    actorType: "user",
    actorId: row.id,
    action: "auth.login_success",
    entity: "user",
    entityId: row.id,
    ...(input.ip ? { ip: input.ip } : {}),
  });
  return ok({
    mustChangePassword: row.mustChangePassword,
    needsConsent: row.privacyAcceptedAt === null,
  });
}

export type ProvisionInput = {
  username: string;
  name: string;
  role: Role;
  primaryTeamId: string;
  secondaryTeamIds?: string[];
  email?: string;
  phone?: string;
  createdBy: string | null;
  makeHead?: boolean;
};

export async function provisionUser(
  input: ProvisionInput,
): Promise<
  Result<{ userId: string; tempPassword: string; volunteerId: string }>
> {
  if (!USERNAME_PATTERN.test(input.username)) {
    return err(
      "validation",
      "El usuario debe tener entre 3 y 32 caracteres (letras, números, punto, guion).",
    );
  }
  const username = normalizeUsername(input.username);
  if (await findUser(username))
    return err("conflict", "Ese usuario ya existe.");
  const tempPassword = generateTempPassword();
  const policy = validatePassword(tempPassword, username);
  if (policy) return err("validation", passwordRejectionMessage(policy));

  const repos = repositories();
  const teamIds = [input.primaryTeamId, ...(input.secondaryTeamIds ?? [])];
  const uniqueTeamIds = [...new Set(teamIds)];
  const teams: Team[] = [];
  for (const teamId of uniqueTeamIds) {
    const team =
      (await repos.teams.get(teamId)) ??
      INITIAL_TEAMS.find((item) => item.id === teamId);
    if (!team) return err("validation", "El equipo no existe.");
    teams.push(team);
  }

  const auth = await readyAuth();
  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(tempPassword);
  const email = input.email?.trim()
    ? input.email.trim().toLowerCase()
    : placeholderEmail(username);
  const userId = crypto.randomUUID();
  let volunteerId = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + TEMP_PASSWORD_MS);
  const contact = publicEmail(email);
  const lead =
    input.makeHead === true || input.role === "head" || input.role === "admin";

  try {
    await getDb().transaction(async (tx) => {
      await tx.insert(user).values({
        id: userId,
        name: input.name,
        email,
        emailVerified: false,
        username,
        displayUsername: input.username,
        role: input.role,
        banned: false,
        mustChangePassword: true,
        tempPasswordExpiresAt: expires,
        notionVolunteerId: volunteerId,
        teamId: input.primaryTeamId,
        createdBy: input.createdBy,
        createdAt: now,
        updatedAt: now,
      });
      await tx.insert(account).values({
        id: crypto.randomUUID(),
        accountId: userId,
        providerId: "credential",
        userId,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });
      const volunteer = await repos.volunteers.upsert({
        id: volunteerId,
        name: input.name,
        ...(contact ? { email: contact } : {}),
        username,
        userId,
        role: input.role,
        status: "active",
        teamIds: uniqueTeamIds,
        primaryTeamId: input.primaryTeamId,
        ...(input.phone ? { phone: input.phone } : {}),
        updatedAt: now.toISOString(),
      });
      if (volunteer.id !== volunteerId) {
        // Notion assigns its own page id; keep the account pointing at it.
        volunteerId = volunteer.id;
        await tx
          .update(user)
          .set({ notionVolunteerId: volunteer.id })
          .where(eq(user.id, userId));
      }
      for (const team of teams) {
        await repos.teams.upsert({
          ...team,
          headIds:
            lead && team.id === input.primaryTeamId
              ? Array.from(new Set([...team.headIds, volunteer.id]))
              : team.headIds,
          memberIds: Array.from(new Set([...team.memberIds, volunteer.id])),
        });
      }
    });
  } catch {
    return err("upstream", "No se pudo crear el usuario.");
  }

  if (getEnv().NOTION_MODE === "live") {
    // Best effort: Notion also creates the option the first time it is used.
    await ensureAssigneeOption(input.name).catch(() => undefined);
  }

  await writeAudit({
    actorType: input.createdBy ? "user" : "system",
    ...(input.createdBy ? { actorId: input.createdBy } : {}),
    action: "user.create",
    entity: "user",
    entityId: userId,
    after: {
      username,
      role: input.role,
      teamId: input.primaryTeamId,
      volunteerId,
    },
  });

  return ok({ userId, tempPassword, volunteerId });
}

export async function createUserAs(
  actor: Actor,
  input: Omit<ProvisionInput, "createdBy" | "makeHead">,
): Promise<Result<{ userId: string; tempPassword: string }>> {
  const allowed = await consumeLimit(
    `users:${actor.userId}`,
    LIMITS.credentialChange,
  );
  if (!allowed)
    return err("rate_limited", "Demasiados cambios. Esperar un momento.");
  const teamIds = [input.primaryTeamId, ...(input.secondaryTeamIds ?? [])];
  if (
    !authorize(actor, "users.create", {
      kind: "user",
      role: input.role,
      teamIds,
    })
  ) {
    return err("forbidden", "No tiene permiso para crear este usuario.");
  }
  const created = await provisionUser({
    ...input,
    createdBy: actor.userId,
    makeHead: input.role !== "volunteer",
  });
  if (!created.ok) return created;
  return ok({
    userId: created.data.userId,
    tempPassword: created.data.tempPassword,
  });
}

async function targetActor(userId: string) {
  return buildActor(userId);
}

export async function resetUserPassword(
  actor: Actor,
  userId: string,
): Promise<Result<{ tempPassword: string }>> {
  const allowed = await consumeLimit(
    `reset:${actor.userId}`,
    LIMITS.credentialChange,
  );
  if (!allowed)
    return err("rate_limited", "Demasiados cambios. Esperar un momento.");
  const target = await targetActor(userId);
  if (!target) return err("not_found", "Usuario no encontrado.");
  if (
    !authorize(actor, "users.resetPassword", {
      kind: "user",
      role: target.role,
      teamIds: target.teamIds,
    })
  ) {
    return err("forbidden", "No tiene permiso para resetear esta cuenta.");
  }
  const tempPassword = generateTempPassword();
  const auth = await readyAuth();
  const ctx = await auth.$context;
  await ctx.internalAdapter.updatePassword(
    userId,
    await ctx.password.hash(tempPassword),
  );
  await ctx.internalAdapter.deleteUserSessions(userId);
  await getDb()
    .update(user)
    .set({
      mustChangePassword: true,
      tempPasswordExpiresAt: new Date(Date.now() + TEMP_PASSWORD_MS),
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));
  await clearFailures(target.username);
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "user.password_reset",
    entity: "user",
    entityId: userId,
  });
  return ok({ tempPassword });
}

export async function unlockAccount(
  actor: Actor,
  userId: string,
): Promise<Result<{ username: string }>> {
  const target = await targetActor(userId);
  if (!target) return err("not_found", "Usuario no encontrado.");
  if (
    !authorize(actor, "users.unlock", {
      kind: "user",
      role: target.role,
      teamIds: target.teamIds,
    })
  ) {
    return err("forbidden", "No tiene permiso para desbloquear esta cuenta.");
  }
  await clearFailures(target.username);
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "user.unlock",
    entity: "user",
    entityId: userId,
  });
  return ok({ username: target.username });
}

export async function deactivateAccount(
  actor: Actor,
  userId: string,
): Promise<Result<{ username: string }>> {
  const target = await targetActor(userId);
  if (!target) return err("not_found", "Usuario no encontrado.");
  if (
    !authorize(actor, "users.deactivate", {
      kind: "user",
      role: target.role,
      teamIds: target.teamIds,
    })
  ) {
    return err("forbidden", "No tiene permiso para desactivar esta cuenta.");
  }
  const auth = await readyAuth();
  const ctx = await auth.$context;
  await ctx.internalAdapter.deleteUserSessions(userId);
  await getDb()
    .update(user)
    .set({ banned: true, updatedAt: new Date() })
    .where(eq(user.id, userId));
  if (target.volunteerId) {
    const repos = repositories();
    const volunteer = await repos.volunteers.get(target.volunteerId);
    if (volunteer)
      await repos.volunteers.upsert({
        ...volunteer,
        status: "inactive",
        updatedAt: new Date().toISOString(),
      });
  }
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "user.deactivate",
    entity: "user",
    entityId: userId,
  });
  return ok({ username: target.username });
}

export async function changeOwnPassword(input: {
  actor: Actor;
  currentPassword: string;
  nextPassword: string;
  headers: Headers;
}): Promise<Result<{ changed: true }>> {
  const allowed = await consumeLimit(
    `password:${input.actor.userId}`,
    LIMITS.credentialChange,
  );
  if (!allowed)
    return err("rate_limited", "Demasiados cambios. Esperar un momento.");
  const rejection = validatePassword(input.nextPassword, input.actor.username);
  if (rejection) return err("validation", passwordRejectionMessage(rejection));
  if (getEnv().hibpEnabled) {
    const pwned = await isPasswordPwned(input.nextPassword);
    if (pwned)
      return err(
        "validation",
        "Esa contraseña apareció en una filtración. Elegir otra.",
      );
  }
  const auth = await readyAuth();
  await auth.api.changePassword({
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.nextPassword,
      revokeOtherSessions: true,
    },
    headers: input.headers,
  });
  await getDb()
    .update(user)
    .set({
      mustChangePassword: false,
      tempPasswordExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, input.actor.userId));
  await writeAudit({
    actorType: "user",
    actorId: input.actor.userId,
    action: "user.password_change",
    entity: "user",
    entityId: input.actor.userId,
  });
  return ok({ changed: true });
}

export async function acceptPrivacy(
  actor: Actor,
): Promise<Result<{ acceptedAt: string }>> {
  const acceptedAt = new Date();
  await getDb()
    .update(user)
    .set({ privacyAcceptedAt: acceptedAt, updatedAt: acceptedAt })
    .where(eq(user.id, actor.userId));
  if (actor.volunteerId) {
    const repos = repositories();
    const volunteer = await repos.volunteers.get(actor.volunteerId);
    if (volunteer) {
      await repos.volunteers.upsert({
        ...volunteer,
        updatedAt: acceptedAt.toISOString(),
      });
    }
  }
  await writeAudit({
    actorType: "user",
    actorId: actor.userId,
    action: "user.privacy_accept",
    entity: "user",
    entityId: actor.userId,
  });
  return ok({ acceptedAt: acceptedAt.toISOString() });
}

export async function listDirectory(actor: Actor) {
  const repos = repositories();
  const volunteers = await repos.volunteers.list();
  const teams = await repos.teams.list();
  const visible = volunteers.map((volunteer) => {
    const canContact = authorize(actor, "volunteers.viewContact", {
      kind: "volunteer",
      teamIds: volunteer.teamIds,
    });
    return {
      ...volunteer,
      email: canContact ? volunteer.email : undefined,
      phone: canContact ? volunteer.phone : undefined,
    };
  });
  return { volunteers: visible, teams };
}

const knownTeams = new Set(INITIAL_TEAMS.map((team) => team.id));
let teamsRemembered = false;

function teamIdFromAudit(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const teamId = (value as { teamId?: unknown }).teamId;
  return typeof teamId === "string" && knownTeams.has(teamId) ? teamId : null;
}

async function rememberTeamIds() {
  if (teamsRemembered) return;
  const events = await getDb()
    .select({ entityId: auditLog.entityId, after: auditLog.after })
    .from(auditLog)
    .where(eq(auditLog.action, "user.create"));
  for (const event of events) {
    const teamId = teamIdFromAudit(event.after);
    if (!event.entityId || !teamId) continue;
    await getDb()
      .update(user)
      .set({ teamId })
      .where(and(eq(user.id, event.entityId), isNull(user.teamId)));
  }
  teamsRemembered = true;
}

export async function listTeamAccounts() {
  await ensureMigrated();
  await rememberTeamIds();
  const rows = await getDb()
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      displayUsername: user.displayUsername,
      role: user.role,
      email: user.email,
      teamId: user.teamId,
      banned: user.banned,
    })
    .from(user);
  return rows
    .filter((row) => !row.banned && row.teamId)
    .sort((left, right) =>
      (left.displayUsername || left.name).localeCompare(
        right.displayUsername || right.name,
        "es",
      ),
    );
}

export function contactEmail(email: string | null | undefined) {
  return isPlaceholderEmail(email) ? null : (email ?? null);
}
