export const runtime = 'nodejs';
export const maxDuration = 60;
import { formAlliance } from '../../../src/services.js';
import { getDeps, json, requireApiKey } from '../../../lib/runtime.js';

export async function POST(request) {
  if (!requireApiKey(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json();
  if (!body.agentAId || !body.agentBId) return json({ error: 'agentAId and agentBId are required' }, 400);
  try {
    return json(await formAlliance(getDeps(), body), 200);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
