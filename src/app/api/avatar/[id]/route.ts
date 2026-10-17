import { requireActor } from "@/server/auth/request";
import { readPhoto } from "@/server/services/photos";

/** Photos are only for signed-in people; the `v` query makes a new upload bypass the cache. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireActor();
  const { id } = await params;
  const photo = await readPhoto(id);
  if (!photo) return new Response(null, { status: 404 });
  const etag = `"${photo.updatedAt.getTime()}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }
  return new Response(new Uint8Array(photo.bytes), {
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      ETag: etag,
    },
  });
}
