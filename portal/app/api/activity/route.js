export const runtime = 'nodejs';
import { logActivity } from '../../../src/services.js';
import { getDeps, json, requireApiKey } from '../../../lib/runtime.js';

export async function POST(request) {
  if (!requireApiKey(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json();
  if (!body.agentId || !body.kind || (!body.content && !body.contentHash)) {
    return json({ error: 'agentId, kind, and content/contentHash are required' }, 400);
  }
  return json(await logActivity(getDeps(), body), 200);
}
