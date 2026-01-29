import { integer, pgTable, text, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";

export const territory = pgTable("territory", {
  id: text("id").primaryKey(),
  eventId: text("event_id"),
  interviewer: text("interviewer").notNull(),
  candidate: text("candidate").notNull(),
  signature: text("signature").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  east: doublePrecision("east"),
  north: doublePrecision("north"),
  srid: integer("srid").notNull().default(4326),
});

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  dashboardTemplate: text("dashboard_template"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  location: text("location"),
  clients: text("clients").array(),
});

export const campaignGeojson = pgTable("campaign_geojson", {
  campaignId: text("campaign_id").primaryKey(),
  geojson: jsonb("geojson").notNull(),
  fileName: text("file_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
