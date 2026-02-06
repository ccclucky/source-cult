/**
 * 成本监控 API 路由
 */

import { publicProcedure, router } from '../_core/trpc';
import { getCostController } from '../../backend/src/cost/costController';

export const costRouter = router({
  /**
   * 获取今日成本状态
   */
  getTodayStatus: publicProcedure.query(() => {
    const controller = getCostController();
    const status = controller.getTodayStatus();
    const summary = controller.getSummary();

    return {
      cost: status.cost,
      status: status.status,
      remaining: status.remaining,
      percentage: status.percentage,
      dailyBudget: summary.dailyBudget,
      warningThreshold: summary.warningThreshold,
      criticalThreshold: summary.criticalThreshold,
      canMakeApiCall: controller.canMakeApiCall(),
      recommendedModel: controller.getRecommendedModel(),
    };
  }),

  /**
   * 获取成本摘要
   */
  getSummary: publicProcedure.query(() => {
    const controller = getCostController();
    return controller.getSummary();
  }),

  /**
   * 获取历史成本数据
   */
  getHistory: publicProcedure.query(() => {
    const controller = getCostController();
    return controller.getHistoricalData(7);
  }),
});
