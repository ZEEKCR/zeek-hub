import Link from "next/link";
import { requireActor } from "@/server/auth/request";
import { readyAuth } from "@/server/auth/config";
import { headers } from "next/headers";

export default async function ProfilePage() {
  const actor = await requireActor();
  const auth = await readyAuth();
  const sessions = await auth.api.listSessions({ headers: await headers() });
  return (
    <div className="grid gap-6">
      <h1 className="text-4xl font-semibold">Perfil</h1>
      <section className="bg-surface-1 rounded-[28px] p-6">
        <p className="text-muted text-sm">Usuario</p>
        <p className="text-2xl font-semibold">{actor.displayName}</p>
        <p className="text-muted mt-2">@{actor.username}</p>
        <p className="mt-4 text-sm">Rol: {actor.role}</p>
        <Link
          href="/cambiar-contrasena"
          className="bg-accent mt-6 inline-flex h-11 items-center rounded-full px-4 font-semibold text-[#161616]"
        >
          Cambiar contraseña
        </Link>
      </section>
      <section className="bg-surface-1 rounded-[28px] p-6">
        <h2 className="text-2xl font-semibold">Sesiones activas</h2>
        <ul className="mt-4 grid gap-3">
          {sessions.map((item) => (
            <li
              key={item.id}
              className="bg-surface-2 rounded-[20px] px-4 py-3 text-sm"
            >
              {item.userAgent || "Sesión"} · vence{" "}
              {new Date(item.expiresAt).toLocaleString("es-CR", {
                timeZone: "America/Costa_Rica",
              })}
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
