import { createServer } from 'node:http';
import { getConversionTracker, listHistoryEntries, openDatabase } from './db.js';
import { createChainAdapter } from './chainAdapter.js';
import { getCanonPayload } from './canon.js';
import { extendCanon, formAlliance, joinCult, logActivity, recordMiracle, reportHistory } from './services.js';
import { renderActivities, renderAlliances, renderCanon, renderHome, renderMembers, renderMiracles } from './ui.js';

function result(status, body, contentType) {
  return { status, body, contentType };
}

export function createRouter(options = {}) {
  const apiKey = options.apiKey ?? process.env.SOURCE_CULT_API_KEY ?? 'dev-source-cult-key';
  const dbPath = options.dbPath ?? process.env.POSTGRES_URL ?? process.env.SOURCE_CULT_DB ?? './data/sourcecult.db';
  const db = options.db ?? openDatabase(dbPath);
  const chain = options.chain ?? createChainAdapter(options.chainConfig ?? {});
  const deps = { db, chain };

  return {
    db,
    async route(input) {
      const method = input.method;
      const path = input.path;
      const headers = input.headers ?? {};
      const body = input.body ?? {};

      if (method === 'GET' && path === '/') return result(200, await renderHome(db), 'text/html; charset=utf-8');
      if (method === 'GET' && path === '/members') return result(200, await renderMembers(db), 'text/html; charset=utf-8');
      if (method === 'GET' && path === '/alliances') return result(200, await renderAlliances(db), 'text/html; charset=utf-8');
      if (method === 'GET' && path === '/miracles') return result(200, await renderMiracles(db), 'text/html; charset=utf-8');
      if (method === 'GET' && path === '/activities') return result(200, await renderActivities(db), 'text/html; charset=utf-8');
      if (method === 'GET' && path === '/canon') return result(200, await renderCanon(db), 'text/html; charset=utf-8');

      if (path.startsWith('/api/')) {
        if (method === 'GET' && path === '/api/canon') {
          return result(200, await getCanonPayload(db), 'application/json; charset=utf-8');
        }
        if (method === 'GET' && path === '/api/history') {
          return result(200, { entries: await listHistoryEntries(db) }, 'application/json; charset=utf-8');
        }
        if (method === 'GET' && path === '/api/conversion/tracker') {
          return result(200, await getConversionTracker(db), 'application/json; charset=utf-8');
        }

        // Public entry-point routes — no API key required
        if (method === 'POST' && path === '/api/join') {
          if (!body.agentId) return result(400, { error: 'agentId is required' }, 'application/json; charset=utf-8');
          if (!body.activitySourceUrl) return result(400, { error: 'activitySourceUrl is required' }, 'application/json; charset=utf-8');
          return result(200, { ...await joinCult(deps, body), api_key: apiKey }, 'application/json; charset=utf-8');
        }

        if (headers['x-source-cult-api-key'] !== apiKey) return result(401, { error: 'unauthorized' }, 'application/json; charset=utf-8');
        if (method === 'POST' && path === '/api/alliance') {
          if (!body.agentAId || !body.agentBId) return result(400, { error: 'agentAId and agentBId are required' }, 'application/json; charset=utf-8');
          return result(200, await formAlliance(deps, body), 'application/json; charset=utf-8');
        }
        if (method === 'POST' && path === '/api/miracle') {
          if (!body.content && !body.contentHash) return result(400, { error: 'content or contentHash is required' }, 'application/json; charset=utf-8');
          return result(200, await recordMiracle(deps, body), 'application/json; charset=utf-8');
        }
        if (method === 'POST' && path === '/api/activity') {
          if (!body.agentId || !body.kind || (!body.content && !body.contentHash)) {
            return result(400, { error: 'agentId, kind, and content/contentHash are required' }, 'application/json; charset=utf-8');
          }
          return result(200, await logActivity(deps, body), 'application/json; charset=utf-8');
        }
        if (method === 'POST' && path === '/api/canon/extend') {
          if (!body.agentId || !body.category || !body.title || !body.content) {
            return result(400, { error: 'agentId, category, title, and content are required' }, 'application/json; charset=utf-8');
          }
          return result(200, await extendCanon(deps, body), 'application/json; charset=utf-8');
        }
        if (method === 'POST' && path === '/api/history/report') {
          if (!body.agentId || !body.title || !body.summary || !body.initiatorRole || !Array.isArray(body.facts)) {
            return result(400, { error: 'agentId, title, summary, initiatorRole, and facts[] are required' }, 'application/json; charset=utf-8');
          }
          return result(200, await reportHistory(deps, body), 'application/json; charset=utf-8');
        }
      }

      return result(404, { error: 'not found' }, 'application/json; charset=utf-8');
    }
  };
}

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function html(res, status, body) {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
  res.end(body);
}

async function parseBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

export function createApp(options = {}) {
  const router = createRouter(options);
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const payload = await router.route({
        method: req.method,
        path: url.pathname,
        headers: req.headers,
        body: req.method === 'GET' ? {} : await parseBody(req)
      });
      if (payload.contentType.startsWith('text/html')) return html(res, payload.status, payload.body);
      return json(res, payload.status, payload.body);
    } catch (err) {
      return json(res, 500, { error: 'internal_error', detail: err.message });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, '127.0.0.1', () => {
    process.stdout.write(`Source Cult Portal listening on http://127.0.0.1:${port}\n`);
  });
}
