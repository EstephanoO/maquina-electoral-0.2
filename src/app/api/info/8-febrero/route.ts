import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { infoFeb8Registros, infoFeb8Status } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const records = await db
    .select({
      sourceId: infoFeb8Registros.sourceId,
      recordedAt: infoFeb8Registros.recordedAt,
      interviewer: infoFeb8Registros.interviewer,
      supervisor: infoFeb8Registros.supervisor,
      name: infoFeb8Registros.name,
      phone: infoFeb8Registros.phone,
      east: infoFeb8Registros.east,
      north: infoFeb8Registros.north,
      latitude: infoFeb8Registros.latitude,
      longitude: infoFeb8Registros.longitude,
    })
    .from(infoFeb8Registros)
    .orderBy(desc(infoFeb8Registros.recordedAt));

  const statuses = await db
    .select({
      phone: infoFeb8Status.phone,
      contacted: infoFeb8Status.contacted,
      replied: infoFeb8Status.replied,
      updatedAt: infoFeb8Status.updatedAt,
    })
    .from(infoFeb8Status);

  return NextResponse.json({ records, statuses });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.delete(infoFeb8Registros).where(eq(infoFeb8Registros.sourceId, id));
  return NextResponse.json({ ok: true });
}
