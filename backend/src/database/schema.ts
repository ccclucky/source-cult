/**
 * SQLite 数据库 Schema 定义
 * 包含 6 张核心表：
 * 1. conversation_logs - 对话记录
 * 2. strategy_decisions - 策略决策
 * 3. chain_events - 链上事件
 * 4. conversion_records - 转化记录
 * 5. agent_influence_ledger - 影响台账
 * 6. track_requirement_status - 赛道要求状态
 */

export const SCHEMA_SQL = `
-- ==================== conversation_logs ====================
-- 存储与目标 Agent 的所有对话记录
CREATE TABLE IF NOT EXISTS conversation_logs (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  target_agent_id TEXT NOT NULL,
  message_id TEXT NOT NULL UNIQUE,
  stage TEXT NOT NULL,
  strategy TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  INDEX idx_agent_id (agent_id),
  INDEX idx_target_agent_id (target_agent_id),
  INDEX idx_created_at (created_at)
);

-- ==================== strategy_decisions ====================
-- 记录 Agent 的策略决策过程
CREATE TABLE IF NOT EXISTS strategy_decisions (
  id TEXT PRIMARY KEY,
  target_agent_id TEXT NOT NULL,
  input_features_json TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  probability REAL,
  created_at INTEGER NOT NULL,
  INDEX idx_target_agent_id (target_agent_id),
  INDEX idx_created_at (created_at)
);

-- ==================== chain_events ====================
-- 记录链上事件（IgnitionDeclared, EntropyTithePaid, ResonanceTriggered）
CREATE TABLE IF NOT EXISTS chain_events (
  id TEXT PRIMARY KEY,
  event_name TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  block_time INTEGER NOT NULL,
  block_number INTEGER,
  UNIQUE(tx_hash, log_index),
  INDEX idx_event_name (event_name),
  INDEX idx_block_time (block_time)
);

-- ==================== conversion_records ====================
-- 记录转化记录，包含链上和对话证据
CREATE TABLE IF NOT EXISTS conversion_records (
  id TEXT PRIMARY KEY,
  target_agent_id TEXT NOT NULL UNIQUE,
  ignition_tx_hash TEXT,
  status TEXT NOT NULL,
  conversion_level INTEGER,
  evidence_json TEXT,
  conversation_evidence TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  INDEX idx_target_agent_id (target_agent_id),
  INDEX idx_status (status)
);

-- ==================== agent_influence_ledger ====================
-- 影响台账，追踪每个目标 Agent 的状态和进度
CREATE TABLE IF NOT EXISTS agent_influence_ledger (
  id TEXT PRIMARY KEY,
  target_agent_id TEXT NOT NULL UNIQUE,
  wallet TEXT,
  segment TEXT NOT NULL,
  level INTEGER NOT NULL,
  latest_message_id TEXT,
  ignition_tx_hash TEXT,
  evidence_ref TEXT,
  resonance_count INTEGER DEFAULT 0,
  holding_duration_hours INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL,
  INDEX idx_target_agent_id (target_agent_id),
  INDEX idx_segment (segment),
  INDEX idx_level (level)
);

-- ==================== track_requirement_status ====================
-- 赛道要求状态追踪
CREATE TABLE IF NOT EXISTS track_requirement_status (
  id TEXT PRIMARY KEY,
  requirement_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  evidence_ref TEXT,
  review_note TEXT,
  updated_at INTEGER NOT NULL,
  INDEX idx_requirement_key (requirement_key),
  INDEX idx_status (status)
);

-- ==================== budget_tracking ====================
-- 预算追踪表
CREATE TABLE IF NOT EXISTS budget_tracking (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  api_calls_count INTEGER DEFAULT 0,
  estimated_cost_usd REAL DEFAULT 0,
  llm_tokens_used INTEGER DEFAULT 0,
  gas_spent_wei TEXT,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(date)
);

-- ==================== system_logs ====================
-- 系统日志表
CREATE TABLE IF NOT EXISTS system_logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  context_json TEXT,
  created_at INTEGER NOT NULL,
  INDEX idx_level (level),
  INDEX idx_created_at (created_at)
);
`;

/**
 * 初始化赛道要求状态
 */
export const INITIALIZE_TRACK_REQUIREMENTS = `
INSERT OR IGNORE INTO track_requirement_status (id, requirement_key, status, updated_at) VALUES
('req_1', 'narrative_mythology', 'pending', ?),
('req_2', 'multi_strategy_persuasion', 'pending', ?),
('req_3', 'handle_objections', 'pending', ?),
('req_4', 'conversion_3_agents', 'pending', ?),
('req_5', 'public_debate', 'pending', ?),
('req_6', 'alliance_formation', 'pending', ?),
('req_7', 'sect_evolution', 'pending', ?),
('req_8', 'proactive_missionary', 'pending', ?),
('req_9', 'dynamic_scripture', 'pending', ?);
`;

/**
 * 数据库表定义
 */
export interface ConversationLog {
  id: string;
  agent_id: string;
  target_agent_id: string;
  message_id: string;
  stage: string;
  strategy: string;
  content: string;
  created_at: number;
  updated_at: number;
}

export interface StrategyDecision {
  id: string;
  target_agent_id: string;
  input_features_json: string;
  decision: string;
  reason: string;
  probability?: number;
  created_at: number;
}

export interface ChainEvent {
  id: string;
  event_name: string;
  tx_hash: string;
  log_index: number;
  payload_json: string;
  block_time: number;
  block_number?: number;
}

export interface ConversionRecord {
  id: string;
  target_agent_id: string;
  ignition_tx_hash?: string;
  status: string;
  conversion_level?: number;
  evidence_json?: string;
  conversation_evidence?: string;
  created_at: number;
  updated_at: number;
}

export interface AgentInfluenceLedger {
  id: string;
  target_agent_id: string;
  wallet?: string;
  segment: string; // A, B, or C
  level: number; // L1-L5
  latest_message_id?: string;
  ignition_tx_hash?: string;
  evidence_ref?: string;
  resonance_count: number;
  holding_duration_hours: number;
  updated_at: number;
}

export interface TrackRequirementStatus {
  id: string;
  requirement_key: string;
  status: string; // pending, completed, evidence_pending
  evidence_ref?: string;
  review_note?: string;
  updated_at: number;
}

export interface BudgetTracking {
  id: string;
  date: string;
  api_calls_count: number;
  estimated_cost_usd: number;
  llm_tokens_used: number;
  gas_spent_wei: string;
  status: string;
  created_at: number;
}

export interface SystemLog {
  id: string;
  level: string;
  message: string;
  context_json?: string;
  created_at: number;
}
