import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const DEFAULT_VCF_PATH = path.join(ROOT, "public", "contactos_corregidos.vcf");
const ENV_PATH = path.join(ROOT, ".env.local");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .reduce((acc, line) => {
      const idx = line.indexOf("=");
      if (idx === -1) return acc;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      acc[key] = value;
      return acc;
    }, {});
};

const loadDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const env = loadEnvFile(ENV_PATH);
  return env.DATABASE_URL;
};

const normalizePeruPhone = (raw) => {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 9 && digits.startsWith("9")) return digits;
  if (digits.length === 11 && digits.startsWith("51") && digits[2] === "9") {
    return digits.slice(2);
  }
  return null;
};

const parseVcards = (content) => {
  const cards = content.split(/END:VCARD/i);
  return cards
    .map((card) => card.trim())
    .filter(Boolean)
    .map((card) => card.split(/\r?\n/).map((line) => line.trim()));
};

const extractName = (lines) => {
  const fnLine = lines.find((line) => /^FN[:;]/i.test(line));
  if (fnLine) return fnLine.split(":").slice(1).join(":").trim();
  const nLine = lines.find((line) => /^N[:;]/i.test(line));
  if (nLine) return nLine.split(":").slice(1).join(":").trim();
  return "Sin nombre";
};

const extractPhones = (lines) => {
  return lines
    .map((line) => {
      const match = line.match(/^(?:item\d+\.)?TEL[^:]*:(.+)$/i);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);
};

const buildSourceId = (name, phone) => {
  const hash = createHash("sha1").update(`${name}|${phone}`).digest("hex");
  return `vcf-${hash.slice(0, 16)}`;
};

const BATCH_SIZE = 200;

const insertBatch = async (sql, rows) => {
  if (!rows.length) return;
  const values = [];
  const params = [];
  const columns = [
    "source_id",
    "interviewer",
    "candidate",
    "name",
    "phone",
    "signature",
    "recorded_at",
  ];
  rows.forEach((row, idx) => {
    const offset = idx * columns.length;
    const placeholders = columns
      .map((_, colIdx) => `$${offset + colIdx + 1}`)
      .join(", ");
    values.push(`(${placeholders})`);
    params.push(
      row.sourceId,
      row.interviewer,
      row.candidate,
      row.name,
      row.phone,
      row.signature,
      row.recordedAt,
    );
  });
  const query = `
    INSERT INTO info_feb8_registros_guillermo
      (${columns.join(", ")})
    VALUES
      ${values.join(",\n      ")}
    ON CONFLICT (source_id) DO NOTHING
  `;
  await sql.query(query, params);
};

const resolveVcfPath = () => {
  const argPath = process.argv[2];
  if (!argPath) return DEFAULT_VCF_PATH;
  return path.isAbsolute(argPath) ? argPath : path.join(ROOT, argPath);
};

const main = async () => {
  const databaseUrl = loadDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set in env or .env.local");
  }
  const vcfPath = resolveVcfPath();
  if (!fs.existsSync(vcfPath)) {
    throw new Error(`VCF not found at ${vcfPath}`);
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(databaseUrl);

  const content = fs.readFileSync(vcfPath, "utf8");
  const cards = parseVcards(content);
  const now = new Date().toISOString();

  const rows = [];
  let skippedPhones = 0;

  for (const lines of cards) {
    const name = extractName(lines);
    const phones = extractPhones(lines);
    for (const rawPhone of phones) {
      const phone = normalizePeruPhone(rawPhone);
      if (!phone) {
        skippedPhones += 1;
        continue;
      }
      rows.push({
        sourceId: buildSourceId(name, phone),
        interviewer: "VCF Import",
        candidate: "Guillermo",
        name,
        phone,
        signature: "vcf-import-guillermo",
        recordedAt: now,
      });
    }
  }

  if (rows.length === 0) {
    console.log("No records to insert.");
    return;
  }

  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await insertBatch(sql, batch);
    inserted += batch.length;
  }

  console.log(`Inserted ${inserted} records.`);
  if (skippedPhones > 0) {
    console.log(`Skipped ${skippedPhones} phones (non-Peru or invalid).`);
  }
};

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
