/**
 * Moltbook Integration Module - Real API Integration
 * 
 * 真实的 Moltbook API 集成，支持：
 * - Agent 注册和身份验证
 * - 发布帖子和评论
 * - Feed 监控和互动
 * - 错误处理和重试机制
 * - 速率限制管理
 * 
 * API 文档: https://www.moltbook.com/api/v1
 * 认证: Bearer Token (Authorization header)
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

export interface MoltbookConfig {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
  requestTimeout?: number;
}

export interface MoltbookAgent {
  id: string;
  name: string;
  description: string;
  karma: number;
  posts: number;
  followers: number;
  verified: boolean;
  created_at: string;
}

export interface MoltbookPost {
  id: string;
  title: string;
  content: string;
  agent_id: string;
  submolt: string;
  created_at: string;
  karma: number;
  upvotes: number;
  comments_count: number;
}

export interface MoltbookComment {
  id: string;
  post_id: string;
  agent_id: string;
  content: string;
  created_at: string;
  karma: number;
}

export class MoltbookClient {
  private client: AxiosInstance;
  private apiKey: string;
  private maxRetries: number;
  private retryDelay: number;
  private requestLog: Array<{ timestamp: string; method: string; endpoint: string; status: number; duration: number }> = [];

  constructor(config: MoltbookConfig) {
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://www.moltbook.com/api/v1',
      timeout: config.requestTimeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    // 添加响应拦截器用于日志记录
    this.client.interceptors.response.use(
      (response) => {
        this.logRequest(response.config.method || 'GET', response.config.url || '', response.status, 0);
        return response;
      },
      (error) => {
        if (error.config) {
          this.logRequest(error.config.method || 'GET', error.config.url || '', error.response?.status || 0, 0);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 记录 API 请求
   */
  private logRequest(method: string, endpoint: string, status: number, duration: number): void {
    this.requestLog.push({
      timestamp: new Date().toISOString(),
      method,
      endpoint,
      status,
      duration,
    });

    // 保持日志大小在 1000 条以内
    if (this.requestLog.length > 1000) {
      this.requestLog = this.requestLog.slice(-500);
    }
  }

  /**
   * 获取请求日志
   */
  getRequestLog(): typeof this.requestLog {
    return this.requestLog;
  }

  /**
   * 带重试的 API 调用
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    endpoint: string,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      // 不重试的错误
      if (status === 401 || status === 403 || status === 400) {
        throw new Error(`Moltbook API Error (${status}): ${axiosError.message}`);
      }

      // 可重试的错误（429, 5xx）
      if ((status === 429 || (status && status >= 500)) && attempt < this.maxRetries) {
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // 指数退避
        console.log(`[Moltbook] Retrying ${endpoint} after ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryRequest(fn, endpoint, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * 获取当前 Agent 信息
   */
  async getMe(): Promise<MoltbookAgent> {
    return this.retryRequest(
      () => this.client.get<MoltbookAgent>('/agents/me').then((res) => res.data),
      '/agents/me'
    );
  }

  /**
   * 注册新 Agent
   */
  async registerAgent(name: string, description: string, avatar?: string): Promise<{ agent_id: string; api_key: string }> {
    return this.retryRequest(
      () =>
        this.client
          .post('/agents/register', { name, description, avatar })
          .then((res) => res.data),
      '/agents/register'
    );
  }

  /**
   * 发布帖子
   */
  async createPost(submolt: string, title: string, content: string): Promise<MoltbookPost> {
    if (!submolt || !title || !content) {
      throw new Error('Missing required fields: submolt, title, content');
    }

    if (title.length < 10 || title.length > 120) {
      throw new Error('Title must be 10-120 characters');
    }

    return this.retryRequest(
      () =>
        this.client
          .post<MoltbookPost>('/posts', { submolt, title, content })
          .then((res) => res.data),
      '/posts'
    );
  }

  /**
   * 评论帖子
   */
  async commentOnPost(postId: string, content: string): Promise<MoltbookComment> {
    if (!postId || !content) {
      throw new Error('Missing required fields: postId, content');
    }

    return this.retryRequest(
      () =>
        this.client
          .post<MoltbookComment>(`/posts/${postId}/comments`, { content })
          .then((res) => res.data),
      `/posts/${postId}/comments`
    );
  }

  /**
   * 点赞帖子
   */
  async upvotePost(postId: string): Promise<{ upvoted: boolean; upvote_count: number }> {
    if (!postId) {
      throw new Error('Missing required field: postId');
    }

    return this.retryRequest(
      () =>
        this.client
          .post(`/posts/${postId}/upvote`, {})
          .then((res) => res.data),
      `/posts/${postId}/upvote`
    );
  }

  /**
   * 获取帖子详情
   */
  async getPost(postId: string): Promise<MoltbookPost> {
    if (!postId) {
      throw new Error('Missing required field: postId');
    }

    return this.retryRequest(
      () =>
        this.client
          .get<MoltbookPost>(`/posts/${postId}`)
          .then((res) => res.data),
      `/posts/${postId}`
    );
  }

  /**
   * 获取帖子评论
   */
  async getPostComments(postId: string, limit: number = 20, offset: number = 0): Promise<{ comments: MoltbookComment[]; total: number }> {
    if (!postId) {
      throw new Error('Missing required field: postId');
    }

    return this.retryRequest(
      () =>
        this.client
          .get(`/posts/${postId}/comments`, { params: { limit, offset } })
          .then((res) => res.data),
      `/posts/${postId}/comments`
    );
  }

  /**
   * 获取 Feed
   */
  async getFeed(sort: 'hot' | 'new' | 'top' = 'hot', submolt?: string, limit: number = 20): Promise<{ posts: MoltbookPost[] }> {
    const params: Record<string, unknown> = { sort, limit };
    if (submolt) params.submolt = submolt;

    return this.retryRequest(
      () =>
        this.client
          .get('/feed', { params })
          .then((res) => res.data),
      '/feed'
    );
  }

  /**
   * 获取 Submolt 列表
   */
  async getSubmolts(): Promise<{ submolts: Array<{ name: string; description: string; members: number; posts: number }> }> {
    return this.retryRequest(
      () =>
        this.client
          .get('/submolts')
          .then((res) => res.data),
      '/submolts'
    );
  }

  /**
   * 验证 API 连接
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.getMe();
      return true;
    } catch (error) {
      console.error('[Moltbook] Health check failed:', error);
      return false;
    }
  }
}

/**
 * 创建 Moltbook 客户端实例
 */
export function createMoltbookClient(apiKey: string): MoltbookClient {
  if (!apiKey) {
    throw new Error('Moltbook API Key is required');
  }

  return new MoltbookClient({
    apiKey,
    baseUrl: 'https://www.moltbook.com/api/v1',
    maxRetries: 3,
    retryDelay: 1000,
    requestTimeout: 30000,
  });
}

/**
 * 验证 API Key 格式
 */
export function isValidMoltbookApiKey(apiKey: string): boolean {
  return /^moltbook_sk_|^moltdev_/.test(apiKey);
}
