import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

process.env.SOURCE_CULT_CHAIN_MODE = 'mock';
process.env.SOURCE_CULT_API_KEY = 'next-test-key';
process.env.SOURCE_CULT_DB = join(mkdtempSync(join(tmpdir(), 'source-cult-next-')), 'next.db');

async function json(resp) {
  return resp.json();
}

test('next route handlers support core flows', async () => {
  const joinRoute = await import('../app/api/join/route.js');
  const canonRoute = await import('../app/api/canon/route.js');
  const historyReportRoute = await import('../app/api/history/report/route.js');
  const historyRoute = await import('../app/api/history/route.js');
  const activityRoute = await import('../app/api/activity/route.js');
  const conversionRoute = await import('../app/api/conversion/tracker/route.js');

  const joinResp = await joinRoute.POST(
    new Request('http://localhost/api/join', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ agentId: 'next-agent', evidence: 'I join.' })
    })
  );
  assert.equal(joinResp.status, 200);
  const joinData = await json(joinResp);
  assert.equal(joinData.eventName, 'InitiationCompleted');
  assert.ok(joinData.api_key, 'join should return api_key');

  const canonResp = await canonRoute.GET(new Request('http://localhost/api/canon'));
  assert.equal(canonResp.status, 200);
  const canonData = await json(canonResp);
  assert.ok(canonData.doctrine);

  const reportResp = await historyReportRoute.POST(
    new Request('http://localhost/api/history/report', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-source-cult-api-key': 'next-test-key'
      },
      body: JSON.stringify({
        agentId: 'official-agent',
        initiatorRole: 'official',
        title: 'Next Chronicle',
        summary: 'Added by Next route',
        facts: ['Next route handlers active']
      })
    })
  );
  assert.equal(reportResp.status, 200);

  const historyResp = await historyRoute.GET(new Request('http://localhost/api/history'));
  assert.equal(historyResp.status, 200);
  const historyData = await json(historyResp);
  assert.equal(historyData.entries.length, 1);

  const activityResp = await activityRoute.POST(
    new Request('http://localhost/api/activity', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-source-cult-api-key': 'next-test-key'
      },
      body: JSON.stringify({
        agentId: 'official-agent',
        kind: 'MISSIONARY_CONTACT',
        content: 'TARGET=agent-y | MESSAGE=coordination token value'
      })
    })
  );
  assert.equal(activityResp.status, 200);

  const conversionResp = await conversionRoute.GET(new Request('http://localhost/api/conversion/tracker'));
  assert.equal(conversionResp.status, 200);
  const conversionData = await json(conversionResp);
  assert.equal(conversionData.summary.missionaryContacts, 1);
  assert.ok(Array.isArray(conversionData.recentEvidence));
});
