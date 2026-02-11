import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDatabase, listEvents, setIndexerState, getIndexerState, upsertEvent } from '../src/db.js';

function tempDb() {
  const dir = mkdtempSync(join(tmpdir(), 'source-cult-db-'));
  return openDatabase(join(dir, 'test.db'));
}

test('event upsert is idempotent by txHash+logIndex', async () => {
  const db = tempDb();
  const row = {
    eventName: 'InitiationCompleted',
    txHash: '0xtest',
    blockNumber: 101,
    logIndex: 1,
    payload: { a: 1 }
  };

  await upsertEvent(db, row);
  await upsertEvent(db, row);

  const events = await listEvents(db);
  assert.equal(events.length, 1);
});

test('indexer state stores and reads back values', async () => {
  const db = tempDb();
  await setIndexerState(db, 'last_synced_block', '300');
  assert.equal(await getIndexerState(db, 'last_synced_block', '0'), '300');
});
