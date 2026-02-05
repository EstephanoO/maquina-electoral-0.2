import { boolean, integer, pgTable, text, timestamp, doublePrecision, jsonb, primaryKey, index } from "drizzle-orm/pg-core";

export const territory = pgTable("territory", {
  id: text("id").primaryKey(),
  eventId: text("event_id"),
  interviewer: text("interviewer"),
  candidate: text("candidate"),
  signature: text("signature"),
  name: text("name"),
  phone: text("phone"),
  address: text("address"),
  addressLocation: jsonb("address_location"),
  addressUtm: jsonb("address_utm"),
  location: jsonb("location"),
  createdAt: timestamp("created_at", { withTimezone: true }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  east: doublePrecision("east"),
  north: doublePrecision("north"),
  srid: integer("srid").default(4326),
});

export const forms = pgTable(
  "forms",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id"),
    nombre: text("nombre"),
    telefono: text("telefono"),
    fecha: timestamp("fecha", { withTimezone: true }),
    x: doublePrecision("x"),
    y: doublePrecision("y"),
    zona: text("zona"),
    candidate: text("candidate"),
    encuestador: text("encuestador"),
    encuestadorId: text("encuestador_id"),
    candidatoPreferido: text("candidato_preferido"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index("forms_client_id_idx").on(table.clientId),
  }),
);

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

export const appStateEvents = pgTable(
  "app_state_events",
  {
    id: text("id").primaryKey(),
    signature: text("signature").notNull(),
    interviewer: text("interviewer"),
    candidate: text("candidate"),
    appState: text("app_state").notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
    isConnected: boolean("is_connected"),
    isInternetReachable: boolean("is_internet_reachable"),
    connectionType: text("connection_type"),
    deviceOs: text("device_os"),
    deviceOsVersion: text("device_os_version"),
    deviceModel: text("device_model"),
    appVersion: text("app_version"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    signatureIdx: index("app_state_events_signature_idx").on(table.signature),
  }),
);

export const appStateCurrent = pgTable("app_state_current", {
  signature: text("signature").primaryKey(),
  interviewer: text("interviewer"),
  candidate: text("candidate"),
  lastState: text("last_state"),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  lastSeenActiveAt: timestamp("last_seen_active_at", { withTimezone: true }),
  lastIsConnected: boolean("last_is_connected"),
  lastIsInternetReachable: boolean("last_is_internet_reachable"),
  lastConnectionType: text("last_connection_type"),
  deviceOs: text("device_os"),
  deviceOsVersion: text("device_os_version"),
  deviceModel: text("device_model"),
  appVersion: text("app_version"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
