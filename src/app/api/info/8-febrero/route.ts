import { NextResponse } from "next/server";
import { desc, eq, ilike } from "drizzle-orm";
import { dbInfo } from "@/db/connection-info";
import { forms, infoFeb8Status } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supervisor = url.searchParams.get("supervisor")?.trim();
  const baseQuery = dbInfo
    .select({
      sourceId: forms.id,
      recordedAt: forms.fecha,
      interviewer: forms.encuestador,
      supervisor: forms.candidate,
      name: forms.nombre,
      phone: forms.telefono,
      linksComment: forms.zona,
      east: forms.x,
      north: forms.y,
    })
    .from(forms);
  const records = await (supervisor
    ? baseQuery.where(ilike(forms.candidate, `%${supervisor}%`))
    : baseQuery
  ).orderBy(desc(forms.fecha));

  const statuses = await dbInfo
    .select({
      phone: infoFeb8Status.phone,
      contacted: infoFeb8Status.contacted,
      replied: infoFeb8Status.replied,
      updatedAt: infoFeb8Status.updatedAt,
    })
    .from(infoFeb8Status);

  const mapped = records.map((record) => ({
    ...record,
    latitude: null,
    longitude: null,
  }));

  return NextResponse.json({ records: mapped, statuses });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await dbInfo.delete(forms).where(eq(forms.id, id));
  return NextResponse.json({ ok: true });
}
