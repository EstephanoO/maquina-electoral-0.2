import { NextResponse } from "next/server";
import { dbInfo } from "@/db/connection-info";
import { infoFeb8Registros, infoFeb8Status } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyInfoFeb8StatusInfo } from "@/db/realtime-info";
import { getSessionUser } from "@/lib/auth/session";
import { isInfoAdminEmail, isInfoUserEmail } from "@/info/auth";

export const runtime = "nodejs";

type StatusPayload = {
  sourceId?: string;
  phone?: string;
  contacted?: boolean;
  replied?: boolean;
  deleted?: boolean;
  homeMapsUrl?: string | null;
  pollingPlaceUrl?: string | null;
  linksComment?: string | null;
};

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = user.role === "admin" || isInfoAdminEmail(user.email);
  const payload = (await request.json()) as StatusPayload;
  const sourceId = payload.sourceId?.trim();
  if (!sourceId) {
    return NextResponse.json({ error: "Missing sourceId" }, { status: 400 });
  }
  const homeMapsUrl = payload.homeMapsUrl?.trim() || null;
  const pollingPlaceUrl = payload.pollingPlaceUrl?.trim() || null;
  const linksComment = payload.linksComment?.trim() || null;
  const hasLinksUpdate =
    payload.homeMapsUrl !== undefined ||
    payload.pollingPlaceUrl !== undefined ||
    payload.linksComment !== undefined;
  const hasStatusUpdate =
    payload.contacted !== undefined ||
    payload.replied !== undefined ||
    payload.deleted !== undefined;

  const currentStatus = await dbInfo
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
    .from(infoFeb8Status)
    .where(eq(infoFeb8Status.sourceId, sourceId))
    .limit(1);

  const statusRow = currentStatus[0];
  const phone = payload.phone?.trim() || statusRow?.phone || null;

  if (!isAdmin) {
    if (!statusRow?.assignedToId) {
      return NextResponse.json({ error: "Record is not assigned" }, { status: 409 });
    }
    if (statusRow.assignedToId !== user.id) {
      return NextResponse.json({ error: "Locked by another operator" }, { status: 409 });
    }
  }

  if (hasLinksUpdate) {
    await dbInfo
      .update(infoFeb8Registros)
      .set({ homeMapsUrl, pollingPlaceUrl, linksComment })
      .where(eq(infoFeb8Registros.sourceId, sourceId));
    return NextResponse.json({ sourceId, homeMapsUrl, pollingPlaceUrl, linksComment });
  }

  if (!hasStatusUpdate) {
    return NextResponse.json({ error: "No status update" }, { status: 400 });
  }

  const contacted = Boolean(payload.contacted ?? statusRow?.contacted);
  const replied = Boolean(payload.replied ?? statusRow?.replied);
  const deleted = Boolean(payload.deleted ?? statusRow?.deleted);
  if (replied && !contacted) {
    return NextResponse.json({ error: "Cannot reply before contacted" }, { status: 400 });
  }
  const updatedAt = new Date();

  const statusValues = {
    sourceId,
    phone,
    contacted,
    replied,
    deleted,
    assignedToId: statusRow?.assignedToId ?? null,
    assignedToName: statusRow?.assignedToName ?? null,
    assignedToEmail: statusRow?.assignedToEmail ?? null,
    assignedAt: statusRow?.assignedAt ?? null,
    updatedAt,
  };

  await dbInfo
    .insert(infoFeb8Status)
    .values(statusValues)
    .onConflictDoUpdate({
      target: infoFeb8Status.sourceId,
      set: { contacted, replied, deleted, updatedAt },
    });

  const updatedAtMs = updatedAt.getTime();
  await notifyInfoFeb8StatusInfo({
    type: "status",
    sourceId,
    phone: statusRow?.phone ?? null,
    contacted,
    replied,
    deleted,
    assignedToId: statusRow?.assignedToId ?? null,
    assignedToName: statusRow?.assignedToName ?? null,
    assignedToEmail: statusRow?.assignedToEmail ?? null,
    updatedAt: updatedAtMs,
  });

  return NextResponse.json({ sourceId, contacted, replied, deleted, updatedAt: updatedAtMs });
}
