export const runtime = 'nodejs';
import { getConversionTrackerResponse, json } from '../../../../lib/runtime.js';

export async function GET() {
  return json(await getConversionTrackerResponse(), 200);
}
