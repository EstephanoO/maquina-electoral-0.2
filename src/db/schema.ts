import { integer, pgTable, text, timestamp, doublePrecision, jsonb, primaryKey } from "drizzle-orm/pg-core";

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

export const campaignGeojson = pgTable(
  "campaign_geojson",
  {
    campaignId: text("campaign_id").notNull(),
    layerType: text("layer_type").notNull(),
    geojson: jsonb("geojson").notNull(),
    meta: jsonb("meta"),
    fileName: text("file_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.campaignId, table.layerType] }),
  }),
);

export const interviewerTracking = pgTable("interviewer_tracking", {
  id: text("id").primaryKey(),
  eventId: text("event_id"),
  interviewer: text("interviewer").notNull(),
  candidate: text("candidate").notNull(),
  signature: text("signature").notNull(),
  interviewerKey: text("interviewer_key").notNull(),
  mode: text("mode").notNull(),
  trackedAt: timestamp("tracked_at", { withTimezone: true }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  accuracy: doublePrecision("accuracy"),
  altitude: doublePrecision("altitude"),
  speed: doublePrecision("speed"),
  heading: doublePrecision("heading"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const authUsers = pgTable("auth_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  name: text("name").notNull(),
  campaignId: text("campaign_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
