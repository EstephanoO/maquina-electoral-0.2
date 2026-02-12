import { boolean, integer, pgTable, text, timestamp, doublePrecision, jsonb, primaryKey, index, uuid, uniqueIndex } from "drizzle-orm/pg-core";

export const territory = pgTable("territory", {
  id: text("id").primaryKey(),
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
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: text("client_id"),
    nombre: text("nombre").notNull(),
    telefono: text("telefono").notNull(),
    fecha: timestamp("fecha", { withTimezone: true }).notNull(),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    zona: text("zona").notNull(),
    candidate: text("candidate").notNull().default(""),
    encuestador: text("encuestador").notNull(),
    encuestadorId: text("encuestador_id").notNull(),
    candidatoPreferido: text("candidato_preferido").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clientIdIdx: index("forms_client_id_idx").on(table.clientId),
  }),
);

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
  passwordHash: text("password_hash"),
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

export const infoFeb8Registros = pgTable("info_feb8_registros", {
  sourceId: text("source_id").primaryKey(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }),
  interviewer: text("interviewer"),
  supervisor: text("supervisor"),
  name: text("name"),
  phone: text("phone"),
  homeMapsUrl: text("home_maps_url"),
  pollingPlaceUrl: text("polling_place_url"),
  linksComment: text("links_comment"),
  east: doublePrecision("east"),
  north: doublePrecision("north"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const infoFeb8Status = pgTable("info_feb8_status", {
  sourceId: text("source_id").primaryKey(),
  phone: text("phone"),
  contacted: boolean("contacted").notNull().default(false),
  replied: boolean("replied").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  assignedToId: text("assigned_to_id"),
  assignedToName: text("assigned_to_name"),
  assignedToEmail: text("assigned_to_email"),
  assignedAt: timestamp("assigned_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const infoFeb8GuillermoStatus = pgTable("info_feb8_status_guillermo", {
  phone: text("phone").primaryKey(),
  contacted: boolean("contacted").notNull().default(false),
  replied: boolean("replied").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const infoFeb8GuillermoRegistros = pgTable("info_feb8_registros_guillermo", {
  sourceId: text("source_id").primaryKey(),
  interviewer: text("interviewer"),
  candidate: text("candidate"),
  name: text("name"),
  phone: text("phone"),
  signature: text("signature"),
  homeMapsUrl: text("home_maps_url"),
  pollingPlaceUrl: text("polling_place_url"),
  east: doublePrecision("east"),
  north: doublePrecision("north"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const infoFeb8GiovannaStatus = pgTable("info_feb8_status_giovanna", {
  phone: text("phone").primaryKey(),
  contacted: boolean("contacted").notNull().default(false),
  replied: boolean("replied").notNull().default(false),
  deleted: boolean("deleted").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const infoFeb8GiovannaRegistros = pgTable("info_feb8_registros_giovanna", {
  sourceId: text("source_id").primaryKey(),
  interviewer: text("interviewer"),
  candidate: text("candidate"),
  name: text("name"),
  phone: text("phone"),
  signature: text("signature"),
  homeMapsUrl: text("home_maps_url"),
  pollingPlaceUrl: text("polling_place_url"),
  east: doublePrecision("east"),
  north: doublePrecision("north"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  recordedAt: timestamp("recorded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const infoFeb8ActionEvents = pgTable(
  "info_feb8_action_events",
  {
    id: text("id").primaryKey(),
    operatorSlug: text("operator_slug").notNull(),
    action: text("action").notNull(),
    sourceId: text("source_id"),
    phone: text("phone"),
    personName: text("person_name"),
    actorId: text("actor_id").notNull(),
    actorName: text("actor_name").notNull(),
    actorEmail: text("actor_email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    operatorIdx: index("info_feb8_action_events_operator_idx").on(table.operatorSlug),
    actionIdx: index("info_feb8_action_events_action_idx").on(table.action),
    createdAtIdx: index("info_feb8_action_events_created_at_idx").on(table.createdAt),
  }),
);

export const operators = pgTable("operators", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const formsOperatorAccess = pgTable(
  "forms_operator_access",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id").notNull(),
    operatorId: uuid("operator_id").notNull(),
    enabledAt: timestamp("enabled_at", { withTimezone: true }).notNull().defaultNow(),
    enabledBy: text("enabled_by"),
  },
  (table) => ({
    uniquePair: uniqueIndex("forms_operator_access_unique").on(
      table.formId,
      table.operatorId,
    ),
    formIdIdx: index("forms_operator_access_form_idx").on(table.formId),
    operatorIdIdx: index("forms_operator_access_operator_idx").on(table.operatorId),
  }),
);

export const formsOperatorStatus = pgTable(
  "forms_operator_status",
  {
    formId: uuid("form_id").notNull(),
    operatorId: uuid("operator_id").notNull(),
    contacted: boolean("contacted").notNull().default(false),
    replied: boolean("replied").notNull().default(false),
    deleted: boolean("deleted").notNull().default(false),
    homeMapsUrl: text("home_maps_url"),
    pollingPlaceUrl: text("polling_place_url"),
    linksComment: text("links_comment"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.formId, table.operatorId] }),
    formIdIdx: index("forms_operator_status_form_idx").on(table.formId),
    operatorIdIdx: index("forms_operator_status_operator_idx").on(table.operatorId),
  }),
);
