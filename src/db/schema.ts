import { integer, pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const territory = pgTable("territory", {
  id: text("id").primaryKey(),
  interviewer: text("interviewer").notNull(),
  candidate: text("candidate").notNull(),
  signature: text("signature").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  srid: integer("srid").notNull().default(4326),
});
