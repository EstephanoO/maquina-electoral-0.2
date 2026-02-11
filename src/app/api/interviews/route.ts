import { NextResponse } from "next/server";
import { and, eq, gte, isNotNull, lte, or } from "drizzle-orm";
import { db } from "@/db/connection";
import { territory } from "@/db/schema";
import { CESAR_VASQUEZ_INTERVIEWS } from "@/db/constants/cesar-vasquez-mock";

type InterviewPayload = {
  id?: string | null;
  interviewer?: string | null;
  candidate?: string | null;
  signature?: string | null;
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  addressLocation?:
    | {
        latitude: number;
        longitude: number;
      }
    | null;
  addressUtm?:
    | {
        zone: number;
        hemisphere: "N" | "S";
        easting: number;
        northing: number;
        datumEpsg: string;
      }
    | null;
  location?:
    | {
        zone: number;
        hemisphere: "N" | "S";
        easting: number;
        northing: number;
        datumEpsg: string;
      }
    | null;
  createdAt?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const clientToCandidate: Record<string, string> = {
  rocio: "Rocio Porras",
  giovanna: "Giovanna Castagnino",
  guillermo: "Guillermo Aliaga",
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
  const locationValue = body.location ?? null;
  const addressLocationValue = body.addressLocation ?? null;
  const addressUtmValue = body.addressUtm ?? null;
  const addressValue = body.address ?? null;
  const utmPayload =
    body.location
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

  const createdAtValue = body.createdAt ? new Date(body.createdAt) : null;
  const resolvedCreatedAt = createdAtValue && !Number.isNaN(createdAtValue.getTime())
    ? createdAtValue
    : null;
  const idValue = body.id ?? crypto.randomUUID();

  await db
    .insert(territory)
    .values({
      id: idValue,
      interviewer: body.interviewer ?? null,
      candidate: body.candidate ?? null,
      signature: body.signature ?? null,
      name: body.name ?? null,
      phone: body.phone ?? null,
      address: addressValue,
      addressLocation: addressLocationValue,
      addressUtm: addressUtmValue,
      location: locationValue,
      createdAt: resolvedCreatedAt,
      latitude: body.latitude ?? derived?.latitude ?? null,
      longitude: body.longitude ?? derived?.longitude ?? null,
      east: utmValid ? utmPayload.easting : null,
      north: utmValid ? utmPayload.northing : null,
      srid: 4326,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const candidateParam = url.searchParams.get("candidate");
  const clientParam = url.searchParams.get("client");
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  if (clientParam === "cesar-vasquez") {
    return NextResponse.json({ points: CESAR_VASQUEZ_INTERVIEWS });
  }
  if (clientParam && !clientToCandidate[clientParam]) {
    return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }
  const resolvedCandidate =
    (clientParam ? clientToCandidate[clientParam] : null) ?? candidateParam;
  const conditions = [
    or(
      and(isNotNull(territory.latitude), isNotNull(territory.longitude)),
      isNotNull(territory.addressLocation),
      isNotNull(territory.location),
    ),
  ];
  if (resolvedCandidate) {
    conditions.push(eq(territory.candidate, resolvedCandidate));
  }
  if (startDateParam) {
    conditions.push(gte(territory.createdAt, new Date(startDateParam)));
  }
  if (endDateParam) {
    conditions.push(lte(territory.createdAt, new Date(endDateParam)));
  }
  const condition = and(...conditions);

  const rows = await db
    .select({
      id: territory.id,
      interviewer: territory.interviewer,
      latitude: territory.latitude,
      longitude: territory.longitude,
      location: territory.location,
      east: territory.east,
      north: territory.north,
      candidate: territory.candidate,
      name: territory.name,
      phone: territory.phone,
      address: territory.address,
      addressLocation: territory.addressLocation,
      createdAt: territory.createdAt,
    })
    .from(territory)
    .where(condition);

  const points = rows.map((row) => {
    if (row.latitude !== null && row.longitude !== null) return row;
    const payload = row.location as
      | {
          zone?: number | string;
          hemisphere?: "N" | "S" | string;
          easting?: number | string;
          northing?: number | string;
          datumEpsg?: string | number;
        }
      | null;
    if (!payload) return row;
    const utmPayload = {
      zone: Number(payload.zone),
      hemisphere: payload.hemisphere as "N" | "S" | undefined,
      easting: Number(payload.easting),
      northing: Number(payload.northing),
      datumEpsg: String(payload.datumEpsg ?? ""),
    };
    const utmValid = Boolean(
      utmPayload.zone &&
        utmPayload.hemisphere &&
        Number.isFinite(utmPayload.easting) &&
        Number.isFinite(utmPayload.northing),
    );
    const epsgValue = utmPayload.datumEpsg?.toString().trim();
    const epsgAllowed = epsgValue === "4326" || epsgValue === "32718" || epsgValue === "32618";
    const derived =
      utmValid &&
      (utmPayload.hemisphere === "N" || utmPayload.hemisphere === "S") &&
      epsgAllowed
        ? utmToLatLng({
            zone: utmPayload.zone,
            hemisphere: utmPayload.hemisphere,
            easting: utmPayload.easting,
            northing: utmPayload.northing,
          })
        : null;
    return {
      ...row,
      latitude: derived?.latitude ?? row.latitude,
      longitude: derived?.longitude ?? row.longitude,
    };
  });

  return NextResponse.json({ points });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Partial<InterviewPayload> & { id?: string };
  if (!body.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const updates: Partial<typeof territory.$inferInsert> = {};
  if (typeof body.candidate === "string") updates.candidate = body.candidate;
  if (typeof body.name === "string") updates.name = body.name;
  if (typeof body.phone === "string") updates.phone = body.phone;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates" }, { status: 400 });
  }

  await db.update(territory).set(updates).where(eq(territory.id, body.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await db.delete(territory).where(eq(territory.id, id));
  return NextResponse.json({ ok: true });
}
