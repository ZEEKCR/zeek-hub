import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { formatCostaRica } from "@/lib/dates";
import { sessionDevice } from "@/lib/session-device";
import { readyAuth } from "@/server/auth/config";
import { requireActor } from "@/server/auth/request";

export default async function ProfilePage() {
  const actor = await requireActor();
  const auth = await readyAuth();
  const sessions = await auth.api.listSessions({ headers: await headers() });
  const devices = new Map<string, (typeof sessions)[number]>();
  for (const item of sessions) {
    const label = sessionDevice(item.userAgent);
    const current = devices.get(label);
    if (
      !current ||
      new Date(item.expiresAt).getTime() > new Date(current.expiresAt).getTime()
    ) {
      devices.set(label, item);
    }
  }
  return (
    <div className="grid gap-6">
      <h1 className="text-4xl font-semibold">Perfil</h1>
      <section className="bg-surface-1 rounded-[28px] p-6">
        <p className="text-muted text-sm">Usuario</p>
        <p className="text-2xl font-semibold">
          {actor.fullName || actor.displayName}
        </p>
        <p className="text-muted mt-2">@{actor.username}</p>
        <p className="mt-4 text-sm">Rol: {actor.role}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/cambiar-contrasena"
            className="bg-accent inline-flex h-11 items-center rounded-full px-4 font-semibold text-[#161616]"
          >
            Cambiar contraseña
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="bg-surface-2 h-11 rounded-full px-4 font-medium"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </section>
      <section className="bg-surface-1 rounded-[28px] p-6">
        <h2 className="text-2xl font-semibold">Sesiones activas</h2>
        <ul className="mt-4 grid gap-3">
          {[...devices.entries()].map(([label, item]) => (
            <li
              key={label}
              className="bg-surface-2 rounded-[20px] px-4 py-3 text-sm"
            >
              {label} · vence{" "}
              {formatCostaRica(item.expiresAt, "d MMM yyyy, HH:mm")}
            </li>
          ))}
        </ul>
        <form action={revokeOthers} className="mt-4">
          <button
            type="submit"
            className="bg-surface-2 h-11 rounded-full px-4 font-medium"
          >
            Cerrar las demás
          </button>
        </form>
      </section>
    </div>
  );
}

async function revokeOthers() {
  "use server";
  const auth = await readyAuth();
  await auth.api.revokeOtherSessions({ headers: await headers() });
}

async function signOut() {
  "use server";
  const auth = await readyAuth();
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
