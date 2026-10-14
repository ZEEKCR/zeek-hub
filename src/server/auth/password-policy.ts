import { readFileSync } from "node:fs";
import path from "node:path";

let commonPasswords: Set<string> | undefined;

export function getCommonPasswords() {
  if (!commonPasswords) {
    const file = path.join(
      process.cwd(),
      "src",
      "server",
      "auth",
      "common-passwords.txt",
    );
    const words = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0);
    commonPasswords = new Set(words);
  }
  return commonPasswords;
}

export type PasswordRejection = "length" | "username" | "common";

export function normalizePassword(password: string) {
  return password.normalize("NFKC");
}

export function validatePassword(
  password: string,
  username: string,
): PasswordRejection | null {
  const normalized = normalizePassword(password);
  if (normalized.length < 12 || normalized.length > 128) return "length";
  if (normalized.toLowerCase() === username.toLowerCase()) return "username";
  if (getCommonPasswords().has(normalized.toLowerCase())) return "common";
  return null;
}

export function passwordRejectionMessage(reason: PasswordRejection) {
  if (reason === "length")
    return "La contraseña debe tener entre 12 y 128 caracteres.";
  if (reason === "username")
    return "La contraseña no puede ser igual al usuario.";
  return "Esa contraseña es demasiado común.";
}
