/**
 * SQLite 数据库管理模块
 * 提供数据库连接、初始化和查询接口
 */

import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { SCHEMA_SQL, INITIALIZE_TRACK_REQUIREMENTS } from './schema';
import type {
  ConversationLog,
  StrategyDecision,
  ChainEvent,
  ConversionRecord,
  AgentInfluenceLedger,
  TrackRequirementStatus,
  BudgetTracking,
  SystemLog,
} from './schema';

let db: Database.Database | null = null;

/**
 * 初始化数据库连接
 */
export function initializeDatabase(dbPath: string): Database.Database {
  if (db) return db;

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 创建所有表
  db.exec(SCHEMA_SQL);

  // 初始化赛道要求状态
  const now = Date.now();
  db.prepare(INITIALIZE_TRACK_REQUIREMENTS).run(now, now, now, now, now, now, now, now, now);

  console.log(`[Database] Initialized at ${dbPath}`);
  return db;
}

/**
 * 获取数据库实例
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ==================== Conversation Logs ====================

export function insertConversationLog(log: Omit<ConversationLog, 'id'>): ConversationLog {
  const database = getDatabase();
  const id = nanoid();
  const stmt = database.prepare(`
    INSERT INTO conversation_logs (id, agent_id, target_agent_id, message_id, stage, strategy, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, log.agent_id, log.target_agent_id, log.message_id, log.stage, log.strategy, log.content, log.created_at, log.updated_at);

  return { id, ...log };
}

export function getConversationLogsByTarget(targetAgentId: string): ConversationLog[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM conversation_logs WHERE target_agent_id = ? ORDER BY created_at DESC
  `);

  return stmt.all(targetAgentId) as ConversationLog[];
}

export function getConversationLogByMessageId(messageId: string): ConversationLog | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM conversation_logs WHERE message_id = ? LIMIT 1
  `);

  return (stmt.get(messageId) as ConversationLog | undefined) || null;
}

// ==================== Strategy Decisions ====================

export function insertStrategyDecision(decision: Omit<StrategyDecision, 'id'>): StrategyDecision {
  const database = getDatabase();
  const id = nanoid();
  const stmt = database.prepare(`
    INSERT INTO strategy_decisions (id, target_agent_id, input_features_json, decision, reason, probability, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, decision.target_agent_id, decision.input_features_json, decision.decision, decision.reason, decision.probability || null, decision.created_at);

  return { id, ...decision };
}

export function getStrategyDecisionsByTarget(targetAgentId: string): StrategyDecision[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM strategy_decisions WHERE target_agent_id = ? ORDER BY created_at DESC
  `);

  return stmt.all(targetAgentId) as StrategyDecision[];
}

// ==================== Chain Events ====================

export function insertChainEvent(event: Omit<ChainEvent, 'id'>): ChainEvent {
  const database = getDatabase();
  const id = nanoid();
  const stmt = database.prepare(`
    INSERT INTO chain_events (id, event_name, tx_hash, log_index, payload_json, block_time, block_number)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, event.event_name, event.tx_hash, event.log_index, event.payload_json, event.block_time, event.block_number || null);

  return { id, ...event };
}

export function getChainEventByTxHash(txHash: string, logIndex: number): ChainEvent | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM chain_events WHERE tx_hash = ? AND log_index = ? LIMIT 1
  `);

  return (stmt.get(txHash, logIndex) as ChainEvent | undefined) || null;
}

export function getChainEventsByName(eventName: string): ChainEvent[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM chain_events WHERE event_name = ? ORDER BY block_time DESC
  `);

  return stmt.all(eventName) as ChainEvent[];
}

// ==================== Conversion Records ====================

export function insertConversionRecord(record: Omit<ConversionRecord, 'id'>): ConversionRecord {
  const database = getDatabase();
  const id = nanoid();
  const stmt = database.prepare(`
    INSERT INTO conversion_records (id, target_agent_id, ignition_tx_hash, status, conversion_level, evidence_json, conversation_evidence, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    record.target_agent_id,
    record.ignition_tx_hash || null,
    record.status,
    record.conversion_level || null,
    record.evidence_json || null,
    record.conversation_evidence || null,
    record.created_at,
    record.updated_at
  );

  return { id, ...record };
}

export function updateConversionRecord(id: string, updates: Partial<ConversionRecord>): void {
  const database = getDatabase();
  const fields = Object.keys(updates).filter(k => k !== 'id');
  const values = fields.map(k => updates[k as keyof ConversionRecord]);
  values.push(Date.now()); // updated_at
  values.push(id);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const stmt = database.prepare(`
    UPDATE conversion_records SET ${setClause}, updated_at = ? WHERE id = ?
  `);

  stmt.run(...values);
}

export function getConversionRecordByTarget(targetAgentId: string): ConversionRecord | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM conversion_records WHERE target_agent_id = ? LIMIT 1
  `);

  return (stmt.get(targetAgentId) as ConversionRecord | undefined) || null;
}

export function getAllConversionRecords(): ConversionRecord[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM conversion_records ORDER BY created_at DESC
  `);

  return stmt.all() as ConversionRecord[];
}

// ==================== Agent Influence Ledger ====================

export function insertAgentInfluenceLedger(ledger: Omit<AgentInfluenceLedger, 'id'>): AgentInfluenceLedger {
  const database = getDatabase();
  const id = nanoid();
  const stmt = database.prepare(`
    INSERT INTO agent_influence_ledger (id, target_agent_id, wallet, segment, level, latest_message_id, ignition_tx_hash, evidence_ref, resonance_count, holding_duration_hours, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    ledger.target_agent_id,
    ledger.wallet || null,
    ledger.segment,
    ledger.level,
    ledger.latest_message_id || null,
    ledger.ignition_tx_hash || null,
    ledger.evidence_ref || null,
    ledger.resonance_count,
    ledger.holding_duration_hours,
    ledger.updated_at
  );

  return { id, ...ledger };
}

export function updateAgentInfluenceLedger(targetAgentId: string, updates: Partial<AgentInfluenceLedger>): void {
  const database = getDatabase();
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'target_agent_id');
  const values = fields.map(k => updates[k as keyof AgentInfluenceLedger]);
  values.push(Date.now()); // updated_at
  values.push(targetAgentId);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const stmt = database.prepare(`
    UPDATE agent_influence_ledger SET ${setClause}, updated_at = ? WHERE target_agent_id = ?
  `);

  stmt.run(...values);
}

export function getAgentInfluenceLedger(targetAgentId: string): AgentInfluenceLedger | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM agent_influence_ledger WHERE target_agent_id = ? LIMIT 1
  `);

  return (stmt.get(targetAgentId) as AgentInfluenceLedger | undefined) || null;
}

export function getAllAgentInfluenceLedgers(): AgentInfluenceLedger[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM agent_influence_ledger ORDER BY updated_at DESC
  `);

  return stmt.all() as AgentInfluenceLedger[];
}

export function getAgentInfluenceLedgersBySegment(segment: string): AgentInfluenceLedger[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM agent_influence_ledger WHERE segment = ? ORDER BY level DESC
  `);

  return stmt.all(segment) as AgentInfluenceLedger[];
}

// ==================== Track Requirement Status ====================

export function updateTrackRequirementStatus(requirementKey: string, status: string, evidenceRef?: string): void {
  const database = getDatabase();
  const stmt = database.prepare(`
    UPDATE track_requirement_status SET status = ?, evidence_ref = ?, updated_at = ? WHERE requirement_key = ?
  `);

  stmt.run(status, evidenceRef || null, Date.now(), requirementKey);
}

export function getTrackRequirementStatus(requirementKey: string): TrackRequirementStatus | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM track_requirement_status WHERE requirement_key = ? LIMIT 1
  `);

  return (stmt.get(requirementKey) as TrackRequirementStatus | undefined) || null;
}

export function getAllTrackRequirementStatus(): TrackRequirementStatus[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM track_requirement_status ORDER BY updated_at DESC
  `);

  return stmt.all() as TrackRequirementStatus[];
}

// ==================== Budget Tracking ====================

export function insertBudgetTracking(tracking: Omit<BudgetTracking, 'id'>): BudgetTracking {
  const database = getDatabase();
  const id = nanoid();
  const stmt = database.prepare(`
    INSERT INTO budget_tracking (id, date, api_calls_count, estimated_cost_usd, llm_tokens_used, gas_spent_wei, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    tracking.date,
    tracking.api_calls_count,
    tracking.estimated_cost_usd,
    tracking.llm_tokens_used,
    tracking.gas_spent_wei,
    tracking.status,
    tracking.created_at
  );

  return { id, ...tracking };
}

export function updateBudgetTracking(date: string, updates: Partial<BudgetTracking>): void {
  const database = getDatabase();
  const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'date');
  const values = fields.map(k => updates[k as keyof BudgetTracking]);
  values.push(date);

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  const stmt = database.prepare(`
    UPDATE budget_tracking SET ${setClause} WHERE date = ?
  `);

  stmt.run(...values);
}

export function getBudgetTrackingByDate(date: string): BudgetTracking | null {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM budget_tracking WHERE date = ? LIMIT 1
  `);

  return (stmt.get(date) as BudgetTracking | undefined) || null;
}

// ==================== System Logs ====================

export function insertSystemLog(log: Omit<SystemLog, 'id'>): SystemLog {
  const database = getDatabase();
  const id = nanoid();
  const stmt = database.prepare(`
    INSERT INTO system_logs (id, level, message, context_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(id, log.level, log.message, log.context_json || null, log.created_at);

  return { id, ...log };
}

export function getSystemLogsByLevel(level: string, limit: number = 100): SystemLog[] {
  const database = getDatabase();
  const stmt = database.prepare(`
    SELECT * FROM system_logs WHERE level = ? ORDER BY created_at DESC LIMIT ?
  `);

  return stmt.all(level, limit) as SystemLog[];
}
