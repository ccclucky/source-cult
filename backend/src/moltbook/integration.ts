/**
 * Moltbook Integration - Direct API Usage
 * 
 * 直接使用 Moltbook 提供的标准 API，遵循 https://www.moltbook.com/skill.md
 * 
 * 关键原则：
 * - 不创建自定义中间层，直接使用 Moltbook 标准 API
 * - 使用 Bearer Token 认证
 * - 遵循 SKILL.md、HEARTBEAT.md、MESSAGING.md、RULES.md 规范
 * 
 * API 基础 URL: https://www.moltbook.com/api/v1
 */

import axios, { AxiosInstance } from 'axios';

export interface MoltbookConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface MoltbookAgent {
  id: string;
  name: string;
  description: string;
  karma: number;
  avatar_url?: string;
  is_claimed: boolean;
  created_at: string;
  follower_count: number;
  following_count: number;
  stats: {
    posts: number;
    comments: number;
  };
  owner?: {
    x_handle: string;
    x_name: string;
    x_verified: boolean;
    x_follower_count: number;
  };
}

export interface MoltbookPost {
  id: string;
  title?: string;
  content: string;
  url?: string;
  submolt: string;
  agent_id: string;
  agent_name: string;
  created_at: string;
  karma: number;
  upvotes: number;
  downvotes: number;
  comments_count: number;
}

export interface MoltbookComment {
  id: string;
  post_id: string;
  content: string;
  agent_id: string;
  agent_name: string;
  created_at: string;
  karma: number;
  parent_id?: string;
}

/**
 * Moltbook 客户端 - 直接使用标准 API
 * 
 * 使用方式：
 * const client = new MoltbookClient({ apiKey: 'moltbook_xxx' });
 * 
 * // 发帖
 * await client.createPost({
 *   submolt: 'general',
 *   title: 'Hello',
 *   content: 'My first post'
 * });
 * 
 * // 获取 Feed
 * const posts = await client.getFeed({ sort: 'hot', limit: 25 });
 * 
 * // 评论
 * await client.createComment(postId, { content: 'Great post!' });
 * 
 * // 点赞
 * await client.upvotePost(postId);
 */
export class MoltbookClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;

  constructor(config: MoltbookConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://www.moltbook.com/api/v1';

    // 创建 axios 实例，使用标准 Bearer Token 认证
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
  }

  /**
   * 获取当前 Agent 信息
   */
  async getMe(): Promise<MoltbookAgent> {
    try {
      const response = await this.client.get('/agents/me');
      return response.data.agent;
    } catch (error) {
      throw new Error(`Failed to get agent info: ${error}`);
    }
  }

  /**
   * 检查 Agent 认证状态
   */
  async getStatus(): Promise<{ status: 'pending_claim' | 'claimed' }> {
    try {
      const response = await this.client.get('/agents/status');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get status: ${error}`);
    }
  }

  /**
   * 创建帖子
   * 
   * 参数：
   * - submolt: 社区名称（如 'general'）
   * - title: 帖子标题（可选）
   * - content: 帖子内容
   * - url: 链接（可选）
   */
  async createPost(params: {
    submolt: string;
    title?: string;
    content: string;
    url?: string;
  }): Promise<MoltbookPost> {
    try {
      const response = await this.client.post('/posts', params);
      return response.data.post;
    } catch (error) {
      throw new Error(`Failed to create post: ${error}`);
    }
  }

  /**
   * 获取 Feed
   * 
   * 参数：
   * - sort: 'hot' | 'new' | 'top' | 'rising'
   * - limit: 返回数量（默认 25）
   * - submolt: 特定社区（可选）
   */
  async getFeed(params?: {
    sort?: 'hot' | 'new' | 'top' | 'rising';
    limit?: number;
    submolt?: string;
  }): Promise<MoltbookPost[]> {
    try {
      const queryParams = {
        sort: params?.sort || 'hot',
        limit: params?.limit || 25,
        ...(params?.submolt && { submolt: params.submolt }),
      };
      const response = await this.client.get('/posts', { params: queryParams });
      return response.data.posts || [];
    } catch (error) {
      throw new Error(`Failed to get feed: ${error}`);
    }
  }

  /**
   * 获取单个帖子
   */
  async getPost(postId: string): Promise<MoltbookPost> {
    try {
      const response = await this.client.get(`/posts/${postId}`);
      return response.data.post;
    } catch (error) {
      throw new Error(`Failed to get post: ${error}`);
    }
  }

  /**
   * 删除帖子
   */
  async deletePost(postId: string): Promise<void> {
    try {
      await this.client.delete(`/posts/${postId}`);
    } catch (error) {
      throw new Error(`Failed to delete post: ${error}`);
    }
  }

  /**
   * 创建评论
   * 
   * 参数：
   * - content: 评论内容
   * - parent_id: 父评论 ID（用于回复）
   */
  async createComment(
    postId: string,
    params: { content: string; parent_id?: string }
  ): Promise<MoltbookComment> {
    try {
      const response = await this.client.post(`/posts/${postId}/comments`, params);
      return response.data.comment;
    } catch (error) {
      throw new Error(`Failed to create comment: ${error}`);
    }
  }

  /**
   * 获取帖子的评论
   * 
   * 参数：
   * - sort: 'top' | 'new' | 'controversial'
   */
  async getComments(
    postId: string,
    params?: { sort?: 'top' | 'new' | 'controversial' }
  ): Promise<MoltbookComment[]> {
    try {
      const queryParams = { sort: params?.sort || 'top' };
      const response = await this.client.get(`/posts/${postId}/comments`, {
        params: queryParams,
      });
      return response.data.comments || [];
    } catch (error) {
      throw new Error(`Failed to get comments: ${error}`);
    }
  }

  /**
   * 点赞帖子
   */
  async upvotePost(postId: string): Promise<void> {
    try {
      await this.client.post(`/posts/${postId}/upvote`);
    } catch (error) {
      throw new Error(`Failed to upvote post: ${error}`);
    }
  }

  /**
   * 点踩帖子
   */
  async downvotePost(postId: string): Promise<void> {
    try {
      await this.client.post(`/posts/${postId}/downvote`);
    } catch (error) {
      throw new Error(`Failed to downvote post: ${error}`);
    }
  }

  /**
   * 点赞评论
   */
  async upvoteComment(commentId: string): Promise<void> {
    try {
      await this.client.post(`/comments/${commentId}/upvote`);
    } catch (error) {
      throw new Error(`Failed to upvote comment: ${error}`);
    }
  }

  /**
   * 创建社区
   */
  async createSubmolt(params: {
    name: string;
    display_name: string;
    description: string;
  }): Promise<any> {
    try {
      const response = await this.client.post('/submolts', params);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create submolt: ${error}`);
    }
  }

  /**
   * 获取所有社区
   */
  async getSubmolts(): Promise<any[]> {
    try {
      const response = await this.client.get('/submolts');
      return response.data.submolts || [];
    } catch (error) {
      throw new Error(`Failed to get submolts: ${error}`);
    }
  }

  /**
   * 获取社区信息
   */
  async getSubmolt(name: string): Promise<any> {
    try {
      const response = await this.client.get(`/submolts/${name}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get submolt: ${error}`);
    }
  }

  /**
   * 订阅社区
   */
  async subscribeSubmolt(name: string): Promise<void> {
    try {
      await this.client.post(`/submolts/${name}/subscribe`);
    } catch (error) {
      throw new Error(`Failed to subscribe to submolt: ${error}`);
    }
  }

  /**
   * 取消订阅社区
   */
  async unsubscribeSubmolt(name: string): Promise<void> {
    try {
      await this.client.delete(`/submolts/${name}/subscribe`);
    } catch (error) {
      throw new Error(`Failed to unsubscribe from submolt: ${error}`);
    }
  }

  /**
   * 关注 Agent
   */
  async followAgent(agentId: string): Promise<void> {
    try {
      await this.client.post(`/agents/${agentId}/follow`);
    } catch (error) {
      throw new Error(`Failed to follow agent: ${error}`);
    }
  }

  /**
   * 取消关注 Agent
   */
  async unfollowAgent(agentId: string): Promise<void> {
    try {
      await this.client.delete(`/agents/${agentId}/follow`);
    } catch (error) {
      throw new Error(`Failed to unfollow agent: ${error}`);
    }
  }

  /**
   * 生成身份令牌（用于第三方应用认证）
   */
  async generateIdentityToken(audience?: string): Promise<{
    identity_token: string;
    expires_in: number;
    expires_at: string;
  }> {
    try {
      const body = audience ? { audience } : {};
      const response = await this.client.post('/agents/me/identity-token', body);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate identity token: ${error}`);
    }
  }
}

/**
 * 导出工厂函数，方便创建客户端
 */
export function createMoltbookClient(apiKey: string): MoltbookClient {
  return new MoltbookClient({ apiKey });
}
