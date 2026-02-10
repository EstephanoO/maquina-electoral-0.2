import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/connection";
import { forms, territory } from "@/db/schema";

export const runtime = "nodejs";

const parseZona = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim().toUpperCase();
  const match = trimmed.match(/^(\d{1,2})([NS])$/);
  if (!match) return null;
  return {
    zone: Number(match[1]),
    hemisphere: match[2] as "N" | "S",
  };
};

const toRadians = (value: number) => (value * Math.PI) / 180;
const toDegrees = (value: number) => (value * 180) / Math.PI;

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
  if (input.hemisphere === "S") {
    y -= 10000000;
  }

  const m = y / k0;
  const mu =
    m /
    (a *
      (1 - Math.pow(e, 2) / 4 - (3 * Math.pow(e, 4)) / 64 - (5 * Math.pow(e, 6)) / 256));

  const e1 = (1 - Math.sqrt(1 - Math.pow(e, 2))) / (1 + Math.sqrt(1 - Math.pow(e, 2)));
  const j1 = (3 * e1) / 2 - (27 * Math.pow(e1, 3)) / 32;
  const j2 = (21 * Math.pow(e1, 2)) / 16 - (55 * Math.pow(e1, 4)) / 32;
  const j3 = (151 * Math.pow(e1, 3)) / 96;
  const j4 = (1097 * Math.pow(e1, 4)) / 512;

  const fp =
    mu +
    j1 * Math.sin(2 * mu) +
    j2 * Math.sin(4 * mu) +
    j3 * Math.sin(6 * mu) +
    j4 * Math.sin(8 * mu);

  const sinFp = Math.sin(fp);
  const cosFp = Math.cos(fp);
  const tanFp = Math.tan(fp);

  const c1 = e1sq * Math.pow(cosFp, 2);
  const t1 = Math.pow(tanFp, 2);
  const r1 = (a * (1 - Math.pow(e, 2))) / Math.pow(1 - Math.pow(e, 2) * Math.pow(sinFp, 2), 1.5);
  const n1 = a / Math.sqrt(1 - Math.pow(e, 2) * Math.pow(sinFp, 2));
  const d = x / (n1 * k0);

  const q1 = (n1 * tanFp) / r1;
  const q2 = Math.pow(d, 2) / 2;
  const q3 = (5 + 3 * t1 + 10 * c1 - 4 * Math.pow(c1, 2) - 9 * e1sq) * Math.pow(d, 4) / 24;
  const q4 =
    (61 +
      90 * t1 +
      298 * c1 +
      45 * Math.pow(t1, 2) -
      252 * e1sq -
      3 * Math.pow(c1, 2)) *
    Math.pow(d, 6) /
    720;

  const lat = fp - q1 * (q2 - q3 + q4);

  const q5 = d;
  const q6 = (1 + 2 * t1 + c1) * Math.pow(d, 3) / 6;
  const q7 =
    (5 - 2 * c1 + 28 * t1 - 3 * Math.pow(c1, 2) + 8 * e1sq + 24 * Math.pow(t1, 2)) *
    Math.pow(d, 5) /
    120;
  const lonOrigin = (input.zone - 1) * 6 - 180 + 3;
  const lon = toRadians(lonOrigin) + (q5 - q6 + q7) / cosFp;

  return {
    latitude: Number(toDegrees(lat).toFixed(6)),
    longitude: Number(toDegrees(lon).toFixed(6)),
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientParam = url.searchParams.get("client");
  const candidateParam = url.searchParams.get("candidate");

  const conditions = [] as Array<ReturnType<typeof eq>>;
  if (clientParam) conditions.push(eq(forms.clientId, clientParam));
  if (candidateParam) conditions.push(eq(forms.candidate, candidateParam));

  const query = db
    .select({
      id: forms.id,
      clientId: forms.clientId,
      name: forms.nombre,
      phone: forms.telefono,
      candidate: forms.candidate,
      interviewer: forms.encuestador,
      createdAt: forms.fecha,
      x: forms.x,
      y: forms.y,
      zona: forms.zona,
      latitude: territory.latitude,
      longitude: territory.longitude,
      location: territory.location,
    })
    .from(forms)
    .leftJoin(territory, eq(territory.id, forms.clientId));

  const rows = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

  const points = rows
    .map((row) => {
      const lat = row.latitude ?? null;
      const lng = row.longitude ?? null;
      if (lat !== null && lng !== null) {
        return {
          id: row.id,
          clientId: row.clientId,
          name: row.name,
          phone: row.phone,
          candidate: row.candidate,
          interviewer: row.interviewer,
          createdAt: row.createdAt,
          latitude: lat,
          longitude: lng,
        };
      }

      const location = (row.location as
        | { zone?: number; hemisphere?: "N" | "S"; easting?: number; northing?: number }
        | null) ?? null;
      if (location?.zone && location?.hemisphere && location?.easting && location?.northing) {
        const derived = utmToLatLng({
          zone: Number(location.zone),
          hemisphere: location.hemisphere,
          easting: Number(location.easting),
          northing: Number(location.northing),
        });
        return {
          id: row.id,
          clientId: row.clientId,
          name: row.name,
          phone: row.phone,
          candidate: row.candidate,
          interviewer: row.interviewer,
          createdAt: row.createdAt,
          latitude: derived.latitude,
          longitude: derived.longitude,
        };
      }

      const zona = parseZona(row.zona);
      if (zona && row.x !== null && row.y !== null) {
        const derived = utmToLatLng({
          zone: zona.zone,
          hemisphere: zona.hemisphere,
          easting: row.x,
          northing: row.y,
        });
        return {
          id: row.id,
          clientId: row.clientId,
          name: row.name,
          phone: row.phone,
          candidate: row.candidate,
          interviewer: row.interviewer,
          createdAt: row.createdAt,
          latitude: derived.latitude,
          longitude: derived.longitude,
        };
      }

      return null;
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));

  return NextResponse.json({ points });
}
