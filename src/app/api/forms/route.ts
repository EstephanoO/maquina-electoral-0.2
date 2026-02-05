import { isApiKeyValid, isOriginAllowed } from "@/lib/api/auth";
import { getRequestId, jsonResponse, logApiEvent } from "@/lib/api/http";
import { db } from "@/db/connection";
import { forms, territory } from "@/db/schema";

type FormPayload = {
  nombre?: string | null;
  telefono?: string | null;
  fecha?: string | null;
  x?: number | string | null;
  y?: number | string | null;
  zona?: string | null;
  candidate?: string | null;
  encuestador?: string | null;
  encuestador_id?: string | null;
  candidato_preferido?: string | null;
  client_id?: string | null;
};

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

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

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

const toDatumEpsg = (zone: number, hemisphere: "N" | "S") => {
  const base = hemisphere === "S" ? 32700 : 32600;
  return String(base + zone);
};

const normalizePayload = (payload: FormPayload) => {
  const clientId = payload.client_id?.trim() ?? null;
  const idValue = clientId && isUuid(clientId) ? clientId : null;
  const candidateRaw = payload.candidate ?? payload.candidato_preferido ?? "";
  const candidate = candidateRaw ? normalizeCandidate(candidateRaw) : "";
  const interviewer = payload.encuestador?.trim() ?? "";
  const signature = payload.encuestador_id?.trim() ?? "";
  const createdAt = payload.fecha ? new Date(payload.fecha) : null;
  const resolvedCreatedAt =
    createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null;
  const easting = toNumber(payload.x);
  const northing = toNumber(payload.y);
  const zona = parseZona(payload.zona);
  const zonaRaw = payload.zona?.trim() ?? "";
  const nombre = payload.nombre?.trim() ?? "";
  const telefono = payload.telefono?.trim() ?? "";
  const candidatoPreferido = payload.candidato_preferido?.trim() ?? candidate;
  const location =
    zona && easting !== null && northing !== null
      ? {
          zone: zona.zone,
          hemisphere: zona.hemisphere,
          easting,
          northing,
          datumEpsg: toDatumEpsg(zona.zone, zona.hemisphere),
        }
      : null;

  return {
    id: idValue,
    clientId,
    candidate,
    interviewer,
    signature,
    name: nombre,
    phone: telefono,
    createdAt: resolvedCreatedAt,
    location,
    east: easting,
    north: northing,
    zona: zonaRaw,
    x: easting,
    y: northing,
    candidatoPreferido,
  };
};

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  const route = new URL(request.url).pathname;
  const origin = request.headers.get("origin");
  if (!isOriginAllowed(origin)) {
    const status = 403;
    logApiEvent({
      requestId,
      route,
      method: "POST",
      status,
      durationMs: Date.now() - startedAt,
      errorCode: "origin_blocked",
    });
    return jsonResponse({ ok: false, error: "Forbidden" }, requestId, { status });
  }
  if (!isApiKeyValid(request)) {
    const status = 401;
    logApiEvent({
      requestId,
      route,
      method: "POST",
      status,
      durationMs: Date.now() - startedAt,
      errorCode: "invalid_api_key",
    });
    return jsonResponse({ ok: false, error: "Unauthorized" }, requestId, { status });
  }
  let body: FormPayload | FormPayload[];
  try {
    body = (await request.json()) as FormPayload | FormPayload[];
  } catch {
    const status = 400;
    logApiEvent({
      requestId,
      route,
      method: "POST",
      status,
      durationMs: Date.now() - startedAt,
      errorCode: "invalid_json",
    });
    return jsonResponse({ ok: false, error: "Invalid JSON" }, requestId, { status });
  }

  const items = Array.isArray(body) ? body : [body];
  for (const item of items) {
    const normalized = normalizePayload(item);
    if (!normalized.clientId) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_client_id",
      });
      return jsonResponse({ ok: false, error: "Missing client_id" }, requestId, {
        status,
      });
    }
    if (!normalized.name) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_nombre",
      });
      return jsonResponse({ ok: false, error: "Missing nombre" }, requestId, { status });
    }
    if (!normalized.phone) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_telefono",
      });
      return jsonResponse({ ok: false, error: "Missing telefono" }, requestId, { status });
    }
    if (!normalized.createdAt) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "invalid_fecha",
      });
      return jsonResponse({ ok: false, error: "Invalid fecha" }, requestId, { status });
    }
    if (normalized.x === null || normalized.y === null) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "invalid_xy",
      });
      return jsonResponse({ ok: false, error: "Invalid x/y" }, requestId, { status });
    }
    if (!normalized.zona) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_zona",
      });
      return jsonResponse({ ok: false, error: "Missing zona" }, requestId, { status });
    }
    if (!normalized.interviewer) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_encuestador",
      });
      return jsonResponse(
        { ok: false, error: "Missing encuestador" },
        requestId,
        { status },
      );
    }
    if (!normalized.signature) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_encuestador_id",
      });
      return jsonResponse(
        { ok: false, error: "Missing encuestador_id" },
        requestId,
        { status },
      );
    }
    if (!normalized.candidatoPreferido) {
      const status = 400;
      logApiEvent({
        requestId,
        route,
        method: "POST",
        status,
        durationMs: Date.now() - startedAt,
        errorCode: "missing_candidato_preferido",
      });
      return jsonResponse(
        { ok: false, error: "Missing candidato_preferido" },
        requestId,
        { status },
      );
    }
    await db
      .insert(forms)
      .values({
        id: normalized.id ?? undefined,
        clientId: normalized.clientId,
        nombre: normalized.name,
        telefono: normalized.phone,
        fecha: normalized.createdAt,
        x: normalized.x,
        y: normalized.y,
        zona: normalized.zona,
        candidate: normalized.candidate,
        encuestador: normalized.interviewer,
        encuestadorId: normalized.signature,
        candidatoPreferido: normalized.candidatoPreferido,
      })
      .onConflictDoUpdate({
        target: forms.clientId,
        set: {
          clientId: normalized.clientId,
          nombre: normalized.name,
          telefono: normalized.phone,
          fecha: normalized.createdAt,
          x: normalized.x,
          y: normalized.y,
          zona: normalized.zona,
          candidate: normalized.candidate,
          encuestador: normalized.interviewer,
          encuestadorId: normalized.signature,
          candidatoPreferido: normalized.candidatoPreferido,
        },
      });
    await db
      .insert(territory)
      .values({
        id: normalized.clientId,
        eventId: null,
        interviewer: normalized.interviewer,
        candidate: normalized.candidate,
        signature: normalized.signature,
        name: normalized.name,
        phone: normalized.phone,
        address: null,
        addressLocation: null,
        addressUtm: null,
        location: normalized.location,
        createdAt: normalized.createdAt,
        latitude: null,
        longitude: null,
        east: normalized.east,
        north: normalized.north,
        srid: 4326,
      })
      .onConflictDoUpdate({
        target: territory.id,
        set: {
          interviewer: normalized.interviewer,
          candidate: normalized.candidate,
          signature: normalized.signature,
          name: normalized.name,
          phone: normalized.phone,
          location: normalized.location,
          createdAt: normalized.createdAt,
          east: normalized.east,
          north: normalized.north,
        },
      });
  }
  const status = 201;
  logApiEvent({
    requestId,
    route,
    method: "POST",
    status,
    durationMs: Date.now() - startedAt,
    itemsCount: items.length,
  });
  return jsonResponse({ ok: true }, requestId, { status });
}
