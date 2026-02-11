import { NextResponse } from "next/server";
import { dbInfo } from "@/db/connection-info";
import { formsOperatorStatus } from "@/db/schema";

export const runtime = "nodejs";

type StatusPayload = {
  operatorId?: string;
  formId?: string;
  contacted?: boolean;
  replied?: boolean;
  deleted?: boolean;
  homeMapsUrl?: string | null;
  pollingPlaceUrl?: string | null;
};

export async function PATCH(request: Request) {
  const payload = (await request.json()) as StatusPayload;
  const operatorId = payload.operatorId?.trim();
  const formId = payload.formId?.trim();
  if (!operatorId || !formId) {
    return NextResponse.json({ error: "Missing operator/form" }, { status: 400 });
  }

  const contacted = Boolean(payload.contacted);
  const replied = Boolean(payload.replied);
  const deleted = Boolean(payload.deleted);
  const homeMapsUrl = payload.homeMapsUrl ?? null;
  const pollingPlaceUrl = payload.pollingPlaceUrl ?? null;
  const updatedAt = new Date();

  await dbInfo
    .insert(formsOperatorStatus)
    .values({
      operatorId,
      formId,
      contacted,
      replied,
      deleted,
      homeMapsUrl,
      pollingPlaceUrl,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: [formsOperatorStatus.formId, formsOperatorStatus.operatorId],
      set: { contacted, replied, deleted, homeMapsUrl, pollingPlaceUrl, updatedAt },
    });

  return NextResponse.json({
    operatorId,
    formId,
    contacted,
    replied,
    deleted,
    homeMapsUrl,
    pollingPlaceUrl,
    updatedAt,
  });
}
