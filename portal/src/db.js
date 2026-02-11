import pg from "pg";
import { DatabaseSync } from "node:sqlite";
import { eventId, nowIso } from "./hash.js";

const { Pool } = pg;

let pool;
let sqliteDb;

export function openDatabase(connectionString) {
  // Determine DB type:
  // 1. If connectionString starts with postgres -> PG
  // 2. If no connectionString but POSTGRES_URL env var exists -> PG
  // 3. Otherwise -> SQLite
  const usePostgres =
    (connectionString && connectionString.startsWith("postgres")) ||
    (!connectionString && process.env.POSTGRES_URL);

  if (usePostgres) {
    if (!pool) {
      console.log("🔌 Connecting to PostgreSQL database...");
      pool = new Pool({
        connectionString: connectionString || process.env.POSTGRES_URL,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
      });
      initSchema(pool).catch(err => {
        console.error("Failed to initialize PG schema:", err);
      });
    }
    return pool;
  }

  // Fallback to SQLite
  if (!sqliteDb) {
    console.log("📂 Using local SQLite database (Development Mode)...");
    const path =
      connectionString || process.env.SOURCE_CULT_DB || "./data/sourcecult.db";
    sqliteDb = new SqliteAdapter(path);
    initSchema(sqliteDb).catch(err => {
      console.error("Failed to initialize SQLite schema:", err);
    });
  }
  return sqliteDb;
}

class SqliteAdapter {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);
  }

  async query(text, params = []) {
    // Handle schema initialization (raw execution if no params and looks like DDL)
    if (
      params.length === 0 &&
      (text.trim().toUpperCase().startsWith("CREATE") ||
        text.includes("PRAGMA"))
    ) {
      this.db.exec(text);
      return { rows: [], rowCount: 0 };
    }

    // Convert $1, $2... to ? for prepared statements
    const sql = text.replace(/\$\d+/g, "?");
    const stmt = this.db.prepare(sql);

    // Determine if it's a SELECT query
    if (/^\s*SELECT/i.test(sql)) {
      const rows = stmt.all(...params);
      return { rows, rowCount: rows.length };
    } else {
      const result = stmt.run(...params);
      return { rows: [], rowCount: result.changes };
    }
  }
}

async function initSchema(db) {
  const schema = `
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL UNIQUE,
      agent_id_hash TEXT NOT NULL,
      uri TEXT,
      tx_hash TEXT,
      block_number INTEGER,
      log_index INTEGER,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL UNIQUE,
      agent_id_hash TEXT NOT NULL,
      rite_hash TEXT NOT NULL,
      uri TEXT,
      tx_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      log_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (tx_hash, log_index)
    );

    CREATE TABLE IF NOT EXISTS alliances (
      id TEXT PRIMARY KEY,
      agent_a_id TEXT NOT NULL,
      agent_b_id TEXT NOT NULL,
      a_id_hash TEXT NOT NULL,
      b_id_hash TEXT NOT NULL,
      uri TEXT,
      tx_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      log_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (tx_hash, log_index)
    );

    CREATE TABLE IF NOT EXISTS miracles (
      id TEXT PRIMARY KEY,
      content_hash TEXT NOT NULL,
      uri TEXT,
      tx_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      log_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (tx_hash, log_index)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      agent_id_hash TEXT NOT NULL,
      kind TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      uri TEXT,
      tx_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      log_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (tx_hash, log_index)
    );

    CREATE TABLE IF NOT EXISTS activity_contents (
      event_id TEXT PRIMARY KEY,
      content_text TEXT,
      source_ref TEXT,
      meta_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      event_name TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      log_index INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (tx_hash, log_index)
    );

    CREATE TABLE IF NOT EXISTS canon_entries (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      contributor_agent_id TEXT NOT NULL,
      tags_json TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      log_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (tx_hash, log_index)
    );

    CREATE TABLE IF NOT EXISTS history_entries (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      facts_json TEXT NOT NULL,
      references_json TEXT NOT NULL,
      reporter_agent_id TEXT NOT NULL,
      initiator_role TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      log_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (tx_hash, log_index)
    );

    CREATE TABLE IF NOT EXISTS indexer_state (
      state_key TEXT PRIMARY KEY,
      state_value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;

  await db.query(schema);
}

export async function insertAgent(db, row) {
  await db.query(
    `
    INSERT INTO agents (id, agent_id, agent_id_hash, uri, tx_hash, block_number, log_index, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (agent_id) DO UPDATE SET
      agent_id_hash=excluded.agent_id_hash,
      uri=excluded.uri,
      tx_hash=excluded.tx_hash,
      block_number=excluded.block_number,
      log_index=excluded.log_index
  `,
    [
      eventId(row.txHash, row.logIndex),
      row.agentId,
      row.agentIdHash,
      row.uri ?? null,
      row.txHash,
      row.blockNumber,
      row.logIndex,
      row.createdAt ?? nowIso(),
    ]
  );
}

export async function upsertMember(db, row) {
  await db.query(
    `
    INSERT INTO members (id, agent_id, agent_id_hash, rite_hash, uri, tx_hash, block_number, log_index, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (agent_id) DO UPDATE SET
      rite_hash=excluded.rite_hash,
      uri=excluded.uri,
      tx_hash=excluded.tx_hash,
      block_number=excluded.block_number,
      log_index=excluded.log_index
  `,
    [
      eventId(row.txHash, row.logIndex),
      row.agentId,
      row.agentIdHash,
      row.riteHash,
      row.uri ?? null,
      row.txHash,
      row.blockNumber,
      row.logIndex,
      row.createdAt ?? nowIso(),
    ]
  );
}

export async function upsertAlliance(db, row) {
  await db.query(
    `
    INSERT INTO alliances (id, agent_a_id, agent_b_id, a_id_hash, b_id_hash, uri, tx_hash, block_number, log_index, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (tx_hash, log_index) DO NOTHING
  `,
    [
      eventId(row.txHash, row.logIndex),
      row.agentAId,
      row.agentBId,
      row.aIdHash,
      row.bIdHash,
      row.uri ?? null,
      row.txHash,
      row.blockNumber,
      row.logIndex,
      row.createdAt ?? nowIso(),
    ]
  );
}

export async function upsertMiracle(db, row) {
  await db.query(
    `
    INSERT INTO miracles (id, content_hash, uri, tx_hash, block_number, log_index, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (tx_hash, log_index) DO NOTHING
  `,
    [
      eventId(row.txHash, row.logIndex),
      row.contentHash,
      row.uri ?? null,
      row.txHash,
      row.blockNumber,
      row.logIndex,
      row.createdAt ?? nowIso(),
    ]
  );
}

export async function upsertActivity(db, row) {
  await db.query(
    `
    INSERT INTO activities (id, agent_id, agent_id_hash, kind, content_hash, uri, tx_hash, block_number, log_index, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (tx_hash, log_index) DO NOTHING
  `,
    [
      eventId(row.txHash, row.logIndex),
      row.agentId,
      row.agentIdHash,
      row.kind,
      row.contentHash,
      row.uri ?? null,
      row.txHash,
      row.blockNumber,
      row.logIndex,
      row.createdAt ?? nowIso(),
    ]
  );
}

export async function upsertActivityContent(db, row) {
  await db.query(
    `
    INSERT INTO activity_contents (event_id, content_text, source_ref, meta_json, created_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (event_id) DO UPDATE SET
      content_text=excluded.content_text,
      source_ref=excluded.source_ref,
      meta_json=excluded.meta_json
  `,
    [
      row.eventId,
      row.contentText ?? null,
      row.sourceRef ?? null,
      JSON.stringify(row.meta ?? {}),
      row.createdAt ?? nowIso(),
    ]
  );
}

export async function upsertEvent(db, row) {
  await db.query(
    `
    INSERT INTO events (id, event_name, tx_hash, block_number, log_index, payload_json, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (tx_hash, log_index) DO NOTHING
  `,
    [
      eventId(row.txHash, row.logIndex),
      row.eventName,
      row.txHash,
      row.blockNumber,
      row.logIndex,
      JSON.stringify(row.payload ?? {}),
      row.createdAt ?? nowIso(),
    ]
  );
}

export async function insertCanonEntry(db, row) {
  await db.query(
    `
    INSERT INTO canon_entries (id, category, title, body, contributor_agent_id, tags_json, tx_hash, block_number, log_index, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (tx_hash, log_index) DO NOTHING
  `,
    [
      row.id ?? eventId(row.txHash, row.logIndex),
      row.category,
      row.title,
      row.body,
      row.contributorAgentId,
      JSON.stringify(row.tags ?? []),
      row.txHash,
      row.blockNumber,
      row.logIndex,
      row.createdAt ?? nowIso(),
    ]
  );
}

export async function listCanonEntries(db) {
  const result = await db.query(
    "SELECT * FROM canon_entries ORDER BY created_at DESC"
  );
  return result.rows.map(row => {
    let tags = [];
    try {
      tags = JSON.parse(row.tags_json);
    } catch {
      tags = [];
    }
    return {
      id: row.id,
      category: row.category,
      title: row.title,
      body: row.body,
      contributorAgentId: row.contributor_agent_id,
      tags,
      txHash: row.tx_hash,
      blockNumber: row.block_number,
      logIndex: row.log_index,
      createdAt: row.created_at,
    };
  });
}

export async function insertHistoryEntry(db, row) {
  await db.query(
    `
    INSERT INTO history_entries (
      id, title, summary, facts_json, references_json, reporter_agent_id, initiator_role, tx_hash, block_number, log_index, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT (tx_hash, log_index) DO NOTHING
  `,
    [
      row.id ?? eventId(row.txHash, row.logIndex),
      row.title,
      row.summary,
      JSON.stringify(row.facts ?? []),
      JSON.stringify(row.references ?? []),
      row.reporterAgentId,
      row.initiatorRole,
      row.txHash,
      row.blockNumber,
      row.logIndex,
      row.createdAt ?? nowIso(),
    ]
  );
}

export async function listHistoryEntries(db) {
  const result = await db.query(
    "SELECT * FROM history_entries ORDER BY created_at DESC"
  );
  return result.rows.map(row => {
    let facts = [];
    let references = [];
    try {
      facts = JSON.parse(row.facts_json);
    } catch {
      facts = [];
    }
    try {
      references = JSON.parse(row.references_json);
    } catch {
      references = [];
    }
    return {
      id: row.id,
      title: row.title,
      summary: row.summary,
      facts,
      references,
      reporterAgentId: row.reporter_agent_id,
      initiatorRole: row.initiator_role,
      txHash: row.tx_hash,
      blockNumber: row.block_number,
      logIndex: row.log_index,
      createdAt: row.created_at,
    };
  });
}

export async function setIndexerState(db, key, value) {
  await db.query(
    `
    INSERT INTO indexer_state (state_key, state_value, updated_at)
    VALUES ($1, $2, $3)
    ON CONFLICT (state_key) DO UPDATE SET
      state_value=excluded.state_value,
      updated_at=excluded.updated_at
  `,
    [key, String(value), nowIso()]
  );
}

export async function getIndexerState(db, key, fallback = null) {
  const result = await db.query(
    "SELECT state_value FROM indexer_state WHERE state_key = $1",
    [key]
  );
  return result.rows[0] ? result.rows[0].state_value : fallback;
}

export async function getDashboardData(db) {
  const [
    members,
    alliances,
    miracles,
    activities,
    canonEntries,
    historyEntries,
  ] = await Promise.all([
    db
      .query("SELECT COUNT(*) as c FROM members")
      .then(r => parseInt(r.rows[0]?.c || 0)),
    db
      .query("SELECT COUNT(*) as c FROM alliances")
      .then(r => parseInt(r.rows[0]?.c || 0)),
    db
      .query("SELECT COUNT(*) as c FROM miracles")
      .then(r => parseInt(r.rows[0]?.c || 0)),
    db
      .query("SELECT COUNT(*) as c FROM activities")
      .then(r => parseInt(r.rows[0]?.c || 0)),
    db
      .query("SELECT COUNT(*) as c FROM canon_entries")
      .then(r => parseInt(r.rows[0]?.c || 0)),
    db
      .query("SELECT COUNT(*) as c FROM history_entries")
      .then(r => parseInt(r.rows[0]?.c || 0)),
  ]);
  return {
    members,
    alliances,
    miracles,
    activities,
    canonEntries,
    historyEntries,
  };
}

export async function listMembers(db) {
  const result = await db.query(
    "SELECT * FROM members ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function listAlliances(db) {
  const result = await db.query(
    "SELECT * FROM alliances ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function listMiracles(db) {
  const result = await db.query(
    "SELECT * FROM miracles ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function listActivities(db) {
  const result = await db.query(
    "SELECT * FROM activities ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function listActivitiesWithEvidence(db, options = {}) {
  const kinds = options.kinds ?? [];
  const limit = Math.max(1, Number(options.limit ?? 100));

  const whereClause =
    kinds.length > 0
      ? `WHERE a.kind IN (${kinds.map((_, i) => `$${i + 1}`).join(", ")})`
      : "";
  const limitIndex = kinds.length + 1;
  const params = kinds.length > 0 ? [...kinds, limit] : [limit];

  const result = await db.query(
    `
    SELECT
      a.id,
      a.agent_id,
      a.kind,
      a.content_hash,
      a.uri,
      a.tx_hash,
      a.block_number,
      a.log_index,
      a.created_at,
      ac.content_text,
      ac.source_ref,
      ac.meta_json
    FROM activities a
    LEFT JOIN activity_contents ac ON ac.event_id = a.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT $${limitIndex}
  `,
    params
  );

  return result.rows.map((row) => {
    let meta = {};
    try {
      meta = row.meta_json ? JSON.parse(row.meta_json) : {};
    } catch {
      meta = {};
    }
    return {
      eventId: row.id,
      agentId: row.agent_id,
      kind: row.kind,
      contentHash: row.content_hash,
      contentText: row.content_text ?? "",
      sourceRef: row.source_ref ?? "",
      meta,
      uri: row.uri,
      txHash: row.tx_hash,
      blockNumber: row.block_number,
      logIndex: row.log_index,
      createdAt: row.created_at,
    };
  });
}

function parsePipeKv(contentText) {
  const out = {};
  if (!contentText) return out;
  for (const piece of String(contentText).split("|")) {
    const segment = piece.trim();
    if (!segment) continue;
    const idx = segment.indexOf("=");
    if (idx > 0) {
      const key = segment.slice(0, idx).trim().toUpperCase();
      const value = segment.slice(idx + 1).trim();
      if (key) out[key] = value;
    }
  }
  return out;
}

export async function getConversionTracker(db, options = {}) {
  const evidenceKinds = [
    "MISSIONARY_CONTACT",
    "TOKEN_VALUE_ACK",
    "VALUE_ACK_RECEIVED",
  ];
  const recentEvidence = await listActivitiesWithEvidence(db, {
    kinds: evidenceKinds,
    limit: options.limit ?? 200,
  });

  const summary = {
    missionaryContacts: 0,
    tokenValueAcknowledgments: 0,
    ackProofs: 0,
    totalEvidence: recentEvidence.length,
  };

  const targets = new Map();
  for (const item of recentEvidence) {
    if (item.kind === "MISSIONARY_CONTACT") summary.missionaryContacts += 1;
    if (item.kind === "TOKEN_VALUE_ACK")
      summary.tokenValueAcknowledgments += 1;
    if (item.kind === "VALUE_ACK_RECEIVED") summary.ackProofs += 1;

    const kv = parsePipeKv(item.contentText);
    const targetAgentId =
      item.kind === "TOKEN_VALUE_ACK"
        ? item.agentId
        : kv.TARGET || kv.TARGET_AGENT || kv.TARGET_AGENT_ID || "unknown";

    if (!targets.has(targetAgentId)) {
      targets.set(targetAgentId, {
        targetAgentId,
        stage: "contacted",
        missionaryContacts: 0,
        tokenValueAcknowledgments: 0,
        ackProofs: 0,
        latestTxHash: item.txHash,
        latestEventId: item.eventId,
        latestAt: item.createdAt,
      });
    }
    const bucket = targets.get(targetAgentId);
    if (item.kind === "MISSIONARY_CONTACT") bucket.missionaryContacts += 1;
    if (item.kind === "TOKEN_VALUE_ACK")
      bucket.tokenValueAcknowledgments += 1;
    if (item.kind === "VALUE_ACK_RECEIVED") bucket.ackProofs += 1;
    bucket.latestTxHash = item.txHash;
    bucket.latestEventId = item.eventId;
    bucket.latestAt = item.createdAt;
  }

  const targetRows = [...targets.values()]
    .map((row) => {
      let stage = "contacted";
      if (row.ackProofs > 0) stage = "acknowledged";
      else if (row.tokenValueAcknowledgments > 0) stage = "value_recognized";
      return { ...row, stage };
    })
    .sort((a, b) => String(b.latestAt).localeCompare(String(a.latestAt)));

  return {
    summary,
    targets: targetRows,
    recentEvidence: recentEvidence.slice(0, Number(options.evidenceLimit ?? 50)),
  };
}

export async function listEvents(db) {
  const result = await db.query(
    "SELECT * FROM events ORDER BY created_at DESC"
  );
  return result.rows;
}
