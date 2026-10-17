import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "@/server/auth/config";
import { ensureMigrated } from "@/server/db/client";
import { buildActor } from "@/server/services/users";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/api/webhooks",
  "/api/cron",
  "/api/health",
];

const ABSOLUTE_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function isPublic(pathname: string) {
  return (
    pathname === "/" ||
    PUBLIC_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

function pastAbsoluteCap(session: {
  absoluteExpiresAt?: Date | string | null;
  createdAt?: Date | string | null;
}) {
  if (session.absoluteExpiresAt) {
    return new Date(session.absoluteExpiresAt).getTime() < Date.now();
  }
  if (!session.createdAt) return false;
  return (
    new Date(session.createdAt).getTime() + ABSOLUTE_SESSION_MS < Date.now()
  );
}

function withClearedSession(response: NextResponse, signedOut: Response) {
  for (const cookie of signedOut.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname.includes("."))
    return NextResponse.next();

  await ensureMigrated();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  let actor = session ? await buildActor(session.user.id) : null;
  const sessionRecord = session?.session as
    | {
        absoluteExpiresAt?: Date | string | null;
        createdAt?: Date | string | null;
      }
    | undefined;
  const sessionRejected =
    session != null &&
    (!actor || actor.banned || pastAbsoluteCap(sessionRecord ?? {}));

  if (sessionRejected) {
    const signedOut = await auth.api.signOut({
      headers: request.headers,
      asResponse: true,
    });
    actor = null;
    if (!isPublic(pathname) && pathname !== "/privacidad") {
      return withClearedSession(
        NextResponse.redirect(new URL("/login", request.url)),
        signedOut,
      );
    }
    return withClearedSession(NextResponse.next(), signedOut);
  }

  if (!actor && !isPublic(pathname) && pathname !== "/privacidad") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (
    actor?.mustChangePassword &&
    pathname !== "/cambiar-contrasena" &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL("/cambiar-contrasena", request.url));
  }

  if (
    actor &&
    !actor.mustChangePassword &&
    !actor.privacyAcceptedAt &&
    pathname !== "/privacidad" &&
    !pathname.startsWith("/api/") &&
    pathname !== "/cambiar-contrasena"
  ) {
    return NextResponse.redirect(new URL("/privacidad", request.url));
  }

  if (actor && pathname === "/login") {
    const destination = actor.mustChangePassword
      ? "/cambiar-contrasena"
      : actor.privacyAcceptedAt
        ? "/inicio"
        : "/privacidad";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
