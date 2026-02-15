import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDatabase, listEvents } from '../src/db.js';
import { replayLogs } from '../src/replay.js';

function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), 'source-cult-replay-'));
  return openDatabase(join(dir, 'replay.db'));
}

test('replay is idempotent for duplicate logs', async () => {
  const db = tempDb();
  const logs = [
    {
      eventName: 'InitiationCompleted',
      txHash: '0x1',
      blockNumber: 100,
      logIndex: 0,
      payload: { agentIdHash: '0xa' }
    }
  ];

  await replayLogs(db, logs);
  await replayLogs(db, logs);

  const events = await listEvents(db);
  assert.equal(events.length, 1);
});
