import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL3 ??
      process.env.DATABASE_URL2 ??
      process.env.DATABASE_URL ??
      "",
  },
} satisfies Config;
