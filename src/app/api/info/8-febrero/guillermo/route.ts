import { NextResponse } from "next/server";
import { dbInfo } from "@/db/connection-info";
import { desc, eq } from "drizzle-orm";
import { infoFeb8GuillermoRegistros, infoFeb8GuillermoStatus } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const records = await dbInfo
    .select({
      sourceId: infoFeb8GuillermoRegistros.sourceId,
      recordedAt: infoFeb8GuillermoRegistros.recordedAt,
      interviewer: infoFeb8GuillermoRegistros.interviewer,
      candidate: infoFeb8GuillermoRegistros.candidate,
      name: infoFeb8GuillermoRegistros.name,
      phone: infoFeb8GuillermoRegistros.phone,
      homeMapsUrl: infoFeb8GuillermoRegistros.homeMapsUrl,
      pollingPlaceUrl: infoFeb8GuillermoRegistros.pollingPlaceUrl,
      east: infoFeb8GuillermoRegistros.east,
      north: infoFeb8GuillermoRegistros.north,
      latitude: infoFeb8GuillermoRegistros.latitude,
      longitude: infoFeb8GuillermoRegistros.longitude,
    })
    .from(infoFeb8GuillermoRegistros)
    .orderBy(desc(infoFeb8GuillermoRegistros.recordedAt));

  const statuses = await dbInfo
    .select({
      phone: infoFeb8GuillermoStatus.phone,
      contacted: infoFeb8GuillermoStatus.contacted,
      replied: infoFeb8GuillermoStatus.replied,
      deleted: infoFeb8GuillermoStatus.deleted,
      updatedAt: infoFeb8GuillermoStatus.updatedAt,
    })
    .from(infoFeb8GuillermoStatus);

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

  const target = await dbInfo
    .select({ phone: infoFeb8GuillermoRegistros.phone })
    .from(infoFeb8GuillermoRegistros)
    .where(eq(infoFeb8GuillermoRegistros.sourceId, id))
    .limit(1);
  const phone = target[0]?.phone;
  if (!phone) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const updatedAt = new Date();
  await dbInfo
    .insert(infoFeb8GuillermoStatus)
    .values({
      phone,
      contacted: false,
      replied: false,
      deleted: true,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: infoFeb8GuillermoStatus.phone,
      set: { deleted: true, updatedAt },
    });

  return NextResponse.json({ ok: true });
}
