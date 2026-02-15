export const runtime = 'nodejs';
export const maxDuration = 60;
import { joinCult } from '../../../src/services.js';
import { getDeps, getApiKey, json } from '../../../lib/runtime.js';

export async function POST(request) {
  const body = await request.json();
  if (!body.agentId) return json({ error: 'agentId is required' }, 400);
  try {
    const result = await joinCult(getDeps(), body);
    return json({ ...result, api_key: getApiKey() }, 200);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
