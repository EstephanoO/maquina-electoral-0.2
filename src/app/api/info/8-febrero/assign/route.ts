import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { dbInfo } from "@/db/connection-info";
import { infoFeb8Status } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { isInfoAdminEmail, isInfoUserEmail } from "@/info/auth";
import { notifyInfoFeb8StatusInfo } from "@/db/realtime-info";

export const runtime = "nodejs";

type AssignPayload = {
  sourceId?: string;
  phone?: string | null;
};

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const isAdmin = user.role === "admin" || isInfoAdminEmail(user.email);
  const payload = (await request.json()) as AssignPayload;
  const sourceId = payload.sourceId?.trim();
  if (!sourceId) {
    return NextResponse.json({ error: "Missing sourceId" }, { status: 400 });
  }

  const existing = await dbInfo
    .select({
      sourceId: infoFeb8Status.sourceId,
      phone: infoFeb8Status.phone,
      assignedToId: infoFeb8Status.assignedToId,
      assignedToName: infoFeb8Status.assignedToName,
      assignedToEmail: infoFeb8Status.assignedToEmail,
      assignedAt: infoFeb8Status.assignedAt,
    })
    .from(infoFeb8Status)
    .where(eq(infoFeb8Status.sourceId, sourceId))
    .limit(1);

  const current = existing[0];
  if (!isAdmin && current?.assignedToId && current.assignedToId !== user.id) {
    return NextResponse.json(
      {
        error: "Locked",
        assignedToName: current.assignedToName,
        assignedToEmail: current.assignedToEmail,
      },
      { status: 409 },
    );
  }

  const assignedAt = current?.assignedAt ?? new Date();
  const updatedAt = new Date();
  const phone = payload.phone?.trim() || current?.phone || null;

  await dbInfo
    .insert(infoFeb8Status)
    .values({
      sourceId,
      phone,
      assignedToId: user.id,
      assignedToName: user.name,
      assignedToEmail: user.email,
      assignedAt,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: infoFeb8Status.sourceId,
      set: {
        phone,
        assignedToId: user.id,
        assignedToName: user.name,
        assignedToEmail: user.email,
        assignedAt,
        updatedAt,
      },
    });

  const assignedAtMs = assignedAt instanceof Date ? assignedAt.getTime() : Date.now();
  await notifyInfoFeb8StatusInfo({
    type: "assignment",
    sourceId,
    phone,
    assignedToId: user.id,
    assignedToName: user.name,
    assignedToEmail: user.email,
    assignedAt: assignedAtMs,
    updatedAt: updatedAt.getTime(),
  });

  return NextResponse.json({
    sourceId,
    phone,
    assignedToId: user.id,
    assignedToName: user.name,
    assignedToEmail: user.email,
    assignedAt: assignedAtMs,
  });
}
