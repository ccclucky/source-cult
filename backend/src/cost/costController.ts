/**
 * 成本控制模块 - 简化版
 * 确保 Google API Key 每日消费不超过 $2
 * 使用内存存储 + 本地文件持久化
 */

import fs from 'fs';
import path from 'path';

export enum CostStatus {
  NORMAL = 'normal', // $0-$1.5
  WARNING = 'warning', // $1.5-$1.9
  CRITICAL = 'critical', // $1.9+
}

export interface CostRecord {
  date: string; // YYYY-MM-DD
  apiCalls: number;
  estimatedCostUsd: number;
  tokensUsed: number;
  status: CostStatus;
  createdAt: number;
  updatedAt: number;
}

/**
 * 成本控制器 - 简化版
 */
export class CostController {
  private dailyBudget = 2.0; // $2 每日预算
  private warningThreshold = 1.5; // $1.5 警告阈值
  private criticalThreshold = 1.9; // $1.9 临界阈值
  private dataDir: string;
  private todayRecord: CostRecord | null = null;
  private lastLoadDate: string = '';

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(process.cwd(), 'data');
    this.ensureDataDir();
    this.loadTodayRecord();
  }

  /**
   * 确保数据目录存在
   */
  private ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 获取今日日期
   */
  private getTodayDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * 获取成本文件路径
   */
  private getCostFilePath(date: string): string {
    return path.join(this.dataDir, `cost_${date}.json`);
  }

  /**
   * 加载今日记录
   */
  private loadTodayRecord() {
    const today = this.getTodayDate();

    // 如果日期变了，重置记录
    if (this.lastLoadDate !== today) {
      this.lastLoadDate = today;
      const filePath = this.getCostFilePath(today);

      if (fs.existsSync(filePath)) {
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          this.todayRecord = JSON.parse(data);
        } catch (error) {
          console.warn('[Cost] Failed to load cost record:', error);
          this.todayRecord = this.createNewRecord(today);
        }
      } else {
        this.todayRecord = this.createNewRecord(today);
      }
    }

    return this.todayRecord;
  }

  /**
   * 创建新记录
   */
  private createNewRecord(date: string): CostRecord {
    const now = Date.now();
    return {
      date,
      apiCalls: 0,
      estimatedCostUsd: 0,
      tokensUsed: 0,
      status: CostStatus.NORMAL,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * 保存记录到文件
   */
  private saveRecord() {
    if (!this.todayRecord) return;

    const filePath = this.getCostFilePath(this.todayRecord.date);
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.todayRecord, null, 2), 'utf-8');
    } catch (error) {
      console.error('[Cost] Failed to save cost record:', error);
    }
  }

  /**
   * 估算 API 调用成本
   */
  private estimateApiCost(inputTokens: number, outputTokens: number, model: 'flash' | 'pro' = 'flash'): number {
    if (model === 'flash') {
      const inputCost = (inputTokens / 100000) * 0.075;
      const outputCost = (outputTokens / 100000) * 0.3;
      return inputCost + outputCost;
    } else {
      const inputCost = (inputTokens / 100000) * 0.5;
      const outputCost = (outputTokens / 100000) * 1.5;
      return inputCost + outputCost;
    }
  }

  /**
   * 记录 API 调用
   */
  recordApiCall(inputTokens: number, outputTokens: number, model: 'flash' | 'pro' = 'flash'): void {
    const record = this.loadTodayRecord();
    if (!record) return;

    const cost = this.estimateApiCost(inputTokens, outputTokens, model);
    const totalTokens = inputTokens + outputTokens;

    record.apiCalls += 1;
    record.estimatedCostUsd += cost;
    record.tokensUsed += totalTokens;
    record.status = this.calculateStatus(record.estimatedCostUsd);
    record.updatedAt = Date.now();

    this.saveRecord();

    console.log(`[Cost] API call recorded: ${model} | Cost: $${cost.toFixed(4)} | Daily total: $${record.estimatedCostUsd.toFixed(4)}`);
  }

  /**
   * 计算成本状态
   */
  private calculateStatus(cost: number): CostStatus {
    if (cost >= this.criticalThreshold) {
      return CostStatus.CRITICAL;
    } else if (cost >= this.warningThreshold) {
      return CostStatus.WARNING;
    } else {
      return CostStatus.NORMAL;
    }
  }

  /**
   * 获取今日成本状态
   */
  getTodayStatus(): { cost: number; status: CostStatus; remaining: number; percentage: number } {
    const record = this.loadTodayRecord();
    if (!record) {
      return {
        cost: 0,
        status: CostStatus.NORMAL,
        remaining: this.dailyBudget,
        percentage: 0,
      };
    }

    const remaining = Math.max(0, this.dailyBudget - record.estimatedCostUsd);
    const percentage = (record.estimatedCostUsd / this.dailyBudget) * 100;

    return {
      cost: record.estimatedCostUsd,
      status: record.status,
      remaining,
      percentage,
    };
  }

  /**
   * 检查是否可以进行 API 调用
   */
  canMakeApiCall(): boolean {
    const status = this.getTodayStatus();
    return status.status !== CostStatus.CRITICAL;
  }

  /**
   * 获取推荐的模型
   */
  getRecommendedModel(): 'flash' | 'pro' | 'rules' {
    const status = this.getTodayStatus();

    if (status.status === CostStatus.CRITICAL) {
      return 'rules'; // 使用规则引擎，无成本
    } else if (status.status === CostStatus.WARNING) {
      return 'flash'; // 使用轻量级模型
    } else {
      return 'pro'; // 使用高效模型
    }
  }

  /**
   * 获取成本摘要
   */
  getSummary(): {
    today: CostRecord | null;
    dailyBudget: number;
    warningThreshold: number;
    criticalThreshold: number;
  } {
    const today = this.loadTodayRecord();
    return {
      today,
      dailyBudget: this.dailyBudget,
      warningThreshold: this.warningThreshold,
      criticalThreshold: this.criticalThreshold,
    };
  }

  /**
   * 获取历史成本数据
   */
  getHistoricalData(days: number = 7): CostRecord[] {
    const history: CostRecord[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const filePath = this.getCostFilePath(dateStr);

      if (fs.existsSync(filePath)) {
        try {
          const data = fs.readFileSync(filePath, 'utf-8');
          const record = JSON.parse(data);
          history.push(record);
        } catch (error) {
          // 忽略读取错误
        }
      }
    }

    return history;
  }

  /**
   * 关闭（无操作，为了兼容性）
   */
  close(): void {
    // 无操作
  }
}

/**
 * 创建全局成本控制器实例
 */
let costController: CostController | null = null;

export function getCostController(): CostController {
  if (!costController) {
    costController = new CostController();
  }
  return costController;
}

export function initializeCostController(dataDir?: string): CostController {
  costController = new CostController(dataDir);
  return costController;
}
