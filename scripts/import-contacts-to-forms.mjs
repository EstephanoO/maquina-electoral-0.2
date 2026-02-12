import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { neon } from "@neondatabase/serverless";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const vcfPath = path.join(rootDir, "public", "contacts.vcf");

const databaseUrl = process.env.DATABASE_URL2 ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL2 or DATABASE_URL is not set");
}

const sql = neon(databaseUrl);

const decodeQuotedPrintable = (value) => {
  const normalized = value.replace(/=\r?\n/g, "");
  return normalized.replace(/=([A-F0-9]{2})/gi, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
};

const normalizePhone = (value) => value.replace(/\D/g, "");

const parseCards = (content) => {
  const cards = content.split(/END:VCARD/gi);
  return cards
    .map((card) => card.trim())
    .filter(Boolean)
    .map((card) => card.split(/\r?\n/));
};

const extractValue = (line) => {
  const idx = line.indexOf(":");
  if (idx === -1) return "";
  return line.slice(idx + 1).trim();
};

const pickTel = (lines) => {
  const telLines = lines.filter((line) => line.toUpperCase().startsWith("TEL"));
  if (telLines.length === 0) return "";
  const cell = telLines.find((line) => line.toUpperCase().includes("CELL"));
  return extractValue(cell ?? telLines[0]);
};

const pickName = (lines) => {
  const fnLine = lines.find((line) => line.toUpperCase().startsWith("FN"));
  if (!fnLine) return "Sin nombre";
  if (fnLine.toUpperCase().includes("ENCODING=QUOTED-PRINTABLE")) {
    return decodeQuotedPrintable(extractValue(fnLine));
  }
  return extractValue(fnLine) || "Sin nombre";
};

const loadContacts = async () => {
  const raw = await fs.readFile(vcfPath, "utf8");
  const cards = parseCards(raw);
  return cards
    .map((lines) => {
      const name = pickName(lines).trim();
      const tel = pickTel(lines);
      const phone = normalizePhone(tel);
      return {
        name: name || "Sin nombre",
        phone,
      };
    })
    .filter((contact) => contact.phone.length > 0);
};

const chunk = (items, size) => {
  const result = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
};

const run = async () => {
  const contacts = await loadContacts();
  const batches = chunk(contacts, 100);
  let inserted = 0;

  for (const batch of batches) {
    await Promise.all(
      batch.map((contact) =>
        sql`
          INSERT INTO public.forms (
            nombre,
            telefono,
            fecha,
            x,
            y,
            zona,
            candidate,
            encuestador,
            encuestador_id,
            candidato_preferido,
            client_id
          )
          VALUES (
            ${contact.name},
            ${contact.phone},
            now(),
            0,
            0,
            'AGENDA',
            'Giovanna Castagnino',
            'agenda',
            'agenda',
            'Sin dato',
            NULL
          );
        `,
      ),
    );
    inserted += batch.length;
  }

  console.log(`Inserted ${inserted} contacts into forms.`);
};

run();
