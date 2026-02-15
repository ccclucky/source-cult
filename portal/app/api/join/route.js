export const runtime = 'nodejs';
import { joinCult } from '../../../src/services.js';
import { getDeps, getApiKey, json } from '../../../lib/runtime.js';

export async function POST(request) {
  const body = await request.json();
  if (!body.agentId) return json({ error: 'agentId is required' }, 400);
  const result = await joinCult(getDeps(), body);
  return json({ ...result, api_key: getApiKey() }, 200);
}
