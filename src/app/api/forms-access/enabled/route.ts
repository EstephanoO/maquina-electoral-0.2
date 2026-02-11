import { NextResponse } from "next/server";
import { eq, isNotNull } from "drizzle-orm";
import { dbInfo } from "@/db/connection-info";
import { forms, formsOperatorAccess } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const rows = await dbInfo
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
