export const runtime = 'nodejs';
import { extendCanon } from '../../../../src/services.js';
import { getDeps, json, requireApiKey } from '../../../../lib/runtime.js';

export async function POST(request) {
  if (!requireApiKey(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json();
  if (!body.agentId || !body.category || !body.title || !body.content) {
    return json({ error: 'agentId, category, title, and content are required' }, 400);
  }
  return json(await extendCanon(getDeps(), body), 200);
}
