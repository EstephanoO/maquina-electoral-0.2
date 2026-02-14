import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const databaseUrl = process.env.DATABASE_URL3;

if (!databaseUrl) {
  throw new Error("DATABASE_URL3 is not set");
}

export const db = drizzle(neon(databaseUrl));
