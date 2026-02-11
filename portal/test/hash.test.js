import test from 'node:test';
import assert from 'node:assert/strict';
import { agentIdHash, contentHash, eventId, riteHash } from '../src/hash.js';

test('hash helpers are deterministic and 32-byte hex', () => {
  const a = agentIdHash('agent.alpha');
  const b = agentIdHash('agent.alpha');
  assert.equal(a, b);
  assert.match(a, /^0x[0-9a-f]{64}$/);

  const c = contentHash('hello');
  assert.match(c, /^0x[0-9a-f]{64}$/);

  const r = riteHash('agent.alpha', 'i accept');
  assert.match(r, /^0x[0-9a-f]{64}$/);

  assert.equal(eventId('0xabc', 3), '0xabc:3');
});
