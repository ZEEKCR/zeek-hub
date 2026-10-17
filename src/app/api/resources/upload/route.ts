import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { authorize } from "@/server/auth/policy";
import { getRequestActor } from "@/server/auth/request";
import {
  MAX_UPLOAD_BYTES,
  UPLOAD_CONTENT_TYPES,
} from "@/server/resources/rules";

export async function POST(request: Request) {
  const actor = await getRequestActor();
  if (!authorize(actor, "resources.create")) {
    return Response.json(
      { error: "No tiene permiso para subir archivos." },
      { status: 403 },
    );
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      {
        error:
          "Falta configurar el almacenamiento de archivos (BLOB_READ_WRITE_TOKEN).",
      },
      { status: 503 },
    );
  }
  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Solicitud no válida." }, { status: 400 });
  }
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: UPLOAD_CONTENT_TYPES,
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ userId: actor?.userId ?? null }),
      }),
    });
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "No se pudo preparar la subida del archivo." },
      { status: 400 },
    );
  }
}
