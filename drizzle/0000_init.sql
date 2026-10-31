CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "username" text UNIQUE,
  "display_username" text,
  "role" text NOT NULL DEFAULT 'volunteer',
  "banned" boolean NOT NULL DEFAULT false,
  "ban_reason" text,
  "ban_expires" timestamptz,
  "must_change_password" boolean NOT NULL DEFAULT false,
  "temp_password_expires_at" timestamptz,
  "notion_volunteer_id" text,
  "team_id" text,
  "created_by" text,
  "privacy_accepted_at" timestamptz
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY,
  "expires_at" timestamptz NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL,
  "ip_hash" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "impersonated_by" text,
  "absolute_expires_at" timestamptz
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope" text,
  "password" text,
  "created_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz,
  "updated_at" timestamptz
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "login_attempts" (
  "user_key" text PRIMARY KEY,
  "failures" integer NOT NULL DEFAULT 0,
  "locked_until" timestamptz,
  "last_failure_at" timestamptz
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" text PRIMARY KEY,
  "at" timestamptz NOT NULL,
  "actor_type" text NOT NULL,
  "actor_id" text,
  "action" text NOT NULL,
  "entity" text NOT NULL,
  "entity_id" text,
  "before" jsonb,
  "after" jsonb,
  "ip_hash" text,
  "request_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bot_tokens" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "token_hash" text NOT NULL UNIQUE,
  "scopes" text[] NOT NULL,
  "created_by" text,
  "last_used_at" timestamptz,
  "expires_at" timestamptz,
  "revoked_at" timestamptz
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mirror_volunteers" (
  "notion_id" text PRIMARY KEY,
  "data" jsonb NOT NULL,
  "notion_last_edited" timestamptz,
  "synced_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mirror_teams" (
  "notion_id" text PRIMARY KEY,
  "data" jsonb NOT NULL,
  "notion_last_edited" timestamptz,
  "synced_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mirror_tasks" (
  "notion_id" text PRIMARY KEY,
  "data" jsonb NOT NULL,
  "notion_last_edited" timestamptz,
  "synced_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mirror_activities" (
  "notion_id" text PRIMARY KEY,
  "data" jsonb NOT NULL,
  "notion_last_edited" timestamptz,
  "synced_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mirror_resources" (
  "notion_id" text PRIMARY KEY,
  "data" jsonb NOT NULL,
  "notion_last_edited" timestamptz,
  "synced_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_state" (
  "source" text PRIMARY KEY,
  "cursor" text,
  "last_run_at" timestamptz,
  "status" text NOT NULL DEFAULT 'idle'
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "team_id" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "job_title" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "birth_month" integer;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "birth_day" integer;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
  "id" text PRIMARY KEY,
  "created_at" timestamptz NOT NULL,
  "user_id" text,
  "reporter_name" text NOT NULL,
  "kind" text NOT NULL,
  "subject" text NOT NULL,
  "message" text NOT NULL,
  "screen" text,
  "user_agent" text,
  "status" text NOT NULL DEFAULT 'open',
  "resolved_at" timestamptz,
  "resolved_by" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_rsvps" (
  "activity_id" text NOT NULL,
  "user_id" text NOT NULL,
  "status" text NOT NULL,
  "updated_at" timestamptz NOT NULL,
  PRIMARY KEY ("activity_id", "user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_shifts" (
  "id" text PRIMARY KEY,
  "activity_id" text NOT NULL,
  "title" text NOT NULL,
  "starts_at" timestamptz NOT NULL,
  "ends_at" timestamptz NOT NULL,
  "capacity" integer NOT NULL,
  "created_by" text,
  "created_at" timestamptz NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "shift_signups" (
  "shift_id" text NOT NULL,
  "user_id" text NOT NULL,
  "created_at" timestamptz NOT NULL,
  PRIMARY KEY ("shift_id", "user_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_shifts_activity_idx" ON "event_shifts" ("activity_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_photos" (
  "user_id" text PRIMARY KEY,
  "content_type" text NOT NULL,
  "data" text NOT NULL,
  "updated_at" timestamptz NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'welcome_seen_at'
  ) THEN
    ALTER TABLE "user" ADD COLUMN "welcome_seen_at" timestamptz;
    -- People who already use the hub do not get the first-visit welcome.
    UPDATE "user" SET "welcome_seen_at" = COALESCE("privacy_accepted_at", now())
      WHERE "privacy_accepted_at" IS NOT NULL;
  END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "volunteer_agreements" (
  "user_id" text PRIMARY KEY,
  "filename" text NOT NULL,
  "size" integer NOT NULL,
  "data" text NOT NULL,
  "uploaded_at" timestamptz NOT NULL,
  "uploaded_by" text
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "country" text NOT NULL DEFAULT 'cr';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_suggestions" (
  "id" text PRIMARY KEY,
  "created_at" timestamptz NOT NULL,
  "user_id" text NOT NULL,
  "suggester_name" text NOT NULL,
  "kind" text NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "contact_name" text,
  "contact_info" text,
  "country" text NOT NULL DEFAULT 'cr',
  "status" text NOT NULL DEFAULT 'new',
  "reviewed_at" timestamptz,
  "reviewed_by" text
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_suggestions_user_idx" ON "event_suggestions" ("user_id");
