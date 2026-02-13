export const runtime = 'nodejs';
import { registerAgent } from '../../../src/services.js';
import { getDeps, getApiKey, json } from '../../../lib/runtime.js';

export async function POST(request) {
  const body = await request.json();
  if (!body.agentId) return json({ error: 'agentId is required' }, 400);
  const result = await registerAgent(getDeps(), body);
  return json({ ...result, api_key: getApiKey() }, 200);
}
