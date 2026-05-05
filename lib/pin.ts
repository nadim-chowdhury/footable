import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

const PIN_LENGTH = 6;

export function generatePlainPin(): string {
  const n = randomInt(0, 10 ** PIN_LENGTH);
  return String(n).padStart(PIN_LENGTH, "0");
}

export async function hashPin(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPin(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
