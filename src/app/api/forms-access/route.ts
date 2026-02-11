import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { dbInfo } from "@/db/connection-info";
import { forms, formsOperatorAccess, formsOperatorStatus, operators } from "@/db/schema";

export const runtime = "nodejs";

type AccessPayload = {
  operatorIds?: string[];
  operatorSlug?: string;
  formIds?: string[];
  clientIds?: string[];
  enabledBy?: string | null;
};

const resolveOperatorIds = async (payload: AccessPayload) => {
  if (payload.operatorIds?.length) return payload.operatorIds;
  if (payload.operatorSlug) {
    const row = await dbInfo
      .select({ id: operators.id })
      .from(operators)
      .where(eq(operators.slug, payload.operatorSlug))
      .limit(1);
    return row[0]?.id ? [row[0].id] : [];
  }
  return [];
};

const resolveFormIds = async (payload: AccessPayload) => {
  if (payload.formIds?.length) return payload.formIds;
  if (payload.clientIds?.length) {
    const rows = await dbInfo
      .select({ id: forms.id })
      .from(forms)
      .where(inArray(forms.clientId, payload.clientIds));
    return rows.map((row) => row.id);
  }
  return [];
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const operatorId = url.searchParams.get("operatorId");
  const operatorSlug = url.searchParams.get("operatorSlug");
  let resolvedOperatorId = operatorId;

  if (!resolvedOperatorId && operatorSlug) {
    const row = await dbInfo
      .select({ id: operators.id })
      .from(operators)
      .where(eq(operators.slug, operatorSlug))
      .limit(1);
    resolvedOperatorId = row[0]?.id ?? null;
  }

  if (!resolvedOperatorId) {
    return NextResponse.json({ error: "Missing operator" }, { status: 400 });
  }

  const accessRows = await dbInfo
    .select({
      formId: formsOperatorAccess.formId,
      enabledAt: formsOperatorAccess.enabledAt,
      enabledBy: formsOperatorAccess.enabledBy,
      name: forms.nombre,
      phone: forms.telefono,
      candidate: forms.candidate,
      interviewer: forms.encuestador,
      createdAt: forms.fecha,
      clientId: forms.clientId,
    })
    .from(formsOperatorAccess)
    .innerJoin(forms, eq(forms.id, formsOperatorAccess.formId))
    .where(eq(formsOperatorAccess.operatorId, resolvedOperatorId));

  const statusRows = await dbInfo
    .select({
      formId: formsOperatorStatus.formId,
      operatorId: formsOperatorStatus.operatorId,
      contacted: formsOperatorStatus.contacted,
      replied: formsOperatorStatus.replied,
      deleted: formsOperatorStatus.deleted,
      updatedAt: formsOperatorStatus.updatedAt,
    })
    .from(formsOperatorStatus)
    .where(eq(formsOperatorStatus.operatorId, resolvedOperatorId));

  return NextResponse.json({ records: accessRows, statuses: statusRows });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AccessPayload;
  const operatorIds = await resolveOperatorIds(payload);
  if (!operatorIds.length) {
    return NextResponse.json({ error: "Missing operator" }, { status: 400 });
  }

  const formIds = await resolveFormIds(payload);
  if (!formIds.length) {
    return NextResponse.json({ error: "Missing forms" }, { status: 400 });
  }

  const enabledBy = payload.enabledBy ?? null;
  const enabledAt = new Date();
  const values = operatorIds.flatMap((operatorId) =>
    formIds.map((formId) => ({ formId, operatorId, enabledAt, enabledBy })),
  );

  await dbInfo.insert(formsOperatorAccess).values(values).onConflictDoNothing();

  return NextResponse.json({ ok: true, operatorIds, formIds });
}

export async function DELETE(request: Request) {
  const payload = (await request.json()) as AccessPayload;
  const operatorIds = await resolveOperatorIds(payload);
  const formIds = await resolveFormIds(payload);
  if (!operatorIds.length || !formIds.length) {
    return NextResponse.json({ error: "Missing operator/forms" }, { status: 400 });
  }

  await dbInfo
    .delete(formsOperatorAccess)
    .where(
      and(
        inArray(formsOperatorAccess.operatorId, operatorIds),
        inArray(formsOperatorAccess.formId, formIds),
      ),
    );

  return NextResponse.json({ ok: true });
}
