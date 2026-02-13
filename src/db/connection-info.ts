import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL3 ?? process.env.DATABASE_URL2;

if (!databaseUrl) {
  throw new Error("DATABASE_URL3 or DATABASE_URL2 is not set");
}

export const dbInfo = drizzle(neon(databaseUrl));
