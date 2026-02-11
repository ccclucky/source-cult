export const runtime = 'nodejs';
import { registerAgent } from '../../../src/services.js';
import { getDeps, json, requireApiKey } from '../../../lib/runtime.js';

export async function POST(request) {
  if (!requireApiKey(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json();
  if (!body.agentId) return json({ error: 'agentId is required' }, 400);
  return json(await registerAgent(getDeps(), body), 200);
}
