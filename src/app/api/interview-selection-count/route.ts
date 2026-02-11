import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/connection";

const clientToCandidate: Record<string, string> = {
  rocio: "Rocio Porras",
  giovanna: "Giovanna Castagnino",
  guillermo: "Guillermo Aliaga",
};

const cacheHeaders = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const candidateParam = url.searchParams.get("candidate");
  const clientParam = url.searchParams.get("client");
  const level = url.searchParams.get("level");
  const depCode = url.searchParams.get("dep");
  const provCode = url.searchParams.get("prov");
  const distCode = url.searchParams.get("dist");
  const resolvedCandidate =
    (clientParam ? clientToCandidate[clientParam] : null) ?? candidateParam;

  if (!level || !["departamento", "provincia", "distrito"].includes(level)) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  if (level === "departamento" && !depCode) {
    return NextResponse.json({ count: 0 }, { status: 200, headers: cacheHeaders });
  }
  if (level === "provincia" && (!depCode || !provCode)) {
    return NextResponse.json({ count: 0 }, { status: 200, headers: cacheHeaders });
  }
  if (level === "distrito" && !distCode) {
    return NextResponse.json({ count: 0 }, { status: 200, headers: cacheHeaders });
  }

  const candidateFilter = resolvedCandidate
    ? sql`AND t.candidate = ${resolvedCandidate}`
    : sql``;

  const pointIntersect = sql`
    t.latitude IS NOT NULL
    AND t.longitude IS NOT NULL
    AND ST_Intersects(
      geom.geom3857,
      ST_Transform(ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326), 3857)
    )
  `;

  if (level === "departamento") {
    const query = sql`
      SELECT count(t.id)::int AS count
      FROM public.peru_departamentos geom
      LEFT JOIN public.territory t
        ON ${pointIntersect}
       ${candidateFilter}
      WHERE geom.coddep = ${depCode}
    `;
    const { rows } = await db.execute(query);
    const count = Number((rows[0] as { count?: number | null })?.count ?? 0);
    return NextResponse.json({ count }, { status: 200, headers: cacheHeaders });
  }

  if (level === "provincia") {
    const query = sql`
      SELECT count(t.id)::int AS count
      FROM public.peru_provincias geom
      LEFT JOIN public.territory t
        ON ${pointIntersect}
       ${candidateFilter}
      WHERE geom.coddep = ${depCode}
        AND geom.codprov = ${provCode}
    `;
    const { rows } = await db.execute(query);
    const count = Number((rows[0] as { count?: number | null })?.count ?? 0);
    return NextResponse.json({ count }, { status: 200, headers: cacheHeaders });
  }

  const query = sql`
    SELECT count(t.id)::int AS count
    FROM public.peru_distritos geom
    LEFT JOIN public.territory t
      ON ${pointIntersect}
     ${candidateFilter}
    WHERE geom.ubigeo = ${distCode}
  `;
  const { rows } = await db.execute(query);
  const count = Number((rows[0] as { count?: number | null })?.count ?? 0);
  return NextResponse.json({ count }, { status: 200, headers: cacheHeaders });
}
