import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { infoFeb8GiovannaRegistros, infoFeb8GiovannaStatus } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const records = await db
    .select({
      sourceId: infoFeb8GiovannaRegistros.sourceId,
      recordedAt: infoFeb8GiovannaRegistros.recordedAt,
      interviewer: infoFeb8GiovannaRegistros.interviewer,
      candidate: infoFeb8GiovannaRegistros.candidate,
      name: infoFeb8GiovannaRegistros.name,
      phone: infoFeb8GiovannaRegistros.phone,
      east: infoFeb8GiovannaRegistros.east,
      north: infoFeb8GiovannaRegistros.north,
      latitude: infoFeb8GiovannaRegistros.latitude,
      longitude: infoFeb8GiovannaRegistros.longitude,
    })
    .from(infoFeb8GiovannaRegistros)
    .orderBy(desc(infoFeb8GiovannaRegistros.recordedAt));

  const statuses = await db
    .select({
      phone: infoFeb8GiovannaStatus.phone,
      contacted: infoFeb8GiovannaStatus.contacted,
      replied: infoFeb8GiovannaStatus.replied,
      deleted: infoFeb8GiovannaStatus.deleted,
      updatedAt: infoFeb8GiovannaStatus.updatedAt,
    })
    .from(infoFeb8GiovannaStatus);

  const statusMap = statuses.reduce((acc, status) => {
    acc[status.phone] = status;
    return acc;
  }, {} as Record<string, (typeof statuses)[number]>);

  const filtered = records.filter(
    (record) => record.phone && !statusMap[record.phone]?.deleted,
  );

  return NextResponse.json({ records: filtered, statuses });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const target = await db
    .select({ phone: infoFeb8GiovannaRegistros.phone })
    .from(infoFeb8GiovannaRegistros)
    .where(eq(infoFeb8GiovannaRegistros.sourceId, id))
    .limit(1);
  const phone = target[0]?.phone;
  if (!phone) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const updatedAt = new Date();
  await db
    .insert(infoFeb8GiovannaStatus)
    .values({
      phone,
      contacted: false,
      replied: false,
      deleted: true,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: infoFeb8GiovannaStatus.phone,
      set: { deleted: true, updatedAt },
    });

  return NextResponse.json({ ok: true });
}
