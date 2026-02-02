import type { EventRecord } from "../EventRecordsDialog";

export interface MapPoint {
  lat: number;
  lng: number;
  candidate?: string | null;
  interviewer?: string | null;
  name?: string | null;
  createdAt?: string;
  east?: number | null;
  north?: number | null;
  phone?: string | null;
  kind?: "interview" | "tracking" | null;
  online?: boolean | null;
  mode?: string | null;
  signature?: string | null;
  accuracy?: number | null;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  isMoving?: boolean;
}

export const convertRowsToPoints = (rows: EventRecord[]): MapPoint[] => {
  return rows
    .filter((point) => point.latitude !== null && point.longitude !== null)
    .map((point) => ({
      lat: point.latitude as number,
      lng: point.longitude as number,
      candidate: point.candidate ?? null,
      interviewer: point.interviewer ?? null,
      name: point.name ?? null,
      createdAt: point.createdAt ?? undefined,
      east: point.east ?? null,
      north: point.north ?? null,
      phone: point.phone ?? null,
      kind: "interview",
    }));
};

export const calculateCandidateCounts = (rows: EventRecord[]): Record<string, number> => {
  return rows.reduce<Record<string, number>>((acc, point) => {
    const key = point.candidate ?? "Sin candidato";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
};

export const calculateInterviewerCounts = (rows: EventRecord[]): Record<string, number> => {
  return rows.reduce<Record<string, number>>((acc, row) => {
    if (!row.interviewer) return acc;
    acc[row.interviewer] = (acc[row.interviewer] ?? 0) + 1;
    return acc;
  }, {});
};

export const calculateInterviewerRanking = (
  interviewerCounts: Record<string, number>
): Array<[string, number]> => {
  return Object.entries(interviewerCounts).sort((a, b) => b[1] - a[1]);
};

export const generateCandidateTimelineData = (
  rows: EventRecord[],
  candidateLabels: string[]
): Array<Record<string, string | number>> => {
  const candidates = new Set(candidateLabels);
  const hours = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 8;
    return { label: `${hour.toString().padStart(2, "0")}:00`, hour };
  });
  const counters: Record<string, number[]> = {};
  
  for (const candidate of candidates) {
    counters[candidate] = new Array(hours.length).fill(0);
  }

  for (const row of rows) {
    if (!row.createdAt || !row.candidate) continue;
    if (!counters[row.candidate]) continue;
    const date = new Date(row.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const hour = date.getHours();
    const index = hour - 8;
    if (index < 0 || index >= hours.length) continue;
    counters[row.candidate][index] += 1;
  }

  return hours.map((item, index) => {
    const entry: Record<string, string | number> = { time: item.label };
    for (const candidate of candidates) {
      entry[candidate] = counters[candidate]?.[index] ?? 0;
    }
    return entry;
  });
};

export const generateInterviewerTimelineData = (
  rows: EventRecord[],
  topInterviewers: string[]
): Array<Record<string, string | number>> => {
  if (topInterviewers.length === 0) return [];
  const hours = Array.from({ length: 12 }, (_, index) => {
    const hour = index + 8;
    return { label: `${hour.toString().padStart(2, "0")}:00`, hour };
  });
  const counters: Record<string, number[]> = {};
  
  for (const interviewer of topInterviewers) {
    counters[interviewer] = new Array(hours.length).fill(0);
  }

  for (const row of rows) {
    if (!row.createdAt || !row.interviewer) continue;
    if (!counters[row.interviewer]) continue;
    const date = new Date(row.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const hour = date.getHours();
    const index = hour - 8;
    if (index < 0 || index >= hours.length) continue;
    counters[row.interviewer][index] += 1;
  }

  return hours.map((item, index) => {
    const entry: Record<string, string | number> = { time: item.label };
    for (const interviewer of topInterviewers) {
      entry[interviewer] = counters[interviewer]?.[index] ?? 0;
    }
    return entry;
  });
};

export const generateCandidateBarData = (
  candidateLabels: string[],
  counts: Record<string, number>
): Array<{ name: string; value: number }> => {
  return candidateLabels.map((candidate) => ({
    name: candidate,
    value: counts[candidate] ?? 0,
  }));
};

export const getLastUpdated = (rows: EventRecord[]): Date | null => {
  const times = rows
    .map((row) => (row.createdAt ? new Date(row.createdAt).getTime() : 0))
    .filter((time) => !Number.isNaN(time));
  if (times.length === 0) return null;
  return new Date(Math.max(...times));
};

export const getCandidateColor = (candidate: string, candidateLabels: string[]): string => {
  if (candidate === candidateLabels[0]) return "#10b981"; // verde rocio
  if (candidate === candidateLabels[1]) return "#3b82f6"; // azul giovanna
  if (candidate === candidateLabels[2]) return "#f97316"; // naranja guillermo
  return "#64748b";
};
