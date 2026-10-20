export const MAX_AGREEMENT_BYTES = 4_000_000;

/** A PDF starts with "%PDF-"; the file name or type the browser reports is not trusted. */
export function validateAgreement(
  bytes: Uint8Array,
): { ok: true } | { ok: false; message: string } {
  if (bytes.length === 0) {
    return { ok: false, message: "Escoge el archivo PDF del acuerdo firmado." };
  }
  if (bytes.length > MAX_AGREEMENT_BYTES) {
    return {
      ok: false,
      message:
        "El archivo pesa más de 4 MB. Comprime el PDF e inténtalo de nuevo.",
    };
  }
  const header = String.fromCharCode(...bytes.slice(0, 5));
  if (header !== "%PDF-") {
    return { ok: false, message: "El archivo debe ser un PDF." };
  }
  return { ok: true };
}

/** Keeps only safe characters, drops any path, and always ends in .pdf. */
export function cleanFilename(raw: string) {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const withoutExt = base.replace(/\.pdf$/i, "");
  const safe = withoutExt
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 80);
  return `${safe || "acuerdo"}.pdf`;
}

export function formatSize(bytes: number) {
  return bytes < 1_000_000
    ? `${Math.max(1, Math.round(bytes / 1000))} KB`
    : `${(bytes / 1_000_000).toFixed(1)} MB`;
}
