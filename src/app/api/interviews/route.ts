import { NextResponse } from "next/server";
import { and, eq, gte, isNotNull, isNull, lte, or } from "drizzle-orm";
import { db } from "@/db/connection";
import { events, territory } from "@/db/schema";

type InterviewPayload = {
  id: string;
  eventId?: string;
  interviewer: string;
  candidate: string;
  signature: string;
  name: string;
  phone: string;
  address?: string | null;
  addressLocation:
    | {
        latitude: number;
        longitude: number;
      }
    | null;
  addressUtm:
    | {
        zone: number;
        hemisphere: "N" | "S";
        easting: number;
        northing: number;
        datumEpsg: string;
      }
    | null;
  location:
    | {
        zone: number;
        hemisphere: "N" | "S";
        easting: number;
        northing: number;
        datumEpsg: string;
      }
    | null;
  createdAt: string;
  latitude?: number;
  longitude?: number;
};

const requiredPresenceKeys: Array<keyof InterviewPayload> = [
  "id",
  "interviewer",
  "candidate",
  "signature",
  "name",
  "phone",
  "addressLocation",
  "addressUtm",
  "location",
  "createdAt",
];

const clientToCandidate: Record<string, string> = {
  rocio: "Rocio Porras",
  giovanna: "Giovanna Castagnino",
  guillermo: "Guillermo Aliaga",
};

const formatDateInLima = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const resolveEventId = async (createdAt: string) => {
  const createdDate = formatDateInLima(createdAt);
  if (!createdDate) return null;
  const candidates = await db
    .select({
      id: events.id,
      startDate: events.startDate,
      endDate: events.endDate,
      status: events.status,
      dashboardTemplate: events.dashboardTemplate,
    })
    .from(events)
    .where(and(eq(events.status, "ACTIVE"), eq(events.dashboardTemplate, "tierra")));

  const matching = candidates.filter((event) => {
    const start = event.startDate;
    const end = event.endDate ?? event.startDate;
    return createdDate >= start && createdDate <= end;
  });
  if (matching.length === 0) return null;
  const sorted = matching.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return sorted[0].id;
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
  const missing = requiredPresenceKeys.filter((key) => body[key] === undefined);

  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: "Missing fields", fields: missing },
      { status: 400 },
    );
  }

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

  const resolvedEventId =
    body.eventId ?? (await resolveEventId(body.createdAt as string));

  await db
    .insert(territory)
    .values({
      id: body.id as string,
      eventId: resolvedEventId,
      interviewer: body.interviewer as string,
      candidate: body.candidate as string,
      signature: body.signature as string,
      name: body.name as string,
      phone: body.phone as string,
      address: addressValue,
      addressLocation: addressLocationValue,
      addressUtm: addressUtmValue,
      location: locationValue,
      createdAt: new Date(body.createdAt as string),
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
  const eventIdParam = url.searchParams.get("eventId");
  const includeUnassigned = url.searchParams.get("includeUnassigned") === "1";
  const startDateParam = url.searchParams.get("startDate");
  const endDateParam = url.searchParams.get("endDate");
  if (clientParam && !clientToCandidate[clientParam]) {
    return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }
  const resolvedCandidate =
    (clientParam ? clientToCandidate[clientParam] : null) ?? candidateParam;
  const conditions = [isNotNull(territory.latitude), isNotNull(territory.longitude)];
  if (resolvedCandidate) {
    conditions.push(eq(territory.candidate, resolvedCandidate));
  }
  if (eventIdParam) {
    if (includeUnassigned) {
      const eventCondition = or(
        eq(territory.eventId, eventIdParam),
        isNull(territory.eventId),
      );
      if (eventCondition) {
        conditions.push(eventCondition);
      }
    } else {
      conditions.push(eq(territory.eventId, eventIdParam));
    }
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
      eventId: territory.eventId,
      interviewer: territory.interviewer,
      latitude: territory.latitude,
      longitude: territory.longitude,
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

  return NextResponse.json({ points: rows });
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
