const SIZE = 256;

/**
 * Crops the picture to a centred square and returns a small JPEG, so the
 * server only ever stores a few kilobytes and never a phone's full-size photo.
 */
export async function resizeToJpeg(file: File, maxBytes = 120_000) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();
  for (const quality of [0.88, 0.75, 0.6, 0.45]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (blob && blob.size <= maxBytes) return blob;
  }
  throw new Error("too-big");
}
