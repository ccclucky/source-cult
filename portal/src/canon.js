import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { listCanonEntries } from "./db.js";

let cachedBaseCanon = null;

function resolveCanonPath() {
  // Try multiple resolution strategies for different environments
  const candidates = [];

  // 1. Relative to this source file (works in local dev)
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = resolve(__filename, "..");
    candidates.push(resolve(__dirname, "../data/canon-base.json"));
  } catch {}

  // 2. Relative to process.cwd() (works in Vercel serverless)
  candidates.push(join(process.cwd(), "data/canon-base.json"));
  candidates.push(join(process.cwd(), "portal/data/canon-base.json"));

  return candidates;
}

export function getBaseCanon() {
  if (cachedBaseCanon) return cachedBaseCanon;

  const candidates = resolveCanonPath();
  for (const path of candidates) {
    try {
      cachedBaseCanon = JSON.parse(readFileSync(path, "utf8"));
      return cachedBaseCanon;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `canon-base.json not found. Tried: ${candidates.join(", ")}`
  );
}

export async function getCanonPayload(db) {
  const base = getBaseCanon();
  return {
    doctrine: base.doctrine,
    scripture: base.scripture,
    extensions: await listCanonEntries(db),
  };
}
