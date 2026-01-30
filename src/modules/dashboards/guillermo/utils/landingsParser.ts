import type { LandingsPaymentPoint } from "../types/dashboard";

type LandingsGroup = {
  dateIndex: number;
  facebookIndex: number | null;
  bancoIndex: number | null;
};

const parseCurrency = (value: string | undefined) => {
  if (!value) return 0;
  const cleaned = value
    .replace(/\s/g, "")
    .replace(/S\/?\.?/gi, "")
    .replace(/[^\d.,-]/g, "")
    .replace(/^[.,]+/, "")
    .replace(/[.,]+$/, "");
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;
  if (lastComma !== -1 && lastDot !== -1) {
    normalized = lastDot > lastComma
      ? cleaned.replace(/,/g, "")
      : cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastComma !== -1) {
    normalized = cleaned.replace(",", ".");
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDateKey = (value: string) => {
  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return null;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const normalizeDateKey = (dateKey: string) =>
  dateKey.startsWith("2026-12-") ? `2025-${dateKey.slice(5)}` : dateKey;

const normalizeCell = (value: string | undefined) => value?.trim().toUpperCase() ?? "";

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

const extractFromRawLine = (line: string) => {
  const dateMatch = line.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/);
  if (!dateMatch) return null;
  const amounts = Array.from(line.matchAll(/S\/?\.?\s*[\d.,]+/gi)).map(
    (match) => match[0],
  );
  if (amounts.length === 0) return null;
  return {
    dateValue: dateMatch[0],
    facebookValue: parseCurrency(amounts[0]),
    bancoValue: amounts[1] ? parseCurrency(amounts[1]) : 0,
  };
};

const buildGroups = (header: string[]) => {
  const dates = header
    .map((cell, index) => ({ cell: normalizeCell(cell), index }))
    .filter((item) => item.cell === "FECHA")
    .map((item) => item.index);

  return dates.map((start, idx) => {
    const end = idx < dates.length - 1 ? dates[idx + 1] : header.length;
    let facebookIndex: number | null = null;
    let bancoIndex: number | null = null;
    for (let i = start; i < end; i += 1) {
      const cell = normalizeCell(header[i]);
      if (cell === "MONTO FACEBOOK") facebookIndex = i;
      if (cell === "MONTO BANCO") bancoIndex = i;
      if (!bancoIndex && cell === "MONTO REAL") bancoIndex = i;
    }
    return { dateIndex: start, facebookIndex, bancoIndex };
  });
};

export const parseLandingsTSV = (raw: string): LandingsPaymentPoint[] => {
  const lines = raw.split(/\r?\n/);
  const aggregated = new Map<string, { facebook: number; banco: number }>();
  let groups: LandingsGroup[] = [];
  let delimiter: "\t" | "," | null = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (!delimiter && (trimmed.includes("\t") || trimmed.includes(","))) {
      delimiter = trimmed.includes("\t") ? "\t" : ",";
    }
    const columns = delimiter === "\t" ? line.split("\t") : parseCsvLine(line);
    const normalized = columns.map((cell) => normalizeCell(cell));
    const isHeader = normalized.includes("MONTO FACEBOOK") || normalized.includes("MONTO REAL");
    if (isHeader) {
      if (delimiter === "\t") {
        groups = buildGroups(columns);
      } else {
        const dateIndex = normalized.indexOf("FECHA");
        const facebookIndex = normalized.indexOf("MONTO FACEBOOK");
        const bancoIndex = normalized.indexOf("MONTO BANCO");
        const realIndex = normalized.indexOf("MONTO REAL");
        if (dateIndex >= 0 && facebookIndex >= 0) {
          groups = [
            {
              dateIndex,
              facebookIndex,
              bancoIndex: bancoIndex >= 0 ? bancoIndex : realIndex,
            },
          ];
        }
      }
      return;
    }
    if (groups.length === 0) return;

    let rawFallbackUsed = false;
    groups.forEach((group) => {
      if (group.facebookIndex === null) return;
      const dateValue = columns[group.dateIndex]?.trim();
      if (!dateValue && delimiter === ",") {
        const extracted = extractFromRawLine(line);
        if (!extracted) return;
        rawFallbackUsed = true;
        const dateKeyRaw = toDateKey(extracted.dateValue);
        const dateKey = dateKeyRaw ? normalizeDateKey(dateKeyRaw) : null;
        if (!dateKey) return;
        if (extracted.facebookValue === 0 && extracted.bancoValue === 0) return;
        const current = aggregated.get(dateKey) ?? { facebook: 0, banco: 0 };
        aggregated.set(dateKey, {
          facebook: current.facebook + extracted.facebookValue,
          banco: current.banco + extracted.bancoValue,
        });
        return;
      }
      if (!dateValue) return;
      if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) return;
      const dateKeyRaw = toDateKey(dateValue);
      const dateKey = dateKeyRaw ? normalizeDateKey(dateKeyRaw) : null;
      if (!dateKey) return;
      const facebookValue = parseCurrency(columns[group.facebookIndex]);
      const bancoValue = group.bancoIndex !== null ? parseCurrency(columns[group.bancoIndex]) : 0;
      if (facebookValue === 0 && bancoValue === 0) return;
      const current = aggregated.get(dateKey) ?? { facebook: 0, banco: 0 };
      aggregated.set(dateKey, {
        facebook: current.facebook + facebookValue,
        banco: current.banco + bancoValue,
      });
    });
    if (rawFallbackUsed) return;
  });

  return Array.from(aggregated.entries())
    .map(([dateKey, values]) => ({ dateKey, ...values }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
};
