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
  const id = payload.client_id?.trim() || crypto.randomUUID();
  const candidateRaw = payload.candidate ?? payload.candidato_preferido ?? null;
  const candidate = candidateRaw ? normalizeCandidate(candidateRaw) : null;
  const interviewer = payload.encuestador?.trim() ?? null;
  const signature = payload.encuestador_id?.trim() ?? null;
  const createdAt = payload.fecha ? new Date(payload.fecha) : null;
  const resolvedCreatedAt =
    createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt : null;
  const easting = toNumber(payload.x);
  const northing = toNumber(payload.y);
  const zona = parseZona(payload.zona);
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
    id,
    clientId: payload.client_id?.trim() ?? null,
    candidate,
    interviewer,
    signature,
    name: payload.nombre?.trim() ?? null,
    phone: payload.telefono?.trim() ?? null,
    createdAt: resolvedCreatedAt,
    location,
    east: easting,
    north: northing,
    zona: payload.zona?.trim() ?? null,
    x: easting,
    y: northing,
    candidatoPreferido: payload.candidato_preferido?.trim() ?? null,
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
    await db
      .insert(forms)
      .values({
        id: normalized.id,
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
        target: forms.id,
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
        id: normalized.id,
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
