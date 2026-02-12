import { NextResponse } from "next/server";
import { desc, eq, ilike, sql } from "drizzle-orm";
import { dbInfo } from "@/db/connection-info";
import { forms, infoFeb8Status } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { isInfoAdminEmail, isInfoUserEmail } from "@/info/auth";

export const runtime = "nodejs";

type StatusActionRow = {
  sourceId: string | null;
  phone: string | null;
  action: string | null;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: Date | string | null;
};

type WhatsappActionRow = {
  sourceId: string | null;
  phone: string | null;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  createdAt: Date | string | null;
};

const normalizeDate = (value: Date | string | null) =>
  value ? new Date(value) : null;

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = user.role === "admin" || isInfoAdminEmail(user.email);
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

  const statusActionValues = sql.join(
    ["no_hablado", "hablado", "contestado", "eliminado"].map((action) => sql`${action}`),
    sql`, `,
  );
  const statusActionsQuery = sql`
    SELECT DISTINCT ON (source_id)
      source_id AS "sourceId",
      phone AS "phone",
      action,
      actor_id AS "actorId",
      actor_name AS "actorName",
      actor_email AS "actorEmail",
      created_at AS "createdAt"
    FROM info_feb8_action_events
    WHERE source_id IS NOT NULL AND action IN (${statusActionValues})
    ORDER BY source_id, created_at DESC
  `;
  const whatsappActionsQuery = sql`
    SELECT DISTINCT ON (source_id)
      source_id AS "sourceId",
      phone AS "phone",
      actor_id AS "actorId",
      actor_name AS "actorName",
      actor_email AS "actorEmail",
      created_at AS "createdAt"
    FROM info_feb8_action_events
    WHERE source_id IS NOT NULL AND action = 'whatsapp'
    ORDER BY source_id, created_at DESC
  `;
  const statusActions = await dbInfo.execute(statusActionsQuery);
  const whatsappActions = await dbInfo.execute(whatsappActionsQuery);
  const statusActionRows = statusActions.rows as StatusActionRow[];
  const whatsappActionRows = whatsappActions.rows as WhatsappActionRow[];

  const statusBySource = statuses.reduce((acc, status) => {
    if (!status.sourceId) return acc;
    acc[status.sourceId] = status;
    return acc;
  }, {} as Record<string, (typeof statuses)[number]>);

  const statusActionBySource = statusActionRows.reduce((acc, row) => {
    if (!row.sourceId) return acc;
    acc[row.sourceId] = row;
    return acc;
  }, {} as Record<string, StatusActionRow>);

  const whatsappBySource = whatsappActionRows.reduce((acc, row) => {
    if (!row.sourceId) return acc;
    acc[row.sourceId] = row;
    return acc;
  }, {} as Record<string, WhatsappActionRow>);

  const mergedStatusBySource = { ...statusBySource };

  Object.entries(statusActionBySource).forEach(([sourceId, row]) => {
    const existing = mergedStatusBySource[sourceId];
    const whatsapp = whatsappBySource[sourceId];
    if (!existing) {
      const action = String(row.action ?? "").toLowerCase();
      const derivedUpdatedAt = normalizeDate(row.createdAt ?? null) ?? new Date();
      mergedStatusBySource[sourceId] = {
        sourceId,
        phone: row.phone ?? null,
        contacted: action === "hablado" || action === "contestado",
        replied: action === "contestado",
        deleted: action === "eliminado",
        assignedToId: whatsapp?.actorId ?? null,
        assignedToName: whatsapp?.actorName ?? null,
        assignedToEmail: whatsapp?.actorEmail ?? null,
        assignedAt: normalizeDate(whatsapp?.createdAt ?? null),
        updatedAt: derivedUpdatedAt,
      };
      return;
    }

    if (!existing.assignedToId && whatsapp) {
      mergedStatusBySource[sourceId] = {
        ...existing,
        assignedToId: whatsapp.actorId ?? existing.assignedToId,
        assignedToName: whatsapp.actorName ?? existing.assignedToName,
        assignedToEmail: whatsapp.actorEmail ?? existing.assignedToEmail,
        assignedAt: normalizeDate(whatsapp.createdAt ?? null) ?? existing.assignedAt,
      };
    }
  });

  const mapped = records.map((record) => ({
    ...record,
    latitude: null,
    longitude: null,
  }));

  const filteredRecords = isAdmin
    ? mapped
    : mapped.filter((record) => {
        const status = mergedStatusBySource[record.sourceId];
        if (!status?.assignedToId) return true;
        return status.assignedToId === user.id;
      });

  const visibleStatusIds = new Set(filteredRecords.map((record) => record.sourceId));
  const filteredStatuses = Object.values(mergedStatusBySource).filter((status) =>
    visibleStatusIds.has(status.sourceId),
  );

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
