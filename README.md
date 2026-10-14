# ZEEK Hub

Aplicación web para que los voluntarios de ZEEK vean proyectos, calendario, tareas, equipos y recursos. Notion sigue siendo la fuente de verdad. Neon guarda autenticación, sesiones, auditoría y un espejo de lectura.

## Requisitos

- Node.js 22 o superior
- pnpm 11

## Puesta en marcha

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm dev
```

En local, `DATABASE_URL=pglite:.data/dev` usa Postgres embebido. En Vercel se usa la URL de Neon. `NOTION_MODE=mock` evita llamar a Notion (previews y CI).

## Integración de Notion

1. Crear una integración interna llamada **ZEEK Hub** con permiso para leer, actualizar e insertar contenido, sin acceso a los correos del workspace.
2. Compartirla solo con las bases Voluntarios, Equipos, Recursos, Tasks y Activities.
3. Guardar el token en `NOTION_ZEEK_TOKEN` del entorno Production de Vercel. Los previews quedan en `NOTION_MODE=mock`.
4. Revisar el plan sin escribir nada:

```bash
pnpm notion:setup
```

5. Aplicar solo con aprobación explícita:

```bash
CONFIRM=yes pnpm notion:setup -- --apply
```

## Seed de admins

El seed se corre a mano, una sola vez, fuera de CI. Imprime cada contraseña temporal una sola vez en esa consola.

```bash
pnpm seed:admins
```

`SEED_USERS` puede reemplazar la lista por un JSON `[{ "username", "email", "team" }]`. No incluye contraseñas.

## Pruebas

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

CI usa `NOTION_MODE=mock`. Ningún test llama al Notion real.

## Variables

Ver `.env.example`. En producción también hacen falta `CRON_SECRET`, `NOTION_WEBHOOK_SECRET` y Upstash. Si `NOTION_MODE=live`, hace falta `NOTION_ZEEK_TOKEN`.
