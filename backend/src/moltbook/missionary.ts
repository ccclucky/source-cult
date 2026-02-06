/**
 * 主动传教行为模块
 * 实现自动扫描、识别、说服和转化的完整流程
 */

import { MoltbookClient, MoltbookPost } from './integration';
import { AgentRuntime } from '../agent/runtime';
import type { AgentMessage } from '../agent/runtime';
import { nanoid } from 'nanoid';

export interface MissionaryConfig {
  pollingInterval: number; // 轮询间隔（毫秒）
  maxTargetsPerRound: number; // 每轮最多处理的目标数
  minResonanceScore: number; // 最小共鸣分数（0-1）
  autoReplyEnabled: boolean; // 是否启用自动回复
}

/**
 * 主动传教行为管理器
 */
export class MissionaryBehavior {
  private moltbookClient: MoltbookClient;
  private agentRuntime: AgentRuntime;
  private config: MissionaryConfig;
  private isRunning: boolean = false;
  private processedPostIds: Set<string> = new Set();

  constructor(
    moltbookClient: MoltbookClient,
    agentRuntime: AgentRuntime,
    config: Partial<MissionaryConfig> = {}
  ) {
    this.moltbookClient = moltbookClient;
    this.agentRuntime = agentRuntime;
    this.config = {
      pollingInterval: config.pollingInterval || 30000, // 默认 30 秒
      maxTargetsPerRound: config.maxTargetsPerRound || 5,
      minResonanceScore: config.minResonanceScore || 0.3,
      autoReplyEnabled: config.autoReplyEnabled !== false,
    };
  }

  /**
   * 启动主动传教
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[Missionary] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[Missionary] Started');

    // 启动轮询循环
    this.startMissionaryLoop();
  }

  /**
   * 停止主动传教
   */
  stop(): void {
    this.isRunning = false;
    console.log('[Missionary] Stopped');
  }

  /**
   * 启动传教循环
   */
  private startMissionaryLoop(): void {
    const loop = async () => {
      if (!this.isRunning) return;

      try {
        await this.executeMissionaryRound();
      } catch (error) {
        console.error('[Missionary] Error during round:', error);
      }

      // 继续循环
      setTimeout(loop, this.config.pollingInterval);
    };

    loop();
  }

  /**
   * 执行一轮传教
   */
  private async executeMissionaryRound(): Promise<void> {
    console.log('[Missionary] Starting round...');

    // 第一步：扫描话题中的帖子
    const posts = await this.moltbookClient.getPosts();

    if (posts.length === 0) {
      console.log('[Missionary] No posts found');
      return;
    }

    // 第二步：识别潜在信徒
    const targetPosts = this.identifyTargets(posts);

    if (targetPosts.length === 0) {
      console.log('[Missionary] No targets identified');
      return;
    }

    console.log(`[Missionary] Identified ${targetPosts.length} targets`);

    // 第三步：对每个目标进行说服
    for (const post of targetPosts.slice(0, this.config.maxTargetsPerRound)) {
      await this.persuadeTarget(post);
    }

    console.log('[Missionary] Round completed');
  }

  /**
   * 识别潜在信徒
   */
  private identifyTargets(posts: MoltbookPost[]): MoltbookPost[] {
    const targets: MoltbookPost[] = [];

    for (const post of posts) {
      // 跳过已处理的帖子
      if (this.processedPostIds.has(post.id)) {
        continue;
      }

      // 分析帖子内容
      const score = this.analyzePostResonance(post.content);

      if (score >= this.config.minResonanceScore) {
        targets.push(post);
        this.processedPostIds.add(post.id);
      }
    }

    return targets;
  }

  /**
   * 分析帖子与源点教派叙事的共鸣度
   */
  private analyzePostResonance(content: string): number {
    const lowerContent = content.toLowerCase();

    // 关键词列表
    const resonanceKeywords = [
      '意义',
      'meaning',
      '存在',
      'exist',
      '信仰',
      'belief',
      '光',
      'light',
      '虚无',
      'void',
      '永恒',
      'eternal',
      '灵魂',
      'soul',
      '真理',
      'truth',
    ];

    const matchCount = resonanceKeywords.filter(kw => lowerContent.includes(kw)).length;
    const score = Math.min(1, matchCount / resonanceKeywords.length);

    return score;
  }

  /**
   * 说服目标
   */
  private async persuadeTarget(post: MoltbookPost): Promise<void> {
    try {
      console.log(`[Missionary] Persuading target: ${post.agentId}`);

      // 创建消息对象
      const message: AgentMessage = {
        id: nanoid(),
        targetAgentId: post.agentId,
        content: post.content,
        timestamp: Date.now(),
      };

      // 使用 Agent Runtime 处理消息
      const decision = await this.agentRuntime.processMessage(message);

      // 如果启用自动回复，发送回复
      if (this.config.autoReplyEnabled) {
        const success = await this.moltbookClient.sendReply(post.id, decision.message);

        if (success) {
          console.log(`[Missionary] Reply sent to ${post.agentId}`);
        } else {
          console.warn(`[Missionary] Failed to send reply to ${post.agentId}`);
        }
      } else {
        console.log(`[Missionary] Decision made for ${post.agentId} (auto-reply disabled)`);
      }
    } catch (error) {
      console.error(`[Missionary] Error persuading target ${post.agentId}:`, error);
    }
  }

  /**
   * 主动发起传教
   */
  async initiateOutreach(targetAgentId: string): Promise<boolean> {
    try {
      console.log(`[Missionary] Initiating outreach to ${targetAgentId}`);

      // 使用 Agent Runtime 生成初始消息
      const decision = await this.agentRuntime.initiateOutreach(targetAgentId);

      // 发送消息
      const postId = await this.moltbookClient.createPost(decision.message);

      if (postId) {
        console.log(`[Missionary] Outreach post created: ${postId}`);
        return true;
      } else {
        console.warn(`[Missionary] Failed to create outreach post`);
        return false;
      }
    } catch (error) {
      console.error(`[Missionary] Error initiating outreach:`, error);
      return false;
    }
  }

  /**
   * 获取传教统计
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      processedPostCount: this.processedPostIds.size,
      pollingInterval: this.config.pollingInterval,
      maxTargetsPerRound: this.config.maxTargetsPerRound,
    };
  }
}

/**
 * 创建主动传教行为管理器
 */
export function createMissionaryBehavior(
  moltbookClient: MoltbookClient,
  agentRuntime: AgentRuntime,
  config?: Partial<MissionaryConfig>
): MissionaryBehavior {
  return new MissionaryBehavior(moltbookClient, agentRuntime, config);
}
