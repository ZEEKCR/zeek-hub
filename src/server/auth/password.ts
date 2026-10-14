import { hash, verify } from "@node-rs/argon2";

const ARGON = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(password: string) {
  return hash(password, ARGON);
}

export async function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}

let decoyHash: string | undefined;

export async function getDecoyHash() {
  decoyHash ??= await hashPassword("decoy-password-not-a-credential");
  return decoyHash;
}
