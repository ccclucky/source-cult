export const runtime = 'nodejs';
import { getStatusResponse, json } from '../../../lib/runtime.js';

export async function GET() {
  return json(await getStatusResponse(), 200);
}
