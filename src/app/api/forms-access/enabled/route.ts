import { NextResponse } from "next/server";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/connection";
import { forms, formsOperatorAccess } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select({ clientId: forms.clientId })
    .from(formsOperatorAccess)
    .innerJoin(forms, eq(forms.id, formsOperatorAccess.formId))
    .where(isNotNull(forms.clientId))
    .groupBy(forms.clientId);

  const clientIds = rows
    .map((row) => row.clientId)
    .filter((value): value is string => Boolean(value));

  return NextResponse.json({ clientIds });
}
