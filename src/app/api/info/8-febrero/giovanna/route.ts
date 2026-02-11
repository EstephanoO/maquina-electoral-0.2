import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { dbInfo } from "@/db/connection-info";
import { infoFeb8GiovannaRegistros, infoFeb8GiovannaStatus } from "@/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const records = await (async () => {
    try {
      return await dbInfo
        .select({
          sourceId: infoFeb8GiovannaRegistros.sourceId,
          recordedAt: infoFeb8GiovannaRegistros.recordedAt,
          interviewer: infoFeb8GiovannaRegistros.interviewer,
          candidate: infoFeb8GiovannaRegistros.candidate,
          name: infoFeb8GiovannaRegistros.name,
          phone: infoFeb8GiovannaRegistros.phone,
          east: infoFeb8GiovannaRegistros.east,
          north: infoFeb8GiovannaRegistros.north,
          latitude: infoFeb8GiovannaRegistros.latitude,
          longitude: infoFeb8GiovannaRegistros.longitude,
        })
        .from(infoFeb8GiovannaRegistros)
        .orderBy(desc(infoFeb8GiovannaRegistros.recordedAt));
    } catch (error) {
      try {
        const debug = (await dbInfo.execute(
          sql`
            select
              current_database() as db,
              current_schema() as schema,
              current_setting('search_path') as search_path,
              inet_server_addr()::text as host
          `,
        )) as { rows?: Array<Record<string, unknown>> };
        const regCheck = (await dbInfo.execute(
          sql`select to_regclass('public.info_feb8_registros_giovanna') as reg`,
        )) as { rows?: Array<Record<string, unknown>> };
        const debugRow = debug.rows?.[0] ?? {};
        const regRow = regCheck.rows?.[0] ?? {};
        console.error("info-giovanna: db lookup failed", {
          db: debugRow.db,
          schema: debugRow.schema,
          searchPath: debugRow.search_path,
          host: debugRow.host,
          reg: regRow.reg,
        });
      } catch (debugError) {
        console.error("info-giovanna: debug lookup failed", debugError);
      }
      throw error;
    }
  })();

  const statuses = await dbInfo
    .select({
      phone: infoFeb8GiovannaStatus.phone,
      contacted: infoFeb8GiovannaStatus.contacted,
      replied: infoFeb8GiovannaStatus.replied,
      deleted: infoFeb8GiovannaStatus.deleted,
      updatedAt: infoFeb8GiovannaStatus.updatedAt,
    })
    .from(infoFeb8GiovannaStatus);

  const statusMap = statuses.reduce((acc, status) => {
    acc[status.phone] = status;
    return acc;
  }, {} as Record<string, (typeof statuses)[number]>);

  const filtered = records.filter(
    (record) => record.phone && !statusMap[record.phone]?.deleted,
  );

  return NextResponse.json({ records: filtered, statuses });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const target = await dbInfo
    .select({ phone: infoFeb8GiovannaRegistros.phone })
    .from(infoFeb8GiovannaRegistros)
    .where(eq(infoFeb8GiovannaRegistros.sourceId, id))
    .limit(1);
  const phone = target[0]?.phone;
  if (!phone) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const updatedAt = new Date();
  await dbInfo
    .insert(infoFeb8GiovannaStatus)
    .values({
      phone,
      contacted: false,
      replied: false,
      deleted: true,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: infoFeb8GiovannaStatus.phone,
      set: { deleted: true, updatedAt },
    });

  return NextResponse.json({ ok: true });
}
