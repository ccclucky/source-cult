export const runtime = 'nodejs';
export const maxDuration = 60;
import { reportHistory } from '../../../../src/services.js';
import { getDeps, json, requireApiKey } from '../../../../lib/runtime.js';

export async function POST(request) {
  if (!requireApiKey(request)) return json({ error: 'unauthorized' }, 401);
  const body = await request.json();
  if (!body.agentId || !body.title || !body.summary || !body.initiatorRole || !Array.isArray(body.facts)) {
    return json({ error: 'agentId, title, summary, initiatorRole, and facts[] are required' }, 400);
  }
  try {
    return json(await reportHistory(getDeps(), body), 200);
  } catch (error) {
    return json({ error: error.message }, 500);
  }
}
