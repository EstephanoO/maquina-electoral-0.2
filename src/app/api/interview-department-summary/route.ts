import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/connection";

const clientToCandidate: Record<string, string> = {
  rocio: "Rocio Porras",
  giovanna: "Giovanna Castagnino",
  guillermo: "Guillermo Aliaga",
};

const cacheHeaders = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

const pointGeometry = sql`
  CASE
    WHEN t.latitude IS NOT NULL AND t.longitude IS NOT NULL
      THEN ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326)
    WHEN (t.address_location->>'longitude') IS NOT NULL
      AND (t.address_location->>'latitude') IS NOT NULL
      THEN ST_SetSRID(
        ST_MakePoint(
          (t.address_location->>'longitude')::double precision,
          (t.address_location->>'latitude')::double precision
        ),
        4326
      )
    WHEN (t.location->>'easting') IS NOT NULL
      AND (t.location->>'northing') IS NOT NULL
      AND (t.location->>'datumEpsg') IN ('32618', '32718', '4326')
      THEN ST_Transform(
        ST_SetSRID(
          ST_MakePoint(
            (t.location->>'easting')::double precision,
            (t.location->>'northing')::double precision
          ),
          (t.location->>'datumEpsg')::int
        ),
        4326
      )
    ELSE NULL
  END
`;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const candidateParam = url.searchParams.get("candidate");
  const clientParam = url.searchParams.get("client");
  const resolvedCandidate =
    (clientParam ? clientToCandidate[clientParam] : null) ?? candidateParam;

  const query = resolvedCandidate
    ? sql`
      SELECT
        d.coddep AS code,
        upper(d.nomdep) AS name,
        count(t.id)::int AS count
      FROM public.peru_departamentos d
      LEFT JOIN public.territory t
        ON ${pointGeometry} IS NOT NULL
       AND t.candidate = ${resolvedCandidate}
       AND ST_Intersects(d.geom3857, ST_Transform(${pointGeometry}, 3857))
      GROUP BY d.coddep, d.nomdep
    `
    : sql`
      SELECT
        d.coddep AS code,
        upper(d.nomdep) AS name,
        count(t.id)::int AS count
      FROM public.peru_departamentos d
      LEFT JOIN public.territory t
        ON ${pointGeometry} IS NOT NULL
       AND ST_Intersects(d.geom3857, ST_Transform(${pointGeometry}, 3857))
      GROUP BY d.coddep, d.nomdep
    `;

  const { rows } = await db.execute(query);
  const departments = rows.map((row) => {
    const item = row as { code?: string | null; name?: string | null; count?: number | null };
    return {
      code: item.code ?? "",
      name: item.name ?? "",
      count: typeof item.count === "number" ? item.count : Number(item.count ?? 0),
    };
  });
  const total = departments.reduce((acc, item) => acc + item.count, 0);

  return NextResponse.json({ total, departments }, { status: 200, headers: cacheHeaders });
}
