import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
};

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  ...timestamps,
  username: text("username").unique(),
  displayUsername: text("display_username"),
  role: text("role").notNull().default("volunteer"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires", { withTimezone: true, mode: "date" }),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  tempPasswordExpiresAt: timestamp("temp_password_expires_at", {
    withTimezone: true,
    mode: "date",
  }),
  notionVolunteerId: text("notion_volunteer_id"),
  teamId: text("team_id"),
  jobTitle: text("job_title"),
  phone: text("phone"),
  createdBy: text("created_by"),
  privacyAcceptedAt: timestamp("privacy_accepted_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  token: text("token_hash").notNull().unique(),
  ...timestamps,
  ipAddress: text("ip_hash"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
  absoluteExpiresAt: timestamp("absolute_expires_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", {
    withTimezone: true,
    mode: "date",
  }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
    withTimezone: true,
    mode: "date",
  }),
  scope: text("scope"),
  password: text("password"),
  ...timestamps,
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }),
});

export const loginAttempts = pgTable("login_attempts", {
  userKey: text("user_key").primaryKey(),
  failures: integer("failures").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true, mode: "date" }),
  lastFailureAt: timestamp("last_failure_at", {
    withTimezone: true,
    mode: "date",
  }),
});

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  at: timestamp("at", { withTimezone: true, mode: "date" }).notNull(),
  actorType: text("actor_type").notNull(),
  actorId: text("actor_id"),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  before: jsonb("before"),
  after: jsonb("after"),
  ipHash: text("ip_hash"),
  requestId: text("request_id"),
});

export const botTokens = pgTable("bot_tokens", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  scopes: text("scopes").array().notNull(),
  createdBy: text("created_by"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
});

function mirrorTable(name: string) {
  return pgTable(name, {
    notionId: text("notion_id").primaryKey(),
    data: jsonb("data").notNull(),
    notionLastEdited: timestamp("notion_last_edited", {
      withTimezone: true,
      mode: "date",
    }),
    syncedAt: timestamp("synced_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
  });
}

export const mirrorVolunteers = mirrorTable("mirror_volunteers");
export const mirrorTeams = mirrorTable("mirror_teams");
export const mirrorTasks = mirrorTable("mirror_tasks");
export const mirrorActivities = mirrorTable("mirror_activities");
export const mirrorResources = mirrorTable("mirror_resources");

export const syncState = pgTable("sync_state", {
  source: text("source").primaryKey(),
  cursor: text("cursor"),
  lastRunAt: timestamp("last_run_at", { withTimezone: true, mode: "date" }),
  status: text("status").notNull().default("idle"),
});

export const authSchema = { user, session, account, verification };

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  userId: text("user_id"),
  reporterName: text("reporter_name").notNull(),
  kind: text("kind").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  screen: text("screen"),
  userAgent: text("user_agent"),
  status: text("status").notNull().default("open"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true, mode: "date" }),
  resolvedBy: text("resolved_by"),
});
