import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { CostController, CostStatus, initializeCostController } from './costController';
import path from 'path';
import fs from 'fs';

describe('CostController', () => {
  let controller: CostController;
  const testDbPath = path.join(__dirname, 'test_cost.db');

  beforeEach(() => {
    // 清理测试数据库
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    controller = initializeCostController(testDbPath);
  });

  afterEach(() => {
    controller.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('成本追踪', () => {
    it('应该正确记录 API 调用成本', () => {
      // Flash 模型：1000 input tokens + 500 output tokens
      // 成本 = (1000/100000)*0.075 + (500/100000)*0.3 = 0.00075 + 0.0015 = 0.00225
      controller.recordApiCall(1000, 500, 'flash');

      const status = controller.getTodayStatus();
      expect(status.cost).toBeCloseTo(0.00225, 5);
      expect(status.status).toBe(CostStatus.NORMAL);
    });

    it('应该累计多次 API 调用的成本', () => {
      controller.recordApiCall(1000, 500, 'flash');
      controller.recordApiCall(1000, 500, 'flash');

      const status = controller.getTodayStatus();
      expect(status.cost).toBeCloseTo(0.0045, 5);
    });

    it('应该区分 Flash 和 Pro 模型的成本', () => {
      controller.recordApiCall(1000, 500, 'flash');
      const flashStatus = controller.getTodayStatus();

      // 清空数据库重新测试
      controller.close();
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
      controller = initializeCostController(testDbPath);

      controller.recordApiCall(1000, 500, 'pro');
      const proStatus = controller.getTodayStatus();

      // Pro 模型成本应该更高
      expect(proStatus.cost).toBeGreaterThan(flashStatus.cost);
    });
  });

  describe('成本状态管理', () => {
    it('应该在成本低于 $1.5 时返回 NORMAL 状态', () => {
      // 添加 $1 的成本
      for (let i = 0; i < 444; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const status = controller.getTodayStatus();
      expect(status.status).toBe(CostStatus.NORMAL);
      expect(status.cost).toBeLessThan(1.5);
    });

    it('应该在成本在 $1.5-$1.9 之间时返回 WARNING 状态', () => {
      // 添加约 $1.6 的成本
      for (let i = 0; i < 711; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const status = controller.getTodayStatus();
      expect(status.status).toBe(CostStatus.WARNING);
      expect(status.cost).toBeGreaterThanOrEqual(1.5);
      expect(status.cost).toBeLessThan(1.9);
    });

    it('应该在成本超过 $1.9 时返回 CRITICAL 状态', () => {
      // 添加约 $2 的成本
      for (let i = 0; i < 889; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const status = controller.getTodayStatus();
      expect(status.status).toBe(CostStatus.CRITICAL);
      expect(status.cost).toBeGreaterThanOrEqual(1.9);
    });
  });

  describe('熔断机制', () => {
    it('应该在成本正常时允许 API 调用', () => {
      const canCall = controller.canMakeApiCall();
      expect(canCall).toBe(true);
    });

    it('应该在成本超过临界值时阻止 API 调用', () => {
      // 添加约 $2 的成本
      for (let i = 0; i < 889; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const canCall = controller.canMakeApiCall();
      expect(canCall).toBe(false);
    });
  });

  describe('模型推荐', () => {
    it('应该在成本正常时推荐 Pro 模型', () => {
      const model = controller.getRecommendedModel();
      expect(model).toBe('pro');
    });

    it('应该在成本警告时推荐 Flash 模型', () => {
      // 添加约 $1.6 的成本
      for (let i = 0; i < 711; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const model = controller.getRecommendedModel();
      expect(model).toBe('flash');
    });

    it('应该在成本临界时推荐规则引擎', () => {
      // 添加约 $2 的成本
      for (let i = 0; i < 889; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const model = controller.getRecommendedModel();
      expect(model).toBe('rules');
    });
  });

  describe('成本摘要', () => {
    it('应该返回正确的成本摘要', () => {
      controller.recordApiCall(1000, 500, 'flash');

      const summary = controller.getSummary();
      expect(summary).toHaveProperty('today');
      expect(summary).toHaveProperty('dailyBudget');
      expect(summary.dailyBudget).toBe(2.0);
      expect(summary.warningThreshold).toBe(1.5);
      expect(summary.criticalThreshold).toBe(1.9);
    });

    it('应该计算正确的剩余预算', () => {
      controller.recordApiCall(1000, 500, 'flash');

      const status = controller.getTodayStatus();
      expect(status.remaining).toBeCloseTo(2.0 - status.cost, 5);
    });

    it('应该计算正确的百分比', () => {
      controller.recordApiCall(1000, 500, 'flash');

      const status = controller.getTodayStatus();
      expect(status.percentage).toBeCloseTo((status.cost / 2.0) * 100, 2);
    });
  });

  describe('历史数据', () => {
    it('应该返回历史成本数据', () => {
      controller.recordApiCall(1000, 500, 'flash');

      const history = controller.getHistoricalData(7);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });
});
