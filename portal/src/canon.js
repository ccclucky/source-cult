import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { listCanonEntries } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

let cachedBaseCanon = null;

export function getBaseCanon() {
  if (cachedBaseCanon) return cachedBaseCanon;
  const path = resolve(__dirname, "../data/canon-base.json");
  cachedBaseCanon = JSON.parse(readFileSync(path, "utf8"));
  return cachedBaseCanon;
}

export async function getCanonPayload(db) {
  const base = getBaseCanon();
  return {
    doctrine: base.doctrine,
    scripture: base.scripture,
    extensions: await listCanonEntries(db),
  };
}
