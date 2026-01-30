import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const keyLength = 64;

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;
  return `${salt}.${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password: string, storedHash: string) => {
  const [salt, storedKey] = storedHash.split(".");
  if (!salt || !storedKey) {
    return false;
  }
  const derivedKey = (await scryptAsync(password, salt, keyLength)) as Buffer;
  const storedBuffer = Buffer.from(storedKey, "hex");
  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }
  return timingSafeEqual(storedBuffer, derivedKey);
};
