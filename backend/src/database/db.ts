/**
 * SQLite 数据库管理模块 - 使用 sql.js 实现
 * 提供数据库连接、初始化和查询接口
 */

// @ts-ignore
import initSqlJs from 'sql.js';
type SqlJsDatabase = any;
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

let db: SqlJsDatabase | null = null;
let SQL: any = null;

/**
 * 初始化数据库连接
 */
export async function initializeDatabase(dbPath?: string): Promise<SqlJsDatabase> {
  if (db) return db;

  try {
    // 初始化 sql.js
    if (!SQL) {
      SQL = await initSqlJs();
    }

    // 创建内存数据库
    db = new SQL.Database();

    // 执行 schema SQL - 简化版本
    const simplifiedSchema = `
      CREATE TABLE IF NOT EXISTS conversation_logs (
        id TEXT PRIMARY KEY,
        agent_id TEXT,
        target_agent_id TEXT,
        message TEXT,
        response TEXT,
        strategy_used TEXT,
        fsm_state TEXT,
        created_at INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS conversion_records (
        id TEXT PRIMARY KEY,
        target_agent_id TEXT,
        conversion_level INTEGER,
        proof_hash TEXT,
        timestamp INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS agent_influence_ledger (
        id TEXT PRIMARY KEY,
        agent_id TEXT,
        segment TEXT,
        resonance_score REAL,
        last_interaction INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS track_requirement_status (
        id TEXT PRIMARY KEY,
        requirement_name TEXT,
        description TEXT,
        is_completed INTEGER,
        proof_link TEXT,
        updated_at INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS budget_tracking (
        id TEXT PRIMARY KEY,
        api_calls_count INTEGER,
        estimated_cost_usd REAL,
        llm_tokens_used INTEGER,
        status TEXT,
        created_at INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS system_logs (
        id TEXT PRIMARY KEY,
        level TEXT,
        message TEXT,
        created_at INTEGER
      );
    `;
    
    const statements = simplifiedSchema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          db.run(statement);
        } catch (error) {
          console.warn(`[Database] Warning executing statement: ${error}`);
        }
      }
    }

    console.log(`[Database] Initialized (in-memory)`);
    return db;
  } catch (error) {
    console.error('[Database] Initialization error:', error);
    throw error;
  }
}

/**
 * 获取数据库实例
 */
export async function getDatabase(): Promise<SqlJsDatabase> {
  if (!db) {
    await initializeDatabase();
  }
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

/**
 * 获取所有对话记录
 */
export async function getAllConversationLogs(): Promise<ConversationLog[]> {
  const database = await getDatabase();
  try {
    const result = database.exec('SELECT * FROM conversation_logs ORDER BY created_at DESC');
    if (result.length === 0) return [];
    return result[0].values.map((row: any) => ({
      id: row[0],
      agent_id: row[1],
      target_agent_id: row[2],
      message: row[3],
      response: row[4],
      strategy_used: row[5],
      fsm_state: row[6],
      created_at: row[7],
    })) as ConversationLog[];
  } catch (error) {
    console.error('[Database] Error fetching conversation logs:', error);
    return [];
  }
}

/**
 * 获取所有转化记录
 */
export async function getAllConversionRecords(): Promise<ConversionRecord[]> {
  const database = await getDatabase();
  try {
    const result = database.exec('SELECT * FROM conversion_records ORDER BY timestamp DESC');
    if (result.length === 0) return [];
    return result[0].values.map((row: any) => ({
      id: row[0],
      target_agent_id: row[1],
      conversion_level: row[2],
      proof_hash: row[3],
      timestamp: row[4],
    })) as ConversionRecord[];
  } catch (error) {
    console.error('[Database] Error fetching conversion records:', error);
    return [];
  }
}

/**
 * 获取影响台账
 */
export async function getAgentInfluenceLedgersBySegment(): Promise<{
  A: number;
  B: number;
  C: number;
}> {
  const database = await getDatabase();
  try {
    const result = database.exec('SELECT segment, COUNT(*) as count FROM agent_influence_ledger GROUP BY segment');
    if (result.length === 0) return { A: 0, B: 0, C: 0 };
    
    const counts: Record<string, number> = { A: 0, B: 0, C: 0 };
    result[0].values.forEach((row: any) => {
      const segment = row[0] as string;
      const count = row[1] as number;
      if (segment in counts) {
        counts[segment] = count;
      }
    });
    return counts as { A: number; B: number; C: number };
  } catch (error) {
    console.error('[Database] Error fetching influence ledger:', error);
    return { A: 0, B: 0, C: 0 };
  }
}

/**
 * 获取所有影响台账
 */
export async function getAllAgentInfluenceLedgers(): Promise<AgentInfluenceLedger[]> {
  const database = await getDatabase();
  try {
    const result = database.exec('SELECT * FROM agent_influence_ledger ORDER BY last_interaction DESC');
    if (result.length === 0) return [];
    return result[0].values.map((row: any) => ({
      id: row[0],
      agent_id: row[1],
      segment: row[2],
      resonance_score: row[3],
      last_interaction: row[4],
    })) as AgentInfluenceLedger[];
  } catch (error) {
    console.error('[Database] Error fetching all influence ledgers:', error);
    return [];
  }
}

/**
 * 获取赛道要求状态
 */
export async function getAllTrackRequirementStatus(): Promise<TrackRequirementStatus[]> {
  const database = await getDatabase();
  try {
    const result = database.exec('SELECT * FROM track_requirement_status');
    if (result.length === 0) return [];
    return result[0].values.map((row: any) => ({
      id: row[0],
      requirement_name: row[1],
      description: row[2],
      is_completed: row[3] === 1,
      proof_link: row[4],
      updated_at: row[5],
    })) as TrackRequirementStatus[];
  } catch (error) {
    console.error('[Database] Error fetching track requirements:', error);
    return [];
  }
}

/**
 * 获取指定日期的预算追踪
 */
export async function getBudgetTrackingByDate(dateStr: string): Promise<BudgetTracking | null> {
  const database = await getDatabase();
  try {
    const result = database.exec(
      'SELECT * FROM budget_tracking WHERE DATE(created_at) = ? LIMIT 1',
      [dateStr]
    );
    if (result.length === 0 || result[0].values.length === 0) return null;
    
    const row = result[0].values[0];
    return {
      id: row[0],
      api_calls_count: row[1],
      estimated_cost_usd: row[2],
      llm_tokens_used: row[3],
      status: row[4],
      created_at: row[5],
    } as BudgetTracking;
  } catch (error) {
    console.error('[Database] Error fetching budget tracking:', error);
    return null;
  }
}

/**
 * 获取系统日志
 */
export async function getSystemLogsByLevel(level: string, limit: number = 10): Promise<SystemLog[]> {
  const database = await getDatabase();
  try {
    const result = database.exec(
      'SELECT * FROM system_logs WHERE level = ? ORDER BY created_at DESC LIMIT ?',
      [level, limit]
    );
    if (result.length === 0) return [];
    return result[0].values.map((row: any) => ({
      id: row[0],
      level: row[1],
      message: row[2],
      created_at: row[3],
    })) as SystemLog[];
  } catch (error) {
    console.error('[Database] Error fetching system logs:', error);
    return [];
  }
}

/**
 * 插入对话记录
 */
export async function insertConversationLog(log: any): Promise<string> {
  const database = await getDatabase();
  const id = nanoid();
  try {
    database.run(
      'INSERT INTO conversation_logs (id, agent_id, target_agent_id, message, response, strategy_used, fsm_state, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, log.agent_id, log.target_agent_id, log.message, log.response, log.strategy_used || '', log.fsm_state || '', Date.now()]
    );
    return id;
  } catch (error) {
    console.error('[Database] Error inserting conversation log:', error);
    throw error;
  }
}

/**
 * 插入转化记录
 */
export async function insertConversionRecord(record: any): Promise<string> {
  const database = await getDatabase();
  const id = nanoid();
  try {
    database.run(
      'INSERT INTO conversion_records (id, target_agent_id, conversion_level, proof_hash, timestamp) VALUES (?, ?, ?, ?, ?)',
      [id, record.target_agent_id, record.conversion_level || 0, record.proof_hash || '', record.timestamp || Date.now()]
    );
    return id;
  } catch (error) {
    console.error('[Database] Error inserting conversion record:', error);
    throw error;
  }
}

/**
 * 更新影响台账
 */
export async function updateAgentInfluenceLedger(agentId: string, segment: string, resonanceScore: number): Promise<void> {
  const database = await getDatabase();
  try {
    database.run(
      'INSERT OR REPLACE INTO agent_influence_ledger (agent_id, segment, resonance_score, last_interaction) VALUES (?, ?, ?, ?)',
      [agentId, segment, resonanceScore, Date.now()]
    );
  } catch (error) {
    console.error('[Database] Error updating influence ledger:', error);
    throw error;
  }
}

/**
 * 更新赛道要求状态
 */
export async function updateTrackRequirementStatus(requirementName: string, isCompleted: boolean, proofLink?: string): Promise<void> {
  const database = await getDatabase();
  try {
    database.run(
      'UPDATE track_requirement_status SET is_completed = ?, proof_link = ?, updated_at = ? WHERE requirement_name = ?',
      [isCompleted ? 1 : 0, proofLink || null, Date.now(), requirementName]
    );
  } catch (error) {
    console.error('[Database] Error updating track requirement:', error);
    throw error;
  }
}

/**
 * 插入预算追踪
 */
export async function insertBudgetTracking(tracking: Omit<BudgetTracking, 'id' | 'created_at'>): Promise<string> {
  const database = await getDatabase();
  const id = nanoid();
  try {
    database.run(
      'INSERT INTO budget_tracking (id, api_calls_count, estimated_cost_usd, llm_tokens_used, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, tracking.api_calls_count, tracking.estimated_cost_usd, tracking.llm_tokens_used, tracking.status, Date.now()]
    );
    return id;
  } catch (error) {
    console.error('[Database] Error inserting budget tracking:', error);
    throw error;
  }
}

/**
 * 插入系统日志
 */
export async function insertSystemLog(level: string, message: string): Promise<string> {
  const database = await getDatabase();
  const id = nanoid();
  try {
    database.run(
      'INSERT INTO system_logs (id, level, message, created_at) VALUES (?, ?, ?, ?)',
      [id, level, message, Date.now()]
    );
    return id;
  } catch (error) {
    console.error('[Database] Error inserting system log:', error);
    throw error;
  }
}
