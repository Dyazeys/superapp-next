import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, nValue, rValue, pValue, salt, expectedHash] = passwordHash.split("$");

  if (algorithm !== "scrypt" || !nValue || !rValue || !pValue || !salt || !expectedHash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, expectedHash.length / 2, {
    N: Number.parseInt(nValue, 10),
    r: Number.parseInt(rValue, 10),
    p: Number.parseInt(pValue, 10),
  });

  const expectedBuffer = Buffer.from(expectedHash, "hex");

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedBuffer);
}
