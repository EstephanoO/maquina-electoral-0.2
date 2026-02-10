import { NextResponse } from "next/server";
import { db } from "@/db/connection";
import { formsOperatorStatus } from "@/db/schema";

export const runtime = "nodejs";

type StatusPayload = {
  operatorId?: string;
  formId?: string;
  contacted?: boolean;
  replied?: boolean;
  deleted?: boolean;
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
  const updatedAt = new Date();

  await db
    .insert(formsOperatorStatus)
    .values({ operatorId, formId, contacted, replied, deleted, updatedAt })
    .onConflictDoUpdate({
      target: [formsOperatorStatus.formId, formsOperatorStatus.operatorId],
      set: { contacted, replied, deleted, updatedAt },
    });

  return NextResponse.json({ operatorId, formId, contacted, replied, deleted, updatedAt });
}
