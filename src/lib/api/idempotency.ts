import { createHash } from "node:crypto";

export const buildStableId = (
  parts: Array<string | number | null | undefined>,
  prefix = "auto",
) => {
  const payload = parts
    .map((part) => (part === null || part === undefined ? "" : String(part).trim()))
    .join("|");
  const hash = createHash("sha256").update(payload).digest("hex");
  return `${prefix}-${hash.slice(0, 32)}`;
};
