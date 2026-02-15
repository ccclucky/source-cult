import { readFileSync } from 'node:fs';
import { openDatabase, setIndexerState, upsertEvent } from './db.js';
import { nowIso } from './hash.js';

export async function replayLogs(db, logs) {
  for (const log of logs) {
    await upsertEvent(db, {
      eventName: log.eventName ?? 'UnknownEvent',
      txHash: log.txHash,
      blockNumber: Number(log.blockNumber),
      logIndex: Number(log.logIndex),
      payload: log.payload ?? {},
      createdAt: log.createdAt ?? nowIso()
    });
  }

  const latest = logs.reduce((max, l) => Math.max(max, Number(l.blockNumber ?? 0)), 0);
  if (latest > 0) await setIndexerState(db, 'last_synced_block', String(latest));
  return { imported: logs.length, latestBlock: latest };
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--db') args.db = argv[i + 1];
    if (argv[i] === '--logs') args.logs = argv[i + 1];
  }
  return args;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const dbPath = args.db ?? process.env.POSTGRES_URL ?? process.env.SOURCE_CULT_DB ?? './data/sourcecult.db';
  const logsPath = args.logs ?? './data/mock-chain-logs.json';
  const db = openDatabase(dbPath);
  const logs = JSON.parse(readFileSync(logsPath, 'utf8'));
  const result = await replayLogs(db, logs);
  process.stdout.write(`Replay imported ${result.imported} logs, latest block ${result.latestBlock}.\n`);
  process.exit(0);
}
