import { NextResponse } from "next/server";
import { dbInfo } from "@/db/connection-info";
import { infoFeb8Status } from "@/db/schema";
import { notifyInfoFeb8StatusInfo } from "@/db/realtime-info";

export const runtime = "nodejs";

type StatusPayload = {
  phone?: string;
  contacted?: boolean;
  replied?: boolean;
};

export async function PATCH(request: Request) {
  const payload = (await request.json()) as StatusPayload;
  const phone = payload.phone?.trim();
  if (!phone) {
    return NextResponse.json({ error: "Missing phone" }, { status: 400 });
  }

  const contacted = Boolean(payload.contacted);
  const replied = Boolean(payload.replied);
  const updatedAt = new Date();

  await dbInfo
    .insert(infoFeb8Status)
    .values({ phone, contacted, replied, updatedAt })
    .onConflictDoUpdate({
      target: infoFeb8Status.phone,
      set: { contacted, replied, updatedAt },
    });

  const updatedAtMs = updatedAt.getTime();
  await notifyInfoFeb8StatusInfo({ phone, contacted, replied, updatedAt: updatedAtMs });

  return NextResponse.json({ phone, contacted, replied, updatedAt: updatedAtMs });
}
