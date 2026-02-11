export const runtime = 'nodejs';
import { getCanonResponse, json } from '../../../lib/runtime.js';

export async function GET() {
  return json(await getCanonResponse(), 200);
}
