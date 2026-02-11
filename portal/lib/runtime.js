import { getConversionTracker, openDatabase, listHistoryEntries } from '../src/db.js';
import { createChainAdapter } from '../src/chainAdapter.js';
import { getCanonPayload } from '../src/canon.js';

let deps;

function getDbPath() {
  return process.env.POSTGRES_URL ?? process.env.SOURCE_CULT_DB ?? './data/sourcecult.db';
}

export function getDeps() {
  if (!deps) {
    deps = {
      db: openDatabase(getDbPath()),
      chain: createChainAdapter({})
    };
  }
  return deps;
}

export function getApiKey() {
  return process.env.SOURCE_CULT_API_KEY ?? 'dev-source-cult-key';
}

export function requireApiKey(request) {
  const expected = getApiKey();
  const key = request.headers.get('x-source-cult-api-key');
  return key === expected;
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export async function getCanonResponse() {
  const { db } = getDeps();
  return await getCanonPayload(db);
}

export async function getHistoryResponse() {
  const { db } = getDeps();
  return { entries: await listHistoryEntries(db) };
}

export async function getConversionTrackerResponse() {
  const { db } = getDeps();
  return await getConversionTracker(db);
}
