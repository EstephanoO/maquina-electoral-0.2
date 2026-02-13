import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl =
  process.env.DATABASE_URL3 ??
  process.env.DATABASE_URL2 ??
  process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL3, DATABASE_URL2, or DATABASE_URL is not set");
}

export const db = drizzle(neon(databaseUrl));
