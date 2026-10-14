import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/server/auth/config";

async function handler(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.includes("/sign-up")) {
    return Response.json(
      { message: "Registro deshabilitado" },
      { status: 404 },
    );
  }
  const handlers = toNextJsHandler(getAuth());
  if (request.method === "GET") return handlers.GET(request);
  if (request.method === "POST") return handlers.POST(request);
  return Response.json({ message: "Método no permitido" }, { status: 405 });
}

export const GET = handler;
export const POST = handler;
