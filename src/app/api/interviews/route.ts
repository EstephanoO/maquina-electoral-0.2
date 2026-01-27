import { NextResponse } from "next/server";
import { and, isNotNull } from "drizzle-orm";
import { db } from "@/db/connection";
import { territory } from "@/db/schema";

type InterviewPayload = {
  id: string;
  interviewer: string;
  candidate: string;
  signature: string;
  name: string;
  phone: string;
  location:
    | string
    | {
        zone: number;
        hemisphere: "N" | "S";
        easting: number;
        northing: number;
        datumEpsg: string;
      };
  createdAt: string;
  latitude?: number;
  longitude?: number;
};

const requiredKeys: Array<keyof InterviewPayload> = [
  "id",
  "interviewer",
  "candidate",
  "signature",
  "name",
  "phone",
  "location",
  "createdAt",
];

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
  const mu = m / (a * (1 - Math.pow(e, 2) / 4 - (3 * Math.pow(e, 4)) / 64 - (5 * Math.pow(e, 6)) / 256));

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
  const q2 = (Math.pow(d, 2) / 2);
  const q3 = (5 + 3 * t1 + 10 * c1 - 4 * Math.pow(c1, 2) - 9 * e1sq) * Math.pow(d, 4) / 24;
  const q4 =
    (61 + 90 * t1 + 298 * c1 + 45 * Math.pow(t1, 2) - 252 * e1sq - 3 * Math.pow(c1, 2)) *
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

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<InterviewPayload>;
  const missing = requiredKeys.filter((key) => !body[key]);

  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: "Missing fields", fields: missing },
      { status: 400 },
    );
  }

  const locationValue =
    typeof body.location === "string" ? body.location : JSON.stringify(body.location);
  const utmPayload =
    body.location && typeof body.location !== "string"
      ? {
          zone: Number(body.location.zone),
          hemisphere: body.location.hemisphere,
          easting: Number(body.location.easting),
          northing: Number(body.location.northing),
          datumEpsg: body.location.datumEpsg,
        }
      : null;
  const utmValid =
    utmPayload &&
    Number.isFinite(utmPayload.zone) &&
    Number.isFinite(utmPayload.easting) &&
    Number.isFinite(utmPayload.northing) &&
    (utmPayload.hemisphere === "N" || utmPayload.hemisphere === "S");
  const derived =
    utmValid && utmPayload?.datumEpsg === "4326" ? utmToLatLng(utmPayload) : null;

  await db
    .insert(territory)
    .values({
      id: body.id as string,
      interviewer: body.interviewer as string,
      candidate: body.candidate as string,
      signature: body.signature as string,
      name: body.name as string,
      phone: body.phone as string,
      location: locationValue,
      createdAt: new Date(body.createdAt as string),
      latitude: body.latitude ?? derived?.latitude ?? null,
      longitude: body.longitude ?? derived?.longitude ?? null,
      srid: 4326,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  const rows = await db
    .select({
      latitude: territory.latitude,
      longitude: territory.longitude,
      candidate: territory.candidate,
      name: territory.name,
      phone: territory.phone,
      createdAt: territory.createdAt,
    })
    .from(territory)
    .where(and(isNotNull(territory.latitude), isNotNull(territory.longitude)));

  return NextResponse.json({ points: rows });
}
