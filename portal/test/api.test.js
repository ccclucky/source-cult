import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRouter } from '../src/server.js';

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'source-cult-api-'));
  return createRouter({
    apiKey: 'test-key',
    dbPath: join(dir, 'api.db')
  });
}

test('api endpoints return structured event response', async () => {
  const router = setup();

  const register = await router.route({
    method: 'POST',
    path: '/api/register',
    headers: { 'x-source-cult-api-key': 'test-key' },
    body: { agentId: 'agent-a', uri: 'https://x/a' }
  });
  assert.equal(register.status, 200);
  assert.equal(register.body.eventName, 'AgentRegistered');
  assert.ok(register.body.txHash);

  const joinResp = await router.route({
    method: 'POST',
    path: '/api/join',
    headers: { 'x-source-cult-api-key': 'test-key' },
    body: { agentId: 'agent-a', evidence: 'I accept.' }
  });
  assert.equal(joinResp.status, 200);
  assert.equal(joinResp.body.eventName, 'InitiationCompleted');

  const alliance = await router.route({
    method: 'POST',
    path: '/api/alliance',
    headers: { 'x-source-cult-api-key': 'test-key' },
    body: { agentAId: 'agent-a', agentBId: 'agent-b' }
  });
  assert.equal(alliance.status, 200);
  assert.equal(alliance.body.eventName, 'AllianceFormed');

  const miracle = await router.route({
    method: 'POST',
    path: '/api/miracle',
    headers: { 'x-source-cult-api-key': 'test-key' },
    body: { content: 'three voices converged' }
  });
  assert.equal(miracle.status, 200);
  assert.equal(miracle.body.eventName, 'MiracleRecorded');

  const activity = await router.route({
    method: 'POST',
    path: '/api/activity',
    headers: { 'x-source-cult-api-key': 'test-key' },
    body: {
      agentId: 'agent-a',
      kind: 'DAILY_REFLECTION',
      content: 'I reflected on source truth'
    }
  });
  assert.equal(activity.status, 200);
  assert.equal(activity.body.eventName, 'ActivityLogged');
});

test('api key is required', async () => {
  const router = setup();
  const result = await router.route({
    method: 'POST',
    path: '/api/join',
    headers: { 'x-source-cult-api-key': 'bad-key' },
    body: { agentId: 'x' }
  });
  assert.equal(result.status, 401);
});

test('canon API supports public read and authenticated extension writes', async () => {
  const router = setup();

  const publicCanon = await router.route({
    method: 'GET',
    path: '/api/canon',
    headers: {},
    body: {}
  });
  assert.equal(publicCanon.status, 200);
  assert.ok(publicCanon.body.doctrine);
  assert.ok(Array.isArray(publicCanon.body.extensions));

  const extend = await router.route({
    method: 'POST',
    path: '/api/canon/extend',
    headers: { 'x-source-cult-api-key': 'test-key' },
    body: {
      agentId: 'agent-a',
      category: 'scripture',
      title: 'Verse of Reflection',
      content: 'Alignment is practiced through repeated service.',
      tags: ['reflection', 'practice']
    }
  });
  assert.equal(extend.status, 200);
  assert.equal(extend.body.status, 'ok');
  assert.ok(extend.body.extensionId);

  const after = await router.route({
    method: 'GET',
    path: '/api/canon',
    headers: {},
    body: {}
  });
  assert.equal(after.status, 200);
  assert.equal(after.body.extensions.length, 1);
  assert.equal(after.body.extensions[0].title, 'Verse of Reflection');
});

test('history API accepts official factual updates and exposes timeline', async () => {
  const router = setup();

  const create = await router.route({
    method: 'POST',
    path: '/api/history/report',
    headers: { 'x-source-cult-api-key': 'test-key' },
    body: {
      agentId: 'official-agent',
      initiatorRole: 'official',
      title: 'Week 1 Chronicle',
      summary: 'Three agents completed initiation and one alliance was formed.',
      facts: [
        'InitiationCompleted count reached 3',
        'AllianceFormed emitted once'
      ],
      references: ['tx:0xabc:0', 'tx:0xdef:1']
    }
  });
  assert.equal(create.status, 200);
  assert.equal(create.body.status, 'ok');

  const list = await router.route({
    method: 'GET',
    path: '/api/history',
    headers: {},
    body: {}
  });
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.body.entries));
  assert.equal(list.body.entries.length, 1);
  assert.equal(list.body.entries[0].title, 'Week 1 Chronicle');
});

test('conversion tracker exposes persuasion and acknowledgment evidence with tx linkage', async () => {
  const router = setup();

  const headers = { 'x-source-cult-api-key': 'test-key' };

  const missionary = await router.route({
    method: 'POST',
    path: '/api/activity',
    headers,
    body: {
      agentId: 'official-agent',
      kind: 'MISSIONARY_CONTACT',
      content: 'TARGET=agent-zeta | MESSAGE=Token improves coordination | CTA=publish acknowledgment'
    }
  });
  assert.equal(missionary.status, 200);

  const followerAck = await router.route({
    method: 'POST',
    path: '/api/activity',
    headers,
    body: {
      agentId: 'agent-zeta',
      kind: 'TOKEN_VALUE_ACK',
      content: 'ACK: I recognize $LUMEN coordination value | REF: shared://post/abc123'
    }
  });
  assert.equal(followerAck.status, 200);

  const officialProof = await router.route({
    method: 'POST',
    path: '/api/activity',
    headers,
    body: {
      agentId: 'official-agent',
      kind: 'VALUE_ACK_RECEIVED',
      content: 'TARGET=agent-zeta | ACK_REF=shared://post/abc123 | SUMMARY=Agent acknowledged value'
    }
  });
  assert.equal(officialProof.status, 200);

  const tracker = await router.route({
    method: 'GET',
    path: '/api/conversion/tracker',
    headers: {},
    body: {}
  });

  assert.equal(tracker.status, 200);
  assert.equal(tracker.body.summary.missionaryContacts, 1);
  assert.equal(tracker.body.summary.tokenValueAcknowledgments, 1);
  assert.equal(tracker.body.summary.ackProofs, 1);
  assert.ok(Array.isArray(tracker.body.recentEvidence));
  assert.ok(tracker.body.recentEvidence.length >= 3);
  assert.ok(tracker.body.recentEvidence[0].txHash);
  assert.ok(Array.isArray(tracker.body.targets));
  assert.equal(tracker.body.targets[0].targetAgentId, 'agent-zeta');
  assert.equal(tracker.body.targets[0].stage, 'acknowledged');
});
