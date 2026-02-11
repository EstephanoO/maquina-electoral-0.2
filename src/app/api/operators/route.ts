import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { dbInfo } from "@/db/connection-info";
import { operators } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const includeInactive = url.searchParams.get("includeInactive") === "1";
  const query = dbInfo
    .select({
      id: operators.id,
      name: operators.name,
      slug: operators.slug,
      active: operators.active,
    })
    .from(operators)
    .orderBy(asc(operators.name));

  const rows = includeInactive ? await query : await query.where(eq(operators.active, true));

  return NextResponse.json({ operators: rows });
}
