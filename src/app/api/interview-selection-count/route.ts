import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/connection";
import {
  CESAR_VASQUEZ_DISTRICT_COUNTS,
  CESAR_VASQUEZ_TOTAL,
} from "@/db/constants/cesar-vasquez-mock";

const clientToCandidate: Record<string, string> = {
  rocio: "Rocio Porras",
  giovanna: "Giovanna Castagnino",
  guillermo: "Guillermo Aliaga",
};

const cacheHeaders = {
  "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
};

const normalizeCode = (value: string | null, length: number) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;
  return digits.padStart(length, "0");
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
  const level = url.searchParams.get("level");
  const depCode = normalizeCode(url.searchParams.get("dep"), 2);
  const provCode = normalizeCode(url.searchParams.get("prov"), 2);
  const distCode = normalizeCode(url.searchParams.get("dist"), 6);
  const resolvedCandidate =
    (clientParam ? clientToCandidate[clientParam] : null) ?? candidateParam;

  if (clientParam === "cesar-vasquez") {
    if (level === "departamento" && depCode === "15") {
      return NextResponse.json({ count: CESAR_VASQUEZ_TOTAL }, { status: 200, headers: cacheHeaders });
    }
    if (level === "distrito" && distCode) {
      const count = CESAR_VASQUEZ_DISTRICT_COUNTS[distCode] ?? 0;
      return NextResponse.json({ count }, { status: 200, headers: cacheHeaders });
    }
    return NextResponse.json({ count: 0 }, { status: 200, headers: cacheHeaders });
  }

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
    ${pointGeometry} IS NOT NULL
    AND ST_Intersects(geom.geom3857, ST_Transform(${pointGeometry}, 3857))
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
