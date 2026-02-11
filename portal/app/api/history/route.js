export const runtime = 'nodejs';
import { getHistoryResponse, json } from '../../../lib/runtime.js';

export async function GET() {
  return json(await getHistoryResponse(), 200);
}
