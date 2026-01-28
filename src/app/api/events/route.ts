import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { events } from "@/db/schema";

type EventPayload = {
  id: string;
  campaignId: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  startDate: string;
  endDate?: string;
  dashboardTemplate?: "tierra" | "mar" | "aire";
  contactName?: string;
  contactPhone?: string;
  location?: string;
  clients?: string[];
};

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<EventPayload>;
  if (!body.id || !body.campaignId || !body.name || !body.status || !body.startDate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (body.endDate) {
    const start = new Date(body.startDate);
    const end = new Date(body.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
    }
    if (end < start) {
      return NextResponse.json({ error: "End date before start date" }, { status: 400 });
    }
  }

  await db
    .insert(events)
    .values({
      id: body.id,
      campaignId: body.campaignId,
      name: body.name,
      status: body.status,
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      dashboardTemplate: body.dashboardTemplate ?? null,
      contactName: body.contactName ?? null,
      contactPhone: body.contactPhone ?? null,
      location: body.location ?? null,
      clients: body.clients ?? null,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const campaignId = url.searchParams.get("campaignId");
  const status = url.searchParams.get("status");
  const conditions = [] as Array<ReturnType<typeof and>>;
  if (id) {
    conditions.push(eq(events.id, id));
  }
  if (campaignId) {
    conditions.push(eq(events.campaignId, campaignId));
  }
  if (status) {
    conditions.push(eq(events.status, status));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: events.id,
      campaignId: events.campaignId,
      name: events.name,
      status: events.status,
      startDate: events.startDate,
      endDate: events.endDate,
      dashboardTemplate: events.dashboardTemplate,
      contactName: events.contactName,
      contactPhone: events.contactPhone,
      location: events.location,
      clients: events.clients,
    })
    .from(events)
    .where(whereClause);

  return NextResponse.json({ events: rows });
}
