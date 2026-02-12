import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { dbInfo } from "@/db/connection-info";
import { infoFeb8ActionEvents } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { isInfoUserEmail } from "@/info/auth";

export const runtime = "nodejs";

const ACTIONS = ["no_hablado", "hablado", "contestado", "eliminado", "whatsapp"] as const;
type InfoAction = (typeof ACTIONS)[number];

type ActionPayload = {
  action?: string;
  operatorSlug?: string;
  sourceId?: string;
  phone?: string;
  personName?: string;
};

const getOperatorFilter = (operatorSlug?: string | null) => {
  if (!operatorSlug) return sql``;
  return sql`WHERE operator_slug = ${operatorSlug}`;
};

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const operatorSlug = url.searchParams.get("operator")?.trim().toLowerCase() ?? null;
  const operatorFilter = getOperatorFilter(operatorSlug);

  const summaryQuery = sql`
    SELECT operator_slug AS "operatorSlug", action, count(*)::int AS "count"
    FROM info_feb8_action_events
    ${operatorFilter}
    GROUP BY operator_slug, action
    ORDER BY operator_slug, action
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
    ${operatorFilter}
    ORDER BY created_at DESC
    LIMIT 200
  `;

  const summary = await dbInfo.execute(summaryQuery);
  const recent = await dbInfo.execute(recentQuery);

  return NextResponse.json({ summary: summary.rows, recent: recent.rows });
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
