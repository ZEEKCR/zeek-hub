import { createHash } from "node:crypto";

export async function isPasswordPwned(
  password: string,
): Promise<boolean | null> {
  const digest = createHash("sha1")
    .update(password)
    .digest("hex")
    .toUpperCase();
  const prefix = digest.slice(0, 5);
  const suffix = digest.slice(5);
  try {
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: { "Add-Padding": "true" },
        signal: AbortSignal.timeout(4000),
      },
    );
    if (!response.ok) return null;
    const body = await response.text();
    return body.split("\n").some((line) => line.startsWith(suffix));
  } catch {
    return null;
  }
}
