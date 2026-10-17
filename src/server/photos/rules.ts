export const MAX_PHOTO_BYTES = 150_000;

/** The browser sends a JPEG it resized itself; anything else is refused. */
export function validatePhoto(
  bytes: Uint8Array,
): { ok: true } | { ok: false; message: string } {
  if (bytes.length === 0) {
    return { ok: false, message: "Escoge una foto." };
  }
  if (bytes.length > MAX_PHOTO_BYTES) {
    return { ok: false, message: "La foto es demasiado pesada." };
  }
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isJpeg) {
    return { ok: false, message: "La foto debe ser una imagen JPEG." };
  }
  return { ok: true };
}

export function photoUrl(
  userId: string,
  versions: Map<string, number>,
): string | undefined {
  const version = versions.get(userId);
  return version ? `/api/avatar/${userId}?v=${version}` : undefined;
}
