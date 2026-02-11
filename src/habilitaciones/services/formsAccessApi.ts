import type { FormAccessRecord, FormAccessStatus, FormMapPoint, Operator } from "../types";

export const fetchOperators = async () => {
  const response = await fetch("/api/operators", { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar operadoras.");
  const payload = (await response.json()) as { operators: Operator[] };
  return payload.operators ?? [];
};

export const fetchFormMapPoints = async () => {
  const response = await fetch("/api/forms-map", { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar puntos.");
  const payload = (await response.json()) as { points: FormMapPoint[] };
  return payload.points ?? [];
};

export const fetchFormAccess = async (operatorId: string) => {
  const response = await fetch(`/api/forms-access?operatorId=${operatorId}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("No se pudo cargar accesos.");
  const payload = (await response.json()) as {
    records: FormAccessRecord[];
    statuses: FormAccessStatus[];
  };
  return payload;
};

export const fetchEnabledFormClientIds = async () => {
  const response = await fetch("/api/forms-access/enabled", { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo cargar habilitados.");
  const payload = (await response.json()) as { clientIds: string[] };
  return payload.clientIds ?? [];
};

export const enableFormAccess = async (payload: {
  operatorIds: string[];
  formIds?: string[];
  clientIds?: string[];
  enabledBy?: string;
}) => {
  const response = await fetch("/api/forms-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("No se pudo habilitar accesos.");
  return response.json();
};

export const updateFormAccessStatus = async (payload: {
  operatorId: string;
  formId: string;
  contacted?: boolean;
  replied?: boolean;
  deleted?: boolean;
  homeMapsUrl?: string | null;
  pollingPlaceUrl?: string | null;
  linksComment?: string | null;
}) => {
  const response = await fetch("/api/forms-access/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("No se pudo actualizar el estado.");
  return response.json();
};
