import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db/connection";
import { interviewerTracking } from "@/db/schema";

type TrackingCoords = {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  "la titude"?: number;
};

type TrackingPayload = {
  interviewer: string;
  candidate: string;
  signature: string;
  timestamp: string;
  mode: string;
  coords: TrackingCoords;
  eventId?: string;
};

const requiredKeys: Array<keyof TrackingPayload> = [
  "interviewer",
  "candidate",
  "signature",
  "timestamp",
  "mode",
  "coords",
];

const clientToCandidate: Record<string, string> = {
  rocio: "Rocio Porras",
  giovanna: "Giovanna Castagnino",
  guillermo: "Guillermo Aliaga",
};

const normalizeCandidate = (value: string) => {
  const raw = value.trim();
  const key = raw.toLowerCase();
  return clientToCandidate[key] ?? raw;
};

const toNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildInterviewerKey = (interviewer: string, signature: string) =>
  `${interviewer} | ${signature}`;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const eventIdParam = url.searchParams.get("eventId");
  const body = (await request.json()) as Partial<TrackingPayload>;
  console.info("[tracking] payload", body);
  const missing = requiredKeys.filter((key) => !body[key]);
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, error: "Missing fields", fields: missing },
      { status: 400 },
    );
  }

  const coords = body.coords ?? {};
  const latitude = toNumber(coords.latitude ?? coords["la titude"]);
  const longitude = toNumber(coords.longitude);
  if (latitude === null || longitude === null) {
    return NextResponse.json(
      { ok: false, error: "Invalid coords" },
      { status: 400 },
    );
  }

  if (coords["la titude"] !== undefined && coords.latitude === undefined) {
    console.warn("[tracking] deprecated coords field: la titude");
  }

  const timestamp = new Date(body.timestamp as string);
  if (Number.isNaN(timestamp.getTime())) {
    return NextResponse.json(
      { ok: false, error: "Invalid timestamp" },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const interviewer = String(body.interviewer).trim();
  const signature = String(body.signature).trim();
  const interviewerKey = buildInterviewerKey(interviewer, signature);
  const candidate = normalizeCandidate(String(body.candidate));
  const mode = String(body.mode).trim();

  await db.insert(interviewerTracking).values({
    id,
    eventId: body.eventId ?? eventIdParam,
    interviewer,
    candidate,
    signature,
    interviewerKey,
    mode,
    trackedAt: timestamp,
    latitude,
    longitude,
    accuracy: toNumber(coords.accuracy),
    altitude: toNumber(coords.altitude),
    speed: toNumber(coords.speed),
    heading: toNumber(coords.heading),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const eventIdParam = url.searchParams.get("eventId");
  const candidateParam = url.searchParams.get("candidate");
  const clientParam = url.searchParams.get("client");
  const modeParam = url.searchParams.get("mode");
  if (clientParam && !clientToCandidate[clientParam]) {
    return NextResponse.json({ error: "Invalid client" }, { status: 400 });
  }
  const resolvedCandidate =
    (clientParam ? clientToCandidate[clientParam] : null) ??
    (candidateParam ? normalizeCandidate(candidateParam) : null);

  const conditions: Array<ReturnType<typeof sql>> = [];
  if (eventIdParam) conditions.push(sql`event_id = ${eventIdParam}`);
  if (resolvedCandidate) conditions.push(sql`candidate = ${resolvedCandidate}`);
  if (modeParam) conditions.push(sql`mode = ${modeParam}`);
  const whereClause = conditions.length
    ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
    : sql``;

  const query = sql`
    SELECT DISTINCT ON (interviewer_key)
      id,
      event_id,
      interviewer,
      candidate,
      signature,
      interviewer_key,
      mode,
      tracked_at,
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading
    FROM interviewer_tracking
    ${whereClause}
    ORDER BY interviewer_key, tracked_at DESC;
  `;

  const { rows } = await db.execute(query);
  const points = rows.map((row) => ({
    id: row.id as string,
    eventId: row.event_id as string | null,
    interviewer: row.interviewer as string,
    candidate: row.candidate as string,
    signature: row.signature as string,
    interviewerKey: row.interviewer_key as string,
    mode: row.mode as string,
    trackedAt: row.tracked_at as string,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    accuracy: row.accuracy === null ? null : Number(row.accuracy),
    altitude: row.altitude === null ? null : Number(row.altitude),
    speed: row.speed === null ? null : Number(row.speed),
    heading: row.heading === null ? null : Number(row.heading),
  }));

  return NextResponse.json({ points });
}
