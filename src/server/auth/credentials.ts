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

const ALPHABET_LIMIT = 256 - (256 % ALPHABET.length);

export function unbiasedAlphabetIndex(byte: number) {
  if (byte >= ALPHABET_LIMIT) return null;
  return byte % ALPHABET.length;
}

export function generateTempPassword() {
  let password = "";
  while (password.length < 16) {
    const bytes = randomBytes(16);
    for (const byte of bytes) {
      const index = unbiasedAlphabetIndex(byte);
      if (index === null) continue;
      const character = ALPHABET[index];
      if (character === undefined) continue;
      password += character;
      if (password.length === 16) break;
    }
  }
  return password;
}

export const GENERIC_LOGIN_ERROR = "Usuario o contraseña incorrectos.";
