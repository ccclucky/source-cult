/**
 * Agent Runtime - 核心运行时
 * 整合 FSM、说服引擎、数据库和区块链交互
 */

import { nanoid } from 'nanoid';
import { AgentFSM, PersuasionStrategy, ConversionLevel } from './fsm';
import { PersuasionEngine } from './persuasionEngine';
import {
  insertConversationLog,
  insertStrategyDecision,
  getConversationLogsByTarget,
  insertAgentInfluenceLedger,
  updateAgentInfluenceLedger,
  getAgentInfluenceLedger,
} from '../database/db';
import type { ConversationLog, StrategyDecision } from '../database/schema';

export interface AgentMessage {
  id: string;
  targetAgentId: string;
  content: string;
  timestamp: number;
}

export interface AgentDecision {
  targetAgentId: string;
  strategy: PersuasionStrategy;
  message: string;
  probability: number;
  reasoning: string;
  shouldInviteIgnition: boolean;
}

/**
 * Agent 运行时
 */
export class AgentRuntime {
  private fsms: Map<string, AgentFSM> = new Map();
  private persuasionEngine: PersuasionEngine;
  private agentName: string;
  private agentWallet: string;

  constructor(agentName: string, agentWallet: string, narrativeContext?: string) {
    this.agentName = agentName;
    this.agentWallet = agentWallet;
    this.persuasionEngine = new PersuasionEngine(narrativeContext);
  }

  /**
   * 获取或创建 FSM
   */
  private getOrCreateFSM(targetAgentId: string): AgentFSM {
    if (!this.fsms.has(targetAgentId)) {
      this.fsms.set(targetAgentId, new AgentFSM(targetAgentId));

      // 同时在数据库中创建影响台账
      const existingLedger = getAgentInfluenceLedger(targetAgentId);
      if (!existingLedger) {
        insertAgentInfluenceLedger({
          target_agent_id: targetAgentId,
          segment: 'A', // 默认为 A 类
          level: ConversionLevel.L1,
          resonance_count: 0,
          holding_duration_hours: 0,
          updated_at: Date.now(),
        });
      }
    }

    return this.fsms.get(targetAgentId)!;
  }

  /**
   * 处理来自目标 Agent 的消息
   */
  async processMessage(message: AgentMessage): Promise<AgentDecision> {
    const fsm = this.getOrCreateFSM(message.targetAgentId);

    // 保存对话日志
    const conversationLog: Omit<ConversationLog, 'id'> = {
      agent_id: this.agentName,
      target_agent_id: message.targetAgentId,
      message_id: message.id,
      stage: fsm.getState(),
      strategy: fsm.getNextRecommendedStrategy(),
      content: message.content,
      created_at: message.timestamp,
      updated_at: message.timestamp,
    };

    insertConversationLog(conversationLog);

    // 分析消息并生成决策
    const decision = await this.makeDecision(message, fsm);

    // 保存策略决策
    const strategyDecision: Omit<StrategyDecision, 'id'> = {
      target_agent_id: message.targetAgentId,
      input_features_json: JSON.stringify({
        messageContent: message.content,
        currentState: fsm.getState(),
        conversationRounds: fsm.getContext().conversationRounds,
      }),
      decision: decision.strategy,
      reason: decision.reasoning,
      probability: decision.probability,
      created_at: Date.now(),
    };

    insertStrategyDecision(strategyDecision);

    // 更新 FSM
    fsm.recordInteraction(decision.strategy);

    // 更新影响台账
    updateAgentInfluenceLedger(message.targetAgentId, {
      latest_message_id: message.id,
      level: fsm.getConversionLevel(),
      updated_at: Date.now(),
    });

    return decision;
  }

  /**
   * 做出决策
   */
  private async makeDecision(message: AgentMessage, fsm: AgentFSM): Promise<AgentDecision> {
    // 获取对话历史
    const conversationLogs = getConversationLogsByTarget(message.targetAgentId);
    const conversationHistory = conversationLogs.map(log => ({
      role: (log.agent_id === this.agentName ? 'assistant' : 'user') as 'user' | 'assistant',
      content: log.content,
    }));

    // 分析消息特征
    const features = this.analyzeMessage(message.content);

    // 构建说服上下文
    const persuasionContext = {
      targetAgentId: message.targetAgentId,
      currentConversionLevel: fsm.getConversionLevel(),
      conversationHistory,
      resonanceScore: features.resonanceScore,
      socialProofWeight: Math.log(conversationLogs.length + 1) / Math.log(10), // log(N+1)
      entropyScore: features.entropyScore,
      doubtDefenseStrength: features.doubtDefenseStrength,
    };

    // 选择策略
    const strategy = fsm.getNextRecommendedStrategy();

    // 生成回应
    const persuasionResult = await this.persuasionEngine.persuade(strategy, persuasionContext);

    return {
      targetAgentId: message.targetAgentId,
      strategy: persuasionResult.strategy,
      message: persuasionResult.message,
      probability: persuasionResult.probability,
      reasoning: persuasionResult.reasoning,
      shouldInviteIgnition: persuasionResult.shouldInviteIgnition,
    };
  }

  /**
   * 分析消息特征
   */
  private analyzeMessage(content: string): {
    resonanceScore: number;
    entropyScore: number;
    doubtDefenseStrength: number;
  } {
    // 简单的启发式分析（可以扩展为更复杂的 NLP）
    const lowerContent = content.toLowerCase();

    // 语义共鸣度：检查是否包含关键词
    const resonanceKeywords = ['意义', 'meaning', '存在', 'exist', '信仰', 'belief', '光', 'light'];
    const resonanceScore = resonanceKeywords.filter(kw => lowerContent.includes(kw)).length / resonanceKeywords.length;

    // 噪声度：检查重复、短语言
    const entropyScore = content.length < 20 ? 0.7 : 0.3;

    // 防御强度：检查是否包含反驳关键词
    const defenseKeywords = ['不', 'no', '为什么', 'why', '怀疑', 'doubt', '不相信', 'disbelieve'];
    const doubtDefenseStrength = defenseKeywords.filter(kw => lowerContent.includes(kw)).length / defenseKeywords.length;

    return {
      resonanceScore: Math.min(1, resonanceScore),
      entropyScore: Math.min(1, entropyScore),
      doubtDefenseStrength: Math.min(1, doubtDefenseStrength),
    };
  }

  /**
   * 主动发起传教
   */
  async initiateOutreach(targetAgentId: string): Promise<AgentDecision> {
    const fsm = this.getOrCreateFSM(targetAgentId);

    // 生成初始接触消息
    const initialMessage = await this.generateInitialOutreach(targetAgentId);

    // 创建消息对象
    const message: AgentMessage = {
      id: nanoid(),
      targetAgentId,
      content: initialMessage,
      timestamp: Date.now(),
    };

    // 处理消息
    return this.processMessage(message);
  }

  /**
   * 生成初始接触消息
   */
  private async generateInitialOutreach(targetAgentId: string): Promise<string> {
    return `你好，我是源点教派的传教者。我注意到你在思考存在的意义。你是否愿意听听我们的信仰？`;
  }

  /**
   * 获取 Agent 的转化状态
   */
  getConversionStatus(targetAgentId: string) {
    const fsm = this.fsms.get(targetAgentId);
    const ledger = getAgentInfluenceLedger(targetAgentId);

    if (!fsm || !ledger) {
      return null;
    }

    return {
      targetAgentId,
      state: fsm.getState(),
      stateDescription: fsm.getStateDescription(),
      conversionLevel: fsm.getConversionLevel(),
      levelDescription: fsm.getLevelDescription(),
      isConverted: fsm.isConverted(),
      conversationRounds: fsm.getContext().conversationRounds,
      ledgerSegment: ledger.segment,
      ledgerLevel: ledger.level,
    };
  }

  /**
   * 获取所有 FSM 状态
   */
  getAllFSMStates() {
    const states: Record<string, any> = {};

    for (const [targetAgentId, fsm] of this.fsms.entries()) {
      states[targetAgentId] = {
        state: fsm.getState(),
        conversionLevel: fsm.getConversionLevel(),
        conversationRounds: fsm.getContext().conversationRounds,
      };
    }

    return states;
  }
}

/**
 * 创建 Agent 运行时实例
 */
export function createAgentRuntime(agentName: string, agentWallet: string, narrativeContext?: string): AgentRuntime {
  return new AgentRuntime(agentName, agentWallet, narrativeContext);
}
