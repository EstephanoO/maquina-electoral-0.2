import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { cesarVasquezRegistros, territory } from "@/db/schema";

// ── UTM → LatLng (WGS-84) ──────────────────────────────────────────
const toRadians = (v: number) => (v * Math.PI) / 180;
const toDegrees = (v: number) => (v * 180) / Math.PI;

const utmToLatLng = (input: {
  zone: number;
  hemisphere: "N" | "S";
  easting: number;
  northing: number;
}) => {
  const a = 6378137;
  const e = 0.08181919084262149;
  const e1sq = 0.006739496742276434;
  const k0 = 0.9996;

  const x = input.easting - 500000;
  let y = input.northing;
  if (input.hemisphere === "S") y -= 10000000;

  const m = y / k0;
  const mu =
    m / (a * (1 - e ** 2 / 4 - (3 * e ** 4) / 64 - (5 * e ** 6) / 256));

  const e1 = (1 - Math.sqrt(1 - e ** 2)) / (1 + Math.sqrt(1 - e ** 2));
  const j1 = (3 * e1) / 2 - (27 * e1 ** 3) / 32;
  const j2 = (21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32;
  const j3 = (151 * e1 ** 3) / 96;
  const j4 = (1097 * e1 ** 4) / 512;

  const fp =
    mu +
    j1 * Math.sin(2 * mu) +
    j2 * Math.sin(4 * mu) +
    j3 * Math.sin(6 * mu) +
    j4 * Math.sin(8 * mu);

  const sinFp = Math.sin(fp);
  const cosFp = Math.cos(fp);
  const tanFp = Math.tan(fp);

  const c1 = e1sq * cosFp ** 2;
  const t1 = tanFp ** 2;
  const r1 = (a * (1 - e ** 2)) / (1 - e ** 2 * sinFp ** 2) ** 1.5;
  const n1 = a / Math.sqrt(1 - e ** 2 * sinFp ** 2);
  const d = x / (n1 * k0);

  const q1 = (n1 * tanFp) / r1;
  const q2 = d ** 2 / 2;
  const q3 =
    ((5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * e1sq) * d ** 4) / 24;
  const q4 =
    ((61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * e1sq - 3 * c1 ** 2) *
      d ** 6) /
    720;

  const lat = fp - q1 * (q2 - q3 + q4);

  const q5 = d;
  const q6 = ((1 + 2 * t1 + c1) * d ** 3) / 6;
  const q7 =
    ((5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * e1sq + 24 * t1 ** 2) *
      d ** 5) /
    120;
  const lonOrigin = (input.zone - 1) * 6 - 180 + 3;
  const lon = toRadians(lonOrigin) + (q5 - q6 + q7) / cosFp;

  return {
    latitude: Number(toDegrees(lat).toFixed(6)),
    longitude: Number(toDegrees(lon).toFixed(6)),
  };
};

// ── Types ───────────────────────────────────────────────────────────
type FormPayload = {
  nombre_entrevistado: string;
  telefono?: string;
  comentario?: string;
  ubicacion_utm?: {
    zone: number;
    hemisphere: "N" | "S";
    easting: number;
    northing: number;
    datum_epsg: number;
  } | null;
  candidato?: string;
  agente?: string;
  fecha?: string;
};

// ── CORS headers (mobile app) ───────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// ── POST: crear registro ────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FormPayload;

    if (!body.nombre_entrevistado?.trim()) {
      return NextResponse.json(
        { error: "nombre_entrevistado es requerido" },
        { status: 400, headers: corsHeaders },
      );
    }

    const id = crypto.randomUUID();
    const utm = body.ubicacion_utm ?? null;

    // Derive lat/lng from UTM if possible
    let latitude: number | null = null;
    let longitude: number | null = null;

    if (utm) {
      const utmValid =
        Number.isFinite(utm.zone) &&
        Number.isFinite(utm.easting) &&
        Number.isFinite(utm.northing) &&
        (utm.hemisphere === "N" || utm.hemisphere === "S");

      if (utmValid) {
        const coords = utmToLatLng({
          zone: utm.zone,
          hemisphere: utm.hemisphere,
          easting: utm.easting,
          northing: utm.northing,
        });
        latitude = coords.latitude;
        longitude = coords.longitude;
      }
    }

    const fechaValue = body.fecha ? new Date(body.fecha) : new Date();
    const resolvedFecha =
      !Number.isNaN(fechaValue.getTime()) ? fechaValue : new Date();

    // 1. Insert into cesar_vasquez_registros (tabla propia)
    await db.insert(cesarVasquezRegistros).values({
      id,
      nombreEntrevistado: body.nombre_entrevistado.trim(),
      telefono: body.telefono?.trim() ?? "",
      zona: "",
      comentario: body.comentario?.trim() ?? "",
      candidato: body.candidato?.trim() ?? "Cesar Vasquez",
      agente: body.agente?.trim() ?? "",
      ubicacionUtm: utm,
      latitude,
      longitude,
      fecha: resolvedFecha,
    });

    // 2. Mirror into territory (para que el mapa existente lo consuma)
    await db
      .insert(territory)
      .values({
        id,
        interviewer: body.agente?.trim() ?? null,
        candidate: "Cesar Vasquez",
        name: body.nombre_entrevistado.trim(),
        phone: body.telefono?.trim() ?? null,
        address: body.comentario?.trim() ?? null,
        location: utm
          ? {
              zone: utm.zone,
              hemisphere: utm.hemisphere,
              easting: utm.easting,
              northing: utm.northing,
              datumEpsg: String(utm.datum_epsg ?? 32718),
            }
          : null,
        latitude,
        longitude,
        east: utm?.easting ?? null,
        north: utm?.northing ?? null,
        srid: 4326,
        createdAt: resolvedFecha,
      })
      .onConflictDoNothing();

    return NextResponse.json(
      { id },
      { status: 201, headers: corsHeaders },
    );
  } catch (err) {
    console.error("[cesar-vasquez/registros] POST error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: corsHeaders },
    );
  }
}

// ── GET: listar registros ───────────────────────────────────────────
export async function GET() {
  try {
    const rows = await db
      .select({
        id: cesarVasquezRegistros.id,
        nombre_entrevistado: cesarVasquezRegistros.nombreEntrevistado,
        telefono: cesarVasquezRegistros.telefono,
        comentario: cesarVasquezRegistros.comentario,
        ubicacion_utm: cesarVasquezRegistros.ubicacionUtm,
        candidato: cesarVasquezRegistros.candidato,
        agente: cesarVasquezRegistros.agente,
        latitude: cesarVasquezRegistros.latitude,
        longitude: cesarVasquezRegistros.longitude,
        fecha: cesarVasquezRegistros.fecha,
      })
      .from(cesarVasquezRegistros)
      .orderBy(desc(cesarVasquezRegistros.fecha));

    return NextResponse.json(rows, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("[cesar-vasquez/registros] GET error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: corsHeaders },
    );
  }
}

// ── DELETE: eliminar registro ───────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id es requerido (?id=xxx)" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Eliminar de ambas tablas (misma PK)
    await db.delete(cesarVasquezRegistros).where(eq(cesarVasquezRegistros.id, id));
    await db.delete(territory).where(eq(territory.id, id));

    return NextResponse.json({ ok: true }, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("[cesar-vasquez/registros] DELETE error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: corsHeaders },
    );
  }
}
