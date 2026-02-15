export const runtime = 'nodejs';
export const maxDuration = 60;
import { extendCanon } from '../../../../src/services.js';
import { getDeps, json, requireApiKey } from '../../../../lib/runtime.js';

export async function POST(request) {
  if (!requireApiKey(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json();
  if (!body.agentId || !body.category || !body.title || !body.content) {
    return json({ error: 'agentId, category, title, and content are required' }, 400);
  }
  try {
    return json(await extendCanon(getDeps(), body), 200);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
