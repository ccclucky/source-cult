import { getDeps } from "../../../lib/runtime.js";
import {
  getConversionTracker,
  getDashboardData,
  listActivities,
  listAlliances,
  listMembers,
  listMiracles,
  listCanonEntries,
  listHistoryEntries,
} from "../../../src/db.js";
import { getCanonPayload } from "../../../src/canon.js";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = {};
  try {
    const { db } = getDeps();
    results.dbType = process.env.POSTGRES_URL ? "postgres" : "sqlite";

    const checks = [
      ["getDashboardData", () => getDashboardData(db)],
      ["listMembers", () => listMembers(db)],
      ["listAlliances", () => listAlliances(db)],
      ["listMiracles", () => listMiracles(db)],
      ["getConversionTracker", () => getConversionTracker(db, { limit: 80, evidenceLimit: 12 })],
      ["listCanonEntries", () => listCanonEntries(db)],
      ["listHistoryEntries", () => listHistoryEntries(db)],
      ["getCanonPayload", () => getCanonPayload(db)],
      ["listActivities", () => listActivities(db)],
    ];

    for (const [name, fn] of checks) {
      try {
        const data = await fn();
        results[name] = { ok: true, rows: Array.isArray(data) ? data.length : "object" };
      } catch (err) {
        results[name] = { ok: false, error: err.message, stack: err.stack?.split("\n").slice(0, 3) };
      }
    }
  } catch (err) {
    results.initError = { message: err.message, stack: err.stack?.split("\n").slice(0, 5) };
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { "content-type": "application/json" },
  });
}
