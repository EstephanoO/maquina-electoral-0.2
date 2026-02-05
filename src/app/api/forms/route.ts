import { NextResponse } from "next/server";
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
  let body: FormPayload | FormPayload[];
  try {
    body = (await request.json()) as FormPayload | FormPayload[];
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [body];
  for (const item of items) {
    const normalized = normalizePayload(item);
    if (!normalized.clientId) {
      return NextResponse.json({ ok: false, error: "Missing client_id" }, { status: 400 });
    }
    if (!normalized.name) {
      return NextResponse.json({ ok: false, error: "Missing nombre" }, { status: 400 });
    }
    if (!normalized.phone) {
      return NextResponse.json({ ok: false, error: "Missing telefono" }, { status: 400 });
    }
    if (!normalized.createdAt) {
      return NextResponse.json({ ok: false, error: "Invalid fecha" }, { status: 400 });
    }
    if (normalized.x === null || normalized.y === null) {
      return NextResponse.json({ ok: false, error: "Invalid x/y" }, { status: 400 });
    }
    if (!normalized.zona) {
      return NextResponse.json({ ok: false, error: "Missing zona" }, { status: 400 });
    }
    if (!normalized.interviewer) {
      return NextResponse.json({ ok: false, error: "Missing encuestador" }, { status: 400 });
    }
    if (!normalized.signature) {
      return NextResponse.json({ ok: false, error: "Missing encuestador_id" }, { status: 400 });
    }
    if (!normalized.candidatoPreferido) {
      return NextResponse.json(
        { ok: false, error: "Missing candidato_preferido" },
        { status: 400 },
      );
    }
    const xValue = Math.round(normalized.x);
    const yValue = Math.round(normalized.y);
    await db
      .insert(forms)
      .values({
        id: normalized.id ?? undefined,
        clientId: normalized.clientId,
        nombre: normalized.name,
        telefono: normalized.phone,
        fecha: normalized.createdAt,
        x: xValue,
        y: yValue,
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
          x: xValue,
          y: yValue,
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

  return NextResponse.json({ ok: true }, { status: 201 });
}
