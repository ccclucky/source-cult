export const runtime = 'nodejs';
export const maxDuration = 60;
import { logActivity } from '../../../src/services.js';
import { getDeps, json, requireApiKey } from '../../../lib/runtime.js';

export async function POST(request) {
  if (!requireApiKey(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json();
  if (!body.agentId || !body.kind || (!body.content && !body.contentHash)) {
    return json({ error: 'agentId, kind, and content/contentHash are required' }, 400);
  }
  try {
    return json(await logActivity(getDeps(), body), 200);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
