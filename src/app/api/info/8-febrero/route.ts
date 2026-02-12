import { NextResponse } from "next/server";
import { desc, eq, ilike } from "drizzle-orm";
import { dbInfo } from "@/db/connection-info";
import { forms, infoFeb8Status } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { isInfoAdminEmail, isInfoUserEmail } from "@/info/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = isInfoAdminEmail(user.email);
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
      sourceId: infoFeb8Status.sourceId,
      phone: infoFeb8Status.phone,
      contacted: infoFeb8Status.contacted,
      replied: infoFeb8Status.replied,
      deleted: infoFeb8Status.deleted,
      assignedToId: infoFeb8Status.assignedToId,
      assignedToName: infoFeb8Status.assignedToName,
      assignedToEmail: infoFeb8Status.assignedToEmail,
      assignedAt: infoFeb8Status.assignedAt,
      updatedAt: infoFeb8Status.updatedAt,
    })
    .from(infoFeb8Status);

  const statusBySource = statuses.reduce((acc, status) => {
    if (!status.sourceId) return acc;
    acc[status.sourceId] = status;
    return acc;
  }, {} as Record<string, (typeof statuses)[number]>);

  const mapped = records.map((record) => ({
    ...record,
    latitude: null,
    longitude: null,
  }));

  const filteredRecords = isAdmin
    ? mapped
    : mapped.filter((record) => {
        const status = statusBySource[record.sourceId];
        if (!status?.assignedToId) return true;
        return status.assignedToId === user.id;
      });

  const visibleStatusIds = new Set(filteredRecords.map((record) => record.sourceId));
  const filteredStatuses = statuses.filter((status) => visibleStatusIds.has(status.sourceId));

  return NextResponse.json({ records: filteredRecords, statuses: filteredStatuses });
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
