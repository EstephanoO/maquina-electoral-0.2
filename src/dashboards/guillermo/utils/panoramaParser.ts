import type {
  PanoramaCity,
  PanoramaData,
  PanoramaDailyMetric,
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
  const normalized = (() => {
    const hasComma = trimmed.includes(",");
    const hasDot = trimmed.includes(".");
    if (hasComma && hasDot) {
      return trimmed.replace(/\./g, "").replace(",", ".");
    }
    if (hasComma) {
      return trimmed.replace(",", ".");
    }
    if (hasDot) {
      const isThousands = /^\d{1,3}(\.\d{3})+$/.test(trimmed);
      if (isThousands) return trimmed.replace(/\./g, "");
    }
    return trimmed;
  })();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeCell = (value: string) => value.replace(/\s+/g, " ").trim();

const findHeaderIndex = (
  rows: string[][],
  predicate: (value: string) => boolean,
  validator?: (row: string[], index: number) => boolean,
) => {
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    for (let colIndex = 0; colIndex < row.length; colIndex += 1) {
      const cell = normalizeCell(row[colIndex] ?? "");
      if (!cell) continue;
      if (predicate(cell) && (!validator || validator(row, colIndex))) {
        return { rowIndex, colIndex };
      }
    }
  }
  return null;
};

const parsePanoramaGrid = (payload: string): PanoramaData | null => {
  const rows = payload.split(/\r?\n/).map((line) => parseCsvLine(line));
  const dailyHeader = findHeaderIndex(
    rows,
    (value) => value === "Día N" || value === "Dia N",
    (row, index) => {
      const next = normalizeCell(row[index + 1] ?? "");
      const nextTwo = normalizeCell(row[index + 2] ?? "");
      const nextThree = normalizeCell(row[index + 3] ?? "");
      return next === "30 días" && nextTwo === "7 días" && nextThree === "1 día";
    },
  );
  const userSourcesHeader = findHeaderIndex(rows, (value) =>
    value.startsWith("Primer grupo de canales principal del usuario"),
  );
  const pagesHeader = findHeaderIndex(rows, (value) =>
    value === "Título de página y clase de pantalla" || value === "Titulo de pagina y clase de pantalla",
  );

  if (!dailyHeader && !userSourcesHeader && !pagesHeader) return null;

  const dailyActive: PanoramaDailyMetric[] = [];
  const userSources: PanoramaSourceChart[] = [];
  const pages: PanoramaPageChart[] = [];

  if (dailyHeader) {
    for (let rowIndex = dailyHeader.rowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const rawDay = normalizeCell(row[dailyHeader.colIndex] ?? "");
      if (!rawDay) continue;
      const dayIndex = Number.parseInt(rawDay, 10);
      if (!Number.isFinite(dayIndex)) continue;
      const value = toNumber(row[dailyHeader.colIndex + 1] ?? "0");
      dailyActive.push({
        dayIndex,
        label: `D${dayIndex}`,
        value,
      });
    }
  }

  if (userSourcesHeader) {
    for (let rowIndex = userSourcesHeader.rowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const fuente = normalizeCell(row[userSourcesHeader.colIndex] ?? "");
      const usuariosRaw = row[userSourcesHeader.colIndex + 1] ?? "";
      if (!fuente || !usuariosRaw) continue;
      userSources.push({
        fuente,
        usuarios: toNumber(usuariosRaw),
      });
    }
  }

  if (pagesHeader) {
    for (let rowIndex = pagesHeader.rowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const titulo = normalizeCell(row[pagesHeader.colIndex] ?? "");
      const vistasRaw = row[pagesHeader.colIndex + 1] ?? "";
      if (!titulo || !vistasRaw) continue;
      pages.push({
        titulo,
        vistas: toNumber(vistasRaw),
        usuarios: 0,
        eventos: 0,
        rebote: 0,
      });
    }
  }

  return {
    summary: null,
    pages,
    userSources,
    sessionSources: [],
    dailyActive,
    dailyNew: [],
    dailyEngagement: [],
    cities: [],
  };
};

export const parsePanoramaCSV = (payload: string): PanoramaData => {
  const gridParsed = parsePanoramaGrid(payload);
  if (gridParsed) return gridParsed;

  const lines = payload.split(/\r?\n/);
  let section: PanoramaSection | null = null;
  let dayMetric: "active" | "new" | "engagement" | null = null;
  let summaryPending = false;
  let summary: PanoramaSummary | null = null;
  const pages: PanoramaPageChart[] = [];
  const userSources: PanoramaSourceChart[] = [];
  const sessionSources: PanoramaSourceChart[] = [];
  const dailyActive: PanoramaDailyMetric[] = [];
  const dailyNew: PanoramaDailyMetric[] = [];
  const dailyEngagement: PanoramaDailyMetric[] = [];
  const cities: PanoramaCity[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const normalizedLine = line.replace(/\u00a0/g, " ");
    if (!line || line.startsWith("#")) {
      continue;
    }

    if (normalizedLine.startsWith("Usuarios activos")) {
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
    if (normalizedLine.startsWith("Titulo de pagina") || normalizedLine.startsWith("Título de página")) {
      section = PANORAMA_SECTION.PAGES;
      continue;
    }
    if (
      normalizedLine.startsWith("Primera fuente/medio") ||
      normalizedLine.startsWith("Primer grupo de canales principal del usuario")
    ) {
      section = PANORAMA_SECTION.USER_SOURCES;
      continue;
    }
    if (
      normalizedLine.startsWith("Fuente/medio de la sesion") ||
      normalizedLine.startsWith("Fuente/medio de la sesión") ||
      normalizedLine.startsWith("Grupo de canales principal de la sesión")
    ) {
      section = PANORAMA_SECTION.SESSION_SOURCES;
      continue;
    }
    if (normalizedLine.startsWith("Día N,Usuarios activos") || normalizedLine.startsWith("Dia N,Usuarios activos")) {
      section = PANORAMA_SECTION.DAY;
      dayMetric = "active";
      continue;
    }
    if (normalizedLine.startsWith("Día N,Usuarios nuevos") || normalizedLine.startsWith("Dia N,Usuarios nuevos")) {
      section = PANORAMA_SECTION.DAY;
      dayMetric = "new";
      continue;
    }
    if (
      normalizedLine.startsWith("Día N,Tiempo de interacción medio")
      || normalizedLine.startsWith("Dia N,Tiempo de interaccion medio")
    ) {
      section = PANORAMA_SECTION.DAY;
      dayMetric = "engagement";
      continue;
    }
    if (normalizedLine.startsWith("Día N") || normalizedLine.startsWith("Dia N")) {
      section = PANORAMA_SECTION.DAY;
      dayMetric = null;
      continue;
    }
    if (normalizedLine.startsWith("Ciudad") || normalizedLine.startsWith("Pais") || normalizedLine.startsWith("País") || normalizedLine.startsWith("ID del país")) {
      section = PANORAMA_SECTION.CITIES;
      continue;
    }
    if (normalizedLine.startsWith("Plataforma")) {
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
    if (section === PANORAMA_SECTION.DAY && dayMetric) {
      const dayIndex = Number.parseInt(values[0] ?? "0", 10);
      if (!Number.isFinite(dayIndex)) continue;
      const value = toNumber(values[1] ?? "0");
      const entry = {
        dayIndex,
        label: `D${dayIndex}`,
        value,
      };
      if (dayMetric === "active") dailyActive.push(entry);
      if (dayMetric === "new") dailyNew.push(entry);
      if (dayMetric === "engagement") dailyEngagement.push(entry);
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
    dailyActive,
    dailyNew,
    dailyEngagement,
    cities,
  };
};
