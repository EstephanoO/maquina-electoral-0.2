import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { dbInfo } from "@/db/connection-info";
import { infoFeb8ActionEvents } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { isInfoUserEmail } from "@/info/auth";

export const runtime = "nodejs";

const ACTIONS = [
  "no_hablado",
  "hablado",
  "contestado",
  "eliminado",
  "whatsapp",
  "nuevo_contacto",
  "domicilio_agregado",
  "local_agregado",
] as const;
const RANGE_OPTIONS = ["today", "7d", "30d"] as const;
type RangeOption = (typeof RANGE_OPTIONS)[number];
type InfoAction = (typeof ACTIONS)[number];

type ActionPayload = {
  action?: string;
  operatorSlug?: string;
  sourceId?: string;
  phone?: string;
  personName?: string;
};

const buildWhereClause = (conditions: Array<ReturnType<typeof sql> | null>) => {
  const entries = conditions.filter(Boolean) as Array<ReturnType<typeof sql>>;
  if (entries.length === 0) return sql``;
  return sql`WHERE ${sql.join(entries, sql` AND `)}`;
};

const getRangeStart = (range: RangeOption) => {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "7d") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
};

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const operatorSlug = url.searchParams.get("operator")?.trim().toLowerCase() ?? null;
  const rangeParam = url.searchParams.get("range")?.trim().toLowerCase() ?? "7d";
  const range = RANGE_OPTIONS.includes(rangeParam as RangeOption)
    ? (rangeParam as RangeOption)
    : "7d";
  const rangeStart = getRangeStart(range);
  const whereClause = buildWhereClause([
    sql`created_at >= ${rangeStart}`,
    operatorSlug ? sql`operator_slug = ${operatorSlug}` : null,
  ]);

  const summaryQuery = sql`
    SELECT
      actor_id AS "operatorId",
      max(actor_name) AS "operatorName",
      max(actor_email) AS "operatorEmail",
      action,
      count(*)::int AS "count"
    FROM info_feb8_action_events
    ${whereClause}
    GROUP BY actor_id, action
    ORDER BY actor_id, action
  `;

  const uniqueQuery = sql`
    SELECT
      actor_id AS "operatorId",
      max(actor_name) AS "operatorName",
      max(actor_email) AS "operatorEmail",
      action,
      count(DISTINCT COALESCE(source_id, phone, id))::int AS "count"
    FROM info_feb8_action_events
    ${whereClause}
    GROUP BY actor_id, action
    ORDER BY actor_id, action
  `;

  const timersQuery = sql`
    WITH filtered AS (
      SELECT
        actor_id,
        actor_name,
        actor_email,
        action,
        source_id,
        phone,
        id,
        created_at,
        COALESCE(source_id, phone, id) AS event_key
      FROM info_feb8_action_events
      ${whereClause}
    ),
    first_whatsapp AS (
      SELECT actor_id, max(actor_name) AS actor_name, max(actor_email) AS actor_email, event_key, min(created_at) AS first_whatsapp
      FROM filtered
      WHERE action = 'whatsapp'
      GROUP BY actor_id, event_key
    ),
    first_hablado AS (
      SELECT actor_id, max(actor_name) AS actor_name, max(actor_email) AS actor_email, event_key, min(created_at) AS first_hablado
      FROM filtered
      WHERE action = 'hablado'
      GROUP BY actor_id, event_key
    ),
    first_contestado AS (
      SELECT actor_id, max(actor_name) AS actor_name, max(actor_email) AS actor_email, event_key, min(created_at) AS first_contestado
      FROM filtered
      WHERE action = 'contestado'
      GROUP BY actor_id, event_key
    ),
    paired_hablado AS (
      SELECT
        w.actor_id,
        w.actor_name,
        w.actor_email,
        EXTRACT(EPOCH FROM (h.first_hablado - w.first_whatsapp)) AS seconds
      FROM first_whatsapp w
      JOIN first_hablado h
        ON w.actor_id = h.actor_id
        AND w.event_key = h.event_key
      WHERE h.first_hablado >= w.first_whatsapp
    ),
    paired_contestado AS (
      SELECT
        w.actor_id,
        w.actor_name,
        w.actor_email,
        EXTRACT(EPOCH FROM (c.first_contestado - w.first_whatsapp)) AS seconds
      FROM first_whatsapp w
      JOIN first_contestado c
        ON w.actor_id = c.actor_id
        AND w.event_key = c.event_key
      WHERE c.first_contestado >= w.first_whatsapp
    ),
    metrics AS (
      SELECT actor_id, actor_name, actor_email, 'hablado' AS metric, seconds FROM paired_hablado
      UNION ALL
      SELECT actor_id, actor_name, actor_email, 'contestado' AS metric, seconds FROM paired_contestado
    )
    SELECT
      actor_id AS "operatorId",
      max(actor_name) AS "operatorName",
      max(actor_email) AS "operatorEmail",
      metric,
      count(*)::int AS "count",
      avg(seconds)::double precision AS "avgSeconds",
      percentile_cont(0.5) WITHIN GROUP (ORDER BY seconds)::double precision AS "medianSeconds",
      percentile_cont(0.9) WITHIN GROUP (ORDER BY seconds)::double precision AS "p90Seconds"
    FROM metrics
    GROUP BY actor_id, metric
    ORDER BY actor_id, metric
  `;

  const recentQuery = sql`
    SELECT
      id,
      operator_slug AS "operatorSlug",
      action,
      source_id AS "sourceId",
      phone,
      person_name AS "personName",
      actor_id AS "actorId",
      actor_name AS "actorName",
      actor_email AS "actorEmail",
      created_at AS "createdAt"
    FROM info_feb8_action_events
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  const summary = await dbInfo.execute(summaryQuery);
  const unique = await dbInfo.execute(uniqueQuery);
  const timers = await dbInfo.execute(timersQuery);
  const recent = await dbInfo.execute(recentQuery);

  return NextResponse.json({
    summary: summary.rows,
    unique: unique.rows,
    timers: timers.rows,
    recent: recent.rows,
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as ActionPayload;
  const action = payload.action?.trim().toLowerCase() as InfoAction | undefined;
  const operatorSlug = payload.operatorSlug?.trim().toLowerCase();

  if (!action || !ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (!operatorSlug) {
    return NextResponse.json({ error: "Missing operator" }, { status: 400 });
  }

  await dbInfo.insert(infoFeb8ActionEvents).values({
    id: randomUUID(),
    operatorSlug,
    action,
    sourceId: payload.sourceId?.trim() || null,
    phone: payload.phone?.trim() || null,
    personName: payload.personName?.trim() || null,
    actorId: user.id,
    actorName: user.name,
    actorEmail: user.email,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}
