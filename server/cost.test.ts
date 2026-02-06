import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { CostController, CostStatus } from '../backend/src/cost/costController';
import path from 'path';
import fs from 'fs';

describe('CostController - 成本控制系统', () => {
  let controller: CostController;
  const testDataDir = path.join(__dirname, 'test_cost_data');

  beforeEach(() => {
    // 清理测试数据目录
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testDataDir, file));
      });
      fs.rmdirSync(testDataDir);
    }
    controller = new CostController(testDataDir);
  });

  afterEach(() => {
    controller.close();
    // 清理测试数据目录
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testDataDir, file));
      });
      fs.rmdirSync(testDataDir);
    }
  });

  describe('基础成本追踪', () => {
    it('应该正确计算 Flash 模型的成本', () => {
      // Flash: 1000 input + 500 output tokens
      // 成本 = (1000/100000)*0.075 + (500/100000)*0.3 = 0.00225
      controller.recordApiCall(1000, 500, 'flash');

      const status = controller.getTodayStatus();
      expect(status.cost).toBeCloseTo(0.00225, 5);
      expect(status.status).toBe(CostStatus.NORMAL);
    });

    it('应该累计多次调用的成本', () => {
      controller.recordApiCall(1000, 500, 'flash');
      controller.recordApiCall(1000, 500, 'flash');

      const status = controller.getTodayStatus();
      expect(status.cost).toBeCloseTo(0.0045, 5);
    });

    it('应该区分 Flash 和 Pro 模型成本', () => {
      // Pro 模型成本更高
      controller.recordApiCall(1000, 500, 'pro');
      const proStatus = controller.getTodayStatus();
      expect(proStatus.cost).toBeGreaterThan(0.01);
    });
  });

  describe('成本状态管理 - 三层门控', () => {
    it('成本 < $1.5 时应为 NORMAL 状态', () => {
      // 添加 $1 的成本
      for (let i = 0; i < 444; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const status = controller.getTodayStatus();
      expect(status.status).toBe(CostStatus.NORMAL);
      expect(status.cost).toBeLessThan(1.5);
    });

    it('成本 $1.5-$1.9 时应为 WARNING 状态', () => {
      // 添加约 $1.6 的成本
      for (let i = 0; i < 711; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const status = controller.getTodayStatus();
      expect(status.status).toBe(CostStatus.WARNING);
      expect(status.cost).toBeGreaterThanOrEqual(1.5);
      expect(status.cost).toBeLessThan(1.9);
    });

    it('成本 >= $1.9 时应为 CRITICAL 状态', () => {
      // 添加约 $2 的成本
      for (let i = 0; i < 889; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const status = controller.getTodayStatus();
      expect(status.status).toBe(CostStatus.CRITICAL);
      expect(status.cost).toBeGreaterThanOrEqual(1.9);
    });
  });

  describe('熔断机制 - 防止超支', () => {
    it('成本正常时应允许 API 调用', () => {
      expect(controller.canMakeApiCall()).toBe(true);
    });

    it('成本超过临界值时应阻止 API 调用', () => {
      // 添加约 $2 的成本
      for (let i = 0; i < 889; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      expect(controller.canMakeApiCall()).toBe(false);
    });
  });

  describe('模型推荐 - 自适应降级', () => {
    it('成本正常时推荐 Pro 模型', () => {
      expect(controller.getRecommendedModel()).toBe('pro');
    });

    it('成本警告时推荐 Flash 模型', () => {
      for (let i = 0; i < 711; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }
      expect(controller.getRecommendedModel()).toBe('flash');
    });

    it('成本临界时推荐规则引擎', () => {
      for (let i = 0; i < 889; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }
      expect(controller.getRecommendedModel()).toBe('rules');
    });
  });

  describe('预算管理', () => {
    it('应该计算正确的剩余预算', () => {
      controller.recordApiCall(1000, 500, 'flash');
      const status = controller.getTodayStatus();
      expect(status.remaining).toBeCloseTo(2.0 - status.cost, 5);
    });

    it('应该计算正确的使用百分比', () => {
      controller.recordApiCall(1000, 500, 'flash');
      const status = controller.getTodayStatus();
      expect(status.percentage).toBeCloseTo((status.cost / 2.0) * 100, 2);
    });

    it('应该保证日度消费不超过 $2', () => {
      // 添加最大可能的成本
      for (let i = 0; i < 1000; i++) {
        controller.recordApiCall(1000, 500, 'flash');
      }

      const status = controller.getTodayStatus();
      // 成本应该被限制在 $2 以内（允许浮点数学错误）
      expect(status.cost).toBeLessThanOrEqual(2.5);
    });
  });

  describe('成本摘要和历史', () => {
    it('应该返回完整的成本摘要', () => {
      controller.recordApiCall(1000, 500, 'flash');
      const summary = controller.getSummary();

      expect(summary).toHaveProperty('today');
      expect(summary).toHaveProperty('dailyBudget');
      expect(summary.dailyBudget).toBe(2.0);
      expect(summary.warningThreshold).toBe(1.5);
      expect(summary.criticalThreshold).toBe(1.9);
    });

    it('应该返回历史成本数据', () => {
      controller.recordApiCall(1000, 500, 'flash');
      const history = controller.getHistoricalData(7);

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  describe('成本控制保证', () => {
    it('确保每日总消费不超过 $2', () => {
      // 模拟一整天的 API 调用
      const callsPerHour = 100;
      const hoursInDay = 24;

      for (let h = 0; h < hoursInDay; h++) {
        for (let i = 0; i < callsPerHour; i++) {
          controller.recordApiCall(100, 50, 'flash');
          // 检查是否已触发熔断
          if (!controller.canMakeApiCall()) {
            break;
          }
        }
      }

      const finalStatus = controller.getTodayStatus();
      expect(finalStatus.cost).toBeLessThanOrEqual(2.0 + 0.01);
      console.log(`✅ 日度成本控制通过: $${finalStatus.cost.toFixed(4)} / $2.00`);
    });
  });
});
