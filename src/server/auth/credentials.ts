import { randomBytes } from "node:crypto";

const ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

export const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;

export function normalizeUsername(value: string) {
  return value.normalize("NFKC").trim().toLowerCase();
}

export function placeholderEmail(username: string) {
  return `${normalizeUsername(username)}@users.invalid`;
}

export function isPlaceholderEmail(email: string | null | undefined) {
  return !email || email.endsWith("@users.invalid");
}

export function publicEmail(email: string | null | undefined) {
  return isPlaceholderEmail(email) ? undefined : email;
}

export function generateTempPassword() {
  const bytes = randomBytes(16);
  let password = "";
  for (const byte of bytes) {
    password += ALPHABET[byte % ALPHABET.length] ?? "a";
  }
  return password;
}

export const GENERIC_LOGIN_ERROR = "Usuario o contraseña incorrectos.";
