import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readyAuth } from "@/server/auth/config";
import { buildActor } from "@/server/services/users";
import type { Actor } from "@/server/domain/types";

export async function getRequestActor(): Promise<Actor | null> {
  const headerList = await headers();
  const auth = await readyAuth();
  const session = await auth.api.getSession({ headers: headerList });
  if (!session) return null;
  const absolute =
    "absoluteExpiresAt" in session.session
      ? session.session.absoluteExpiresAt
      : null;
  if (absolute && new Date(String(absolute)).getTime() < Date.now()) {
    await auth.api.signOut({ headers: headerList });
    return null;
  }
  const actor = await buildActor(session.user.id);
  if (!actor || actor.banned) {
    await auth.api.signOut({ headers: headerList });
    return null;
  }
  return actor;
}

export async function requireActor() {
  const actor = await getRequestActor();
  if (!actor) redirect("/login");
  return actor;
}

export function clientIp(headerList: Headers) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headerList.get("x-real-ip") ?? "unknown";
}
