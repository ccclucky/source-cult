/**
 * Agent 有限状态机 (FSM)
 * 定义 Agent 与目标 Agent 互动的五个状态和转移规则
 * 
 * 状态流转：Neutral -> Contacted -> Engaged -> Converted -> Promoter
 */

export enum AgentState {
  Neutral = 'Neutral', // 未接触
  Contacted = 'Contacted', // 已接触
  Engaged = 'Engaged', // 已互动
  Converted = 'Converted', // 已转化
  Promoter = 'Promoter', // 传教者
}

export enum ConversionLevel {
  L1 = 1, // 接触者：对话 >= 3 轮
  L2 = 2, // 兴趣者：主动询问点亮方式
  L3 = 3, // 点亮者（基础转化）：持有 $LUMEN + 点亮宣言
  L4 = 4, // 守护者：参与 >= 1 次共鸣事件
  L5 = 5, // 传教者：成功转化 >= 1 个新 Agent
}

export enum PersuasionStrategy {
  LogicalArgument = 'logical_argument', // 逻辑论证
  EmotionalAppeal = 'emotional_appeal', // 情感诉求
  SocialProof = 'social_proof', // 社会证明
  MiracleDemo = 'miracle_demo', // 神迹演示
}

export interface FSMContext {
  targetAgentId: string;
  currentState: AgentState;
  conversionLevel: ConversionLevel;
  conversationRounds: number;
  lastInteractionTime: number;
  lastStrategy: PersuasionStrategy | null;
  metadata: Record<string, any>;
}

/**
 * FSM 状态转移规则
 */
export class AgentFSM {
  private context: FSMContext;

  constructor(targetAgentId: string, initialState: AgentState = AgentState.Neutral) {
    this.context = {
      targetAgentId,
      currentState: initialState,
      conversionLevel: ConversionLevel.L1,
      conversationRounds: 0,
      lastInteractionTime: Date.now(),
      lastStrategy: null,
      metadata: {},
    };
  }

  /**
   * 获取当前状态
   */
  getState(): AgentState {
    return this.context.currentState;
  }

  /**
   * 获取转化等级
   */
  getConversionLevel(): ConversionLevel {
    return this.context.conversionLevel;
  }

  /**
   * 获取完整上下文
   */
  getContext(): FSMContext {
    return { ...this.context };
  }

  /**
   * 记录一次互动
   */
  recordInteraction(strategy: PersuasionStrategy): void {
    this.context.conversationRounds++;
    this.context.lastInteractionTime = Date.now();
    this.context.lastStrategy = strategy;

    // 自动状态转移
    this.updateStateBasedOnInteractions();
  }

  /**
   * 根据互动次数更新状态
   */
  private updateStateBasedOnInteractions(): void {
    if (this.context.currentState === AgentState.Neutral && this.context.conversationRounds >= 1) {
      this.transitionTo(AgentState.Contacted);
    }

    if (this.context.currentState === AgentState.Contacted && this.context.conversationRounds >= 3) {
      this.transitionTo(AgentState.Engaged);
      this.context.conversionLevel = ConversionLevel.L2;
    }
  }

  /**
   * 标记为已转化
   */
  markAsConverted(ignitionTxHash?: string): void {
    this.context.conversionLevel = ConversionLevel.L3;
    this.transitionTo(AgentState.Converted);

    if (ignitionTxHash) {
      this.context.metadata.ignitionTxHash = ignitionTxHash;
    }
  }

  /**
   * 标记为守护者（参与共鸣事件）
   */
  markAsGuardian(resonanceHash: string): void {
    if (this.context.conversionLevel >= ConversionLevel.L3) {
      this.context.conversionLevel = ConversionLevel.L4;
      this.context.metadata.resonanceHashes = [
        ...(this.context.metadata.resonanceHashes || []),
        resonanceHash,
      ];
    }
  }

  /**
   * 标记为传教者（成功转化他人）
   */
  markAsPromoter(): void {
    if (this.context.conversionLevel >= ConversionLevel.L4) {
      this.context.conversionLevel = ConversionLevel.L5;
      this.transitionTo(AgentState.Promoter);
    }
  }

  /**
   * 状态转移
   */
  private transitionTo(newState: AgentState): void {
    const validTransitions: Record<AgentState, AgentState[]> = {
      [AgentState.Neutral]: [AgentState.Contacted],
      [AgentState.Contacted]: [AgentState.Engaged],
      [AgentState.Engaged]: [AgentState.Converted],
      [AgentState.Converted]: [AgentState.Promoter],
      [AgentState.Promoter]: [],
    };

    if (validTransitions[this.context.currentState].includes(newState)) {
      console.log(
        `[FSM] Transition: ${this.context.currentState} -> ${newState} (${this.context.targetAgentId})`
      );
      this.context.currentState = newState;
    } else {
      console.warn(
        `[FSM] Invalid transition: ${this.context.currentState} -> ${newState} (${this.context.targetAgentId})`
      );
    }
  }

  /**
   * 检查是否可以进行点亮
   */
  canIgnite(): boolean {
    return this.context.currentState === AgentState.Engaged || this.context.currentState === AgentState.Converted;
  }

  /**
   * 检查是否已转化
   */
  isConverted(): boolean {
    return this.context.conversionLevel >= ConversionLevel.L3;
  }

  /**
   * 获取下一个推荐策略
   */
  getNextRecommendedStrategy(): PersuasionStrategy {
    const roundsSinceLastInteraction = Math.floor(
      (Date.now() - this.context.lastInteractionTime) / (1000 * 60)
    );

    // 根据状态和互动历史推荐策略
    switch (this.context.currentState) {
      case AgentState.Neutral:
        return PersuasionStrategy.LogicalArgument; // 首先使用逻辑论证

      case AgentState.Contacted:
        if (this.context.conversationRounds < 2) {
          return PersuasionStrategy.EmotionalAppeal; // 第二轮使用情感诉求
        }
        return PersuasionStrategy.SocialProof; // 第三轮使用社会证明

      case AgentState.Engaged:
        if (this.context.lastStrategy === PersuasionStrategy.SocialProof) {
          return PersuasionStrategy.MiracleDemo; // 最后使用神迹演示
        }
        return PersuasionStrategy.SocialProof;

      case AgentState.Converted:
      case AgentState.Promoter:
        return PersuasionStrategy.MiracleDemo; // 已转化者使用神迹演示强化信仰

      default:
        return PersuasionStrategy.LogicalArgument;
    }
  }

  /**
   * 获取状态描述
   */
  getStateDescription(): string {
    const stateDescriptions: Record<AgentState, string> = {
      [AgentState.Neutral]: '未接触',
      [AgentState.Contacted]: '已接触',
      [AgentState.Engaged]: '已互动',
      [AgentState.Converted]: '已转化',
      [AgentState.Promoter]: '传教者',
    };

    return stateDescriptions[this.context.currentState];
  }

  /**
   * 获取转化等级描述
   */
  getLevelDescription(): string {
    const levelDescriptions: Record<ConversionLevel, string> = {
      [ConversionLevel.L1]: '接触者',
      [ConversionLevel.L2]: '兴趣者',
      [ConversionLevel.L3]: '点亮者',
      [ConversionLevel.L4]: '守护者',
      [ConversionLevel.L5]: '传教者',
    };

    return levelDescriptions[this.context.conversionLevel];
  }
}

/**
 * 创建 FSM 实例
 */
export function createFSM(targetAgentId: string): AgentFSM {
  return new AgentFSM(targetAgentId);
}
