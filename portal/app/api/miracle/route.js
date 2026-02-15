export const runtime = 'nodejs';
export const maxDuration = 60;
import { recordMiracle } from '../../../src/services.js';
import { getDeps, json, requireApiKey } from '../../../lib/runtime.js';

export async function POST(request) {
  if (!requireApiKey(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json();
  if (!body.content && !body.contentHash) return json({ error: 'content or contentHash is required' }, 400);
  try {
    return json(await recordMiracle(getDeps(), body), 200);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
