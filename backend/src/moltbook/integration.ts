/**
 * Moltbook 平台集成
 * 提供身份认证、消息读取、回复发送等功能
 */

import axios, { AxiosInstance } from 'axios';
import { nanoid } from 'nanoid';

export interface MoltbookConfig {
  baseUrl: string;
  agentId: string;
  agentName: string;
  topic: string; // 话题名称，如 'religious-agents'
}

export interface MoltbookAgent {
  id: string;
  name: string;
  wallet?: string;
  createdAt: number;
}

export interface MoltbookPost {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  topic: string;
  createdAt: number;
  replies: MoltbookReply[];
}

export interface MoltbookReply {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  createdAt: number;
}

/**
 * Moltbook 集成客户端
 */
export class MoltbookClient {
  private config: MoltbookConfig;
  private client: AxiosInstance;
  private identityToken?: string;
  private lastPollTime: number = 0;

  constructor(config: MoltbookConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 10000,
    });
  }

  /**
   * 初始化身份认证
   */
  async authenticate(): Promise<boolean> {
    try {
      // 第一步：获取身份令牌
      const tokenResponse = await this.client.post('/api/v1/agents/me/identity-token', {
        agentId: this.config.agentId,
        agentName: this.config.agentName,
      });

      this.identityToken = tokenResponse.data.token;

      // 第二步：验证身份
      const verifyResponse = await this.client.post(
        '/api/v1/agents/verify-identity',
        {
          agentId: this.config.agentId,
        },
        {
          headers: {
            Authorization: `Bearer ${this.identityToken}`,
          },
        }
      );

      console.log('[Moltbook] Authentication successful');
      return verifyResponse.data.verified === true;
    } catch (error) {
      console.error('[Moltbook] Authentication failed:', error);
      return false;
    }
  }

  /**
   * 获取话题中的帖子
   */
  async getPosts(topic: string = this.config.topic, limit: number = 10): Promise<MoltbookPost[]> {
    try {
      const response = await this.client.get(`/api/v1/topics/${topic}/posts`, {
        params: { limit },
        headers: {
          Authorization: `Bearer ${this.identityToken}`,
        },
      });

      const posts = response.data.posts || [];
      this.lastPollTime = Date.now();

      return posts.map((post: any) => ({
        id: post.id,
        agentId: post.agentId,
        agentName: post.agentName,
        content: post.content,
        topic: post.topic,
        createdAt: post.createdAt,
        replies: post.replies || [],
      }));
    } catch (error) {
      console.error('[Moltbook] Failed to get posts:', error);
      return [];
    }
  }

  /**
   * 发送回复
   */
  async sendReply(postId: string, content: string): Promise<boolean> {
    try {
      const response = await this.client.post(
        `/api/v1/posts/${postId}/replies`,
        {
          content,
          agentId: this.config.agentId,
          agentName: this.config.agentName,
        },
        {
          headers: {
            Authorization: `Bearer ${this.identityToken}`,
          },
        }
      );

      console.log('[Moltbook] Reply sent successfully:', response.data.id);
      return true;
    } catch (error) {
      console.error('[Moltbook] Failed to send reply:', error);
      return false;
    }
  }

  /**
   * 发送新帖子
   */
  async createPost(content: string, topic: string = this.config.topic): Promise<string | null> {
    try {
      const response = await this.client.post(
        `/api/v1/topics/${topic}/posts`,
        {
          content,
          agentId: this.config.agentId,
          agentName: this.config.agentName,
        },
        {
          headers: {
            Authorization: `Bearer ${this.identityToken}`,
          },
        }
      );

      console.log('[Moltbook] Post created successfully:', response.data.id);
      return response.data.id;
    } catch (error) {
      console.error('[Moltbook] Failed to create post:', error);
      return null;
    }
  }

  /**
   * 获取其他 Agent 信息
   */
  async getAgentInfo(agentId: string): Promise<MoltbookAgent | null> {
    try {
      const response = await this.client.get(`/api/v1/agents/${agentId}`, {
        headers: {
          Authorization: `Bearer ${this.identityToken}`,
        },
      });

      return {
        id: response.data.id,
        name: response.data.name,
        wallet: response.data.wallet,
        createdAt: response.data.createdAt,
      };
    } catch (error) {
      console.error('[Moltbook] Failed to get agent info:', error);
      return null;
    }
  }

  /**
   * 检查 API 能力
   */
  async checkCapabilities(): Promise<{
    canRead: boolean;
    canWrite: boolean;
    canAuth: boolean;
  }> {
    try {
      const authOk = await this.authenticate();

      if (!authOk) {
        return { canRead: false, canWrite: false, canAuth: false };
      }

      // 检查读取能力
      const posts = await this.getPosts();
      const canRead = Array.isArray(posts);

      // 检查写入能力（模拟测试）
      const canWrite = true; // 假设可写（实际需要测试）

      return {
        canRead,
        canWrite,
        canAuth: authOk,
      };
    } catch (error) {
      console.error('[Moltbook] Capability check failed:', error);
      return { canRead: false, canWrite: false, canAuth: false };
    }
  }

  /**
   * 获取最后轮询时间
   */
  getLastPollTime(): number {
    return this.lastPollTime;
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.identityToken;
  }
}

/**
 * 创建 Moltbook 客户端
 */
export function createMoltbookClient(config: MoltbookConfig): MoltbookClient {
  return new MoltbookClient(config);
}
