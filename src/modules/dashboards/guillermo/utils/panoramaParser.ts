import type {
  PanoramaCity,
  PanoramaData,
  PanoramaDaySeries,
  PanoramaPageChart,
  PanoramaSourceChart,
  PanoramaSummary,
} from "../types/dashboard";
import {
  PANORAMA_SECTION,
  type PanoramaSection,
} from "../constants/dashboard";

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
};

const toNumber = (value: string) => {
  const trimmed = value.trim();
  const normalized =
    trimmed.includes(",") && trimmed.includes(".")
      ? trimmed.replace(/\./g, "").replace(",", ".")
      : trimmed.includes(",")
        ? trimmed.replace(",", ".")
        : trimmed;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const parsePanoramaCSV = (payload: string): PanoramaData => {
  const lines = payload.split(/\r?\n/);
  let section: PanoramaSection | null = null;
  let summaryPending = false;
  let summary: PanoramaSummary | null = null;
  const pages: PanoramaPageChart[] = [];
  const userSources: PanoramaSourceChart[] = [];
  const sessionSources: PanoramaSourceChart[] = [];
  const daySeries: PanoramaDaySeries[] = [];
  const cities: PanoramaCity[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    if (line.startsWith("Usuarios activos")) {
      summaryPending = true;
      section = PANORAMA_SECTION.SUMMARY;
      continue;
    }
    if (summaryPending && section === PANORAMA_SECTION.SUMMARY) {
      const values = parseCsvLine(line);
      summary = {
        usuariosActivos: toNumber(values[0] ?? "0"),
        usuariosNuevos: toNumber(values[1] ?? "0"),
        tiempoInteraccion: toNumber(values[2] ?? "0"),
        eventos: toNumber(values[3] ?? "0"),
      };
      summaryPending = false;
      section = null;
      continue;
    }
    if (line.startsWith("Titulo de pagina") || line.startsWith("Título de página")) {
      section = PANORAMA_SECTION.PAGES;
      continue;
    }
    if (line.startsWith("Primera fuente/medio")) {
      section = PANORAMA_SECTION.USER_SOURCES;
      continue;
    }
    if (line.startsWith("Fuente/medio de la sesion") || line.startsWith("Fuente/medio de la sesión")) {
      section = PANORAMA_SECTION.SESSION_SOURCES;
      continue;
    }
    if (line.startsWith("Dia") || line.startsWith("Día")) {
      section = PANORAMA_SECTION.DAY;
      continue;
    }
    if (line.startsWith("Ciudad")) {
      section = PANORAMA_SECTION.CITIES;
      continue;
    }
    if (line.startsWith("Plataforma")) {
      section = PANORAMA_SECTION.PLATFORM;
      continue;
    }

    const values = parseCsvLine(line);
    if (section === PANORAMA_SECTION.PAGES) {
      pages.push({
        titulo: values[0] ?? "",
        vistas: toNumber(values[1] ?? "0"),
        usuarios: toNumber(values[2] ?? "0"),
        eventos: toNumber(values[3] ?? "0"),
        rebote: toNumber(values[4] ?? "0"),
      });
    }
    if (section === PANORAMA_SECTION.USER_SOURCES) {
      userSources.push({
        fuente: values[0] ?? "",
        usuarios: toNumber(values[1] ?? "0"),
      });
    }
    if (section === PANORAMA_SECTION.SESSION_SOURCES) {
      sessionSources.push({
        fuente: values[0] ?? "",
        usuarios: toNumber(values[1] ?? "0"),
      });
    }
    if (section === PANORAMA_SECTION.DAY) {
      const dayIndex = Number.parseInt(values[0] ?? "0", 10);
      daySeries.push({
        dayIndex,
        dayLabel: values[0] ?? "",
        nuevos: toNumber(values[1] ?? "0"),
        recurrentes: toNumber(values[2] ?? "0"),
      });
    }
    if (section === PANORAMA_SECTION.CITIES) {
      cities.push({
        ciudad: values[0] ?? "",
        usuarios: toNumber(values[1] ?? "0"),
      });
    }
  }

  return {
    summary,
    pages,
    userSources,
    sessionSources,
    daySeries,
    cities,
  };
};
