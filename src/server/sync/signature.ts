import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyNotionSignature(
  body: string,
  signature: string | null,
  secret: string,
) {
  if (!signature) return false;
  const digest = createHmac("sha256", secret).update(body).digest("hex");
  const provided = signature.replace(/^sha256=/, "").trim();
  const left = Buffer.from(digest);
  const right = Buffer.from(provided);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
