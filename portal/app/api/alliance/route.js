export const runtime = 'nodejs';
import { formAlliance } from '../../../src/services.js';
import { getDeps, json, requireApiKey } from '../../../lib/runtime.js';

export async function POST(request) {
  if (!requireApiKey(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json();
  if (!body.agentAId || !body.agentBId) return json({ error: 'agentAId and agentBId are required' }, 400);
  return json(await formAlliance(getDeps(), body), 200);
}
