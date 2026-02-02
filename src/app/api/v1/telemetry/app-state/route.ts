import { NextResponse } from "next/server";
import { inArray, sql } from "drizzle-orm";
import { db } from "@/db/connection";
import { appStateCurrent, appStateEvents } from "@/db/schema";

type AppStateValue = "active" | "inactive" | "background";

type TelemetryPayload = {
  eventId: string;
  timestamp: string;
  session: {
    interviewer?: string;
    candidate?: string;
    signature: string;
  };
  appState: AppStateValue;
  connectivity?: {
    isConnected?: boolean;
    isInternetReachable?: boolean;
    connectionType?: string;
  };
  device?: {
    os?: string;
    osVersion?: string;
    model?: string;
    appVersion?: string;
  };
};

const allowedStates = new Set<AppStateValue>(["active", "inactive", "background"]);
const rateLimitWindowMs = 60 * 1000;
const rateLimitMax = 60;
const rateLimitState = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (signature: string) => {
  const now = Date.now();
  const state = rateLimitState.get(signature);
  if (!state || now >= state.resetAt) {
    rateLimitState.set(signature, { count: 1, resetAt: now + rateLimitWindowMs });
    return true;
  }
  if (state.count >= rateLimitMax) return false;
  state.count += 1;
  return true;
};

const validateAuth = (request: Request) => {
  const apiKey = request.headers.get("x-api-key")?.trim();
  const authorization = request.headers.get("authorization")?.trim();
  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : null;
  const allowedApiKey = process.env.TELEMETRY_API_KEY;
  const allowedBearer = process.env.TELEMETRY_BEARER_TOKEN;
  if (allowedApiKey && apiKey === allowedApiKey) return true;
  if (allowedBearer && bearerToken === allowedBearer) return true;
  return false;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export async function POST(request: Request) {
  if (!validateAuth(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: TelemetryPayload;
  try {
    body = (await request.json()) as TelemetryPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!isNonEmptyString(body.eventId)) {
    return NextResponse.json({ ok: false, error: "Missing eventId" }, { status: 400 });
  }
  if (!isNonEmptyString(body.timestamp)) {
    return NextResponse.json({ ok: false, error: "Missing timestamp" }, { status: 400 });
  }
  if (!body.session || !isNonEmptyString(body.session.signature)) {
    return NextResponse.json({ ok: false, error: "Missing session.signature" }, { status: 400 });
  }
  if (!body.appState || !allowedStates.has(body.appState)) {
    return NextResponse.json({ ok: false, error: "Invalid appState" }, { status: 400 });
  }

  const timestamp = new Date(body.timestamp);
  if (Number.isNaN(timestamp.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid timestamp" }, { status: 400 });
  }

  const signature = body.session.signature.trim();
  if (!checkRateLimit(signature)) {
    return NextResponse.json({ ok: false, error: "Rate limit" }, { status: 429 });
  }

  const insertResult = await db
    .insert(appStateEvents)
    .values({
      id: body.eventId,
      signature,
      interviewer: body.session.interviewer ?? null,
      candidate: body.session.candidate ?? null,
      appState: body.appState,
      timestamp,
      isConnected: body.connectivity?.isConnected ?? null,
      isInternetReachable: body.connectivity?.isInternetReachable ?? null,
      connectionType: body.connectivity?.connectionType ?? null,
      deviceOs: body.device?.os ?? null,
      deviceOsVersion: body.device?.osVersion ?? null,
      deviceModel: body.device?.model ?? null,
      appVersion: body.device?.appVersion ?? null,
    })
    .onConflictDoNothing()
    .returning({ id: appStateEvents.id });

  if (insertResult.length === 0) {
    return NextResponse.json({ ok: true, status: "duplicate" }, { status: 409 });
  }

  const lastSeenActiveAt = body.appState === "active" ? timestamp : null;

  await db
    .insert(appStateCurrent)
    .values({
      signature,
      interviewer: body.session.interviewer ?? null,
      candidate: body.session.candidate ?? null,
      lastState: body.appState,
      lastSeenAt: timestamp,
      lastSeenActiveAt,
      lastIsConnected: body.connectivity?.isConnected ?? null,
      lastIsInternetReachable: body.connectivity?.isInternetReachable ?? null,
      lastConnectionType: body.connectivity?.connectionType ?? null,
      deviceOs: body.device?.os ?? null,
      deviceOsVersion: body.device?.osVersion ?? null,
      deviceModel: body.device?.model ?? null,
      appVersion: body.device?.appVersion ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appStateCurrent.signature,
      set: {
        interviewer: body.session.interviewer ?? null,
        candidate: body.session.candidate ?? null,
        lastState: body.appState,
        lastSeenAt: timestamp,
        lastSeenActiveAt: body.appState === "active" ? timestamp : null,
        lastIsConnected: body.connectivity?.isConnected ?? null,
        lastIsInternetReachable: body.connectivity?.isInternetReachable ?? null,
        lastConnectionType: body.connectivity?.connectionType ?? null,
        deviceOs: body.device?.os ?? null,
        deviceOsVersion: body.device?.osVersion ?? null,
        deviceModel: body.device?.model ?? null,
        appVersion: body.device?.appVersion ?? null,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true }, { status: 202 });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const signatureParams = url.searchParams.getAll("signature");
  const signaturesCsv = url.searchParams.get("signatures");
  const signatures = [
    ...signatureParams,
    ...(signaturesCsv ? signaturesCsv.split(",") : []),
  ]
    .map((value) => value.trim())
    .filter(Boolean);

  if (signatures.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const rows = await db
    .select({
      signature: appStateCurrent.signature,
      interviewer: appStateCurrent.interviewer,
      candidate: appStateCurrent.candidate,
      lastState: appStateCurrent.lastState,
      lastSeenAt: appStateCurrent.lastSeenAt,
      lastSeenActiveAt: appStateCurrent.lastSeenActiveAt,
      lastIsConnected: appStateCurrent.lastIsConnected,
      lastIsInternetReachable: appStateCurrent.lastIsInternetReachable,
      lastConnectionType: appStateCurrent.lastConnectionType,
      deviceOs: appStateCurrent.deviceOs,
      deviceOsVersion: appStateCurrent.deviceOsVersion,
      deviceModel: appStateCurrent.deviceModel,
      appVersion: appStateCurrent.appVersion,
      updatedAt: appStateCurrent.updatedAt,
    })
    .from(appStateCurrent)
    .where(inArray(appStateCurrent.signature, signatures));

  return NextResponse.json({ items: rows });
}
