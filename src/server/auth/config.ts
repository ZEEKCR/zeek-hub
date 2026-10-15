import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, username } from "better-auth/plugins";
import { getEnv } from "@/env";
import { hashIp, withHashedSessionTokens } from "@/server/auth/session-hash";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { ensureMigrated, getDb } from "@/server/db/client";
import { authSchema } from "@/server/db/schema";

const ABSOLUTE_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

type AuthInstance = ReturnType<typeof createAuth>;

let authInstance: AuthInstance | undefined;

function createAuth() {
  const env = getEnv();
  const secureCookies = env.NODE_ENV === "production";
  return betterAuth({
    appName: "ZEEK Hub",
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [
      env.BETTER_AUTH_URL,
      ...(env.NODE_ENV === "development"
        ? ["http://localhost:3000", "http://127.0.0.1:3000"]
        : []),
    ],
    database: withHashedSessionTokens(
      drizzleAdapter(getDb(), {
        provider: "pg",
        schema: authSchema,
      }) as (options: never) => object,
    ),
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      password: {
        hash: hashPassword,
        verify: async ({ hash: passwordHash, password }) =>
          verifyPassword(passwordHash, password),
      },
    },
    user: {
      additionalFields: {
        mustChangePassword: {
          type: "boolean",
          required: false,
          input: false,
          defaultValue: false,
        },
        tempPasswordExpiresAt: { type: "date", required: false, input: false },
        notionVolunteerId: { type: "string", required: false, input: false },
        createdBy: { type: "string", required: false, input: false },
        privacyAcceptedAt: { type: "date", required: false, input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      additionalFields: {
        absoluteExpiresAt: { type: "date", required: false, input: false },
      },
    },
    advanced: {
      useSecureCookies: secureCookies,
      cookies: {
        session_token: {
          name: "zeek_session",
          attributes: {
            httpOnly: true,
            secure: secureCookies,
            sameSite: "lax",
            path: "/",
          },
        },
      },
    },
    disabledPaths: [
      "/sign-up/email",
      "/is-username-available",
      "/admin/create-user",
      "/admin/impersonate-user",
      "/admin/stop-impersonating",
      "/admin/set-role",
      "/admin/set-user-password",
      "/admin/ban-user",
      "/admin/unban-user",
      "/admin/remove-user",
    ],
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 32,
        usernameValidator: (value) => /^[A-Za-z0-9._-]{3,32}$/.test(value),
      }),
      admin({
        defaultRole: "volunteer",
        adminRoles: ["admin"],
      }),
      nextCookies(),
    ],
    databaseHooks: {
      session: {
        create: {
          before: async (sessionData) => {
            const ip =
              typeof sessionData.ipAddress === "string"
                ? sessionData.ipAddress
                : "";
            return {
              data: {
                ...sessionData,
                ipAddress: ip ? hashIp(ip, env.BETTER_AUTH_SECRET) : "",
                absoluteExpiresAt: new Date(Date.now() + ABSOLUTE_SESSION_MS),
              },
            };
          },
        },
      },
    },
  });
}

export function getAuth() {
  authInstance ??= createAuth();
  return authInstance;
}

export async function readyAuth() {
  await ensureMigrated();
  return getAuth();
}
