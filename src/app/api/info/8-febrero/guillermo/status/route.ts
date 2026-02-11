import { NextResponse } from "next/server";
import { dbInfo } from "@/db/connection-info";
import { infoFeb8GuillermoStatus } from "@/db/schema";

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
    .insert(infoFeb8GuillermoStatus)
    .values({ phone, contacted, replied, updatedAt })
    .onConflictDoUpdate({
      target: infoFeb8GuillermoStatus.phone,
      set: { contacted, replied, updatedAt },
    });

  const updatedAtMs = updatedAt.getTime();
  return NextResponse.json({ phone, contacted, replied, updatedAt: updatedAtMs });
}
