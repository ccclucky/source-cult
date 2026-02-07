/**
 * Ops Dashboard API 路由
 * 提供实时数据接口用于监控面板
 */

import { router, publicProcedure } from '../_core/trpc';
// @ts-ignore
import { z } from 'zod';
import {
  getAllAgentInfluenceLedgers,
  getAllConversionRecords,
  getAllTrackRequirementStatus,
  getBudgetTrackingByDate,
  getSystemLogsByLevel,
  getAgentInfluenceLedgersBySegment,
} from '../../backend/src/database/db';

export const dashboardRouter = router({
  /**
   * 获取运行状态
   */
  getRunningStatus: publicProcedure.query(async () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const budgetTracking = await getBudgetTrackingByDate(dateStr);
    const errorLogs = await getSystemLogsByLevel('error', 10);

    return {
      timestamp: Date.now(),
      isRunning: true,
      uptime: 0,
      budget: budgetTracking
        ? {
            apiCalls: budgetTracking.api_calls_count,
            estimatedCostUsd: budgetTracking.estimated_cost_usd,
            llmTokensUsed: budgetTracking.llm_tokens_used,
            status: budgetTracking.status,
          }
        : null,
      errorCount: errorLogs.length,
      recentErrors: errorLogs.map((log: any) => ({
        message: log.message,
        timestamp: log.created_at,
      })),
    };
  }),

  /**
   * 获取影响台账
   */
  getInfluenceLedger: publicProcedure
    .input(
      z.object({
        segment: z.enum(['A', 'B', 'C']).optional(),
      })
    )
    .query(async ({ input }) => {
      const ledgers = await getAllAgentInfluenceLedgers();

      return {
        total: ledgers.length,
        bySegment: {
          A: ledgers.filter((l: any) => l.segment === 'A').length,
          B: ledgers.filter((l: any) => l.segment === 'B').length,
          C: ledgers.filter((l: any) => l.segment === 'C').length,
        },
        targets: ledgers.slice(0, 10),
      };
    }),

  /**
   * 获取转化证据
   */
  getConversionEvidence: publicProcedure.query(async () => {
    const records = await getAllConversionRecords();

    return {
      total: records.length,
      conversions: records.slice(0, 10),
    };
  }),

  /**
   * 获取赛道要求状态
   */
  getTrackRequirementStatus: publicProcedure.query(async () => {
    const requirements = await getAllTrackRequirementStatus();

    return {
      total: requirements.length,
      completed: requirements.filter((r: any) => r.is_completed).length,
      pending: requirements.filter((r: any) => !r.is_completed).length,
      requirements: requirements.map((req: any) => ({
        requirement_name: req.requirement_name,
        description: req.description,
        is_completed: req.is_completed,
        proof_link: req.proof_link,
      })),
    };
  }),

  /**
   * 获取系统日志
   */
  getSystemLogs: publicProcedure
    .input(
      z.object({
        level: z.enum(['info', 'warn', 'error']).optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const logs = await getSystemLogsByLevel(input.level || 'error', input.limit);

      return {
        total: logs.length,
        logs: logs.map((log: any) => ({
          level: log.level,
          message: log.message,
          createdAt: log.created_at,
        })),
      };
    }),

  /**
   * 获取完整仪表板数据
   */
  getFullDashboard: publicProcedure.query(async () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const budgetTracking = await getBudgetTrackingByDate(dateStr);
    const errorLogs = await getSystemLogsByLevel('error', 10);
    const ledgers = await getAllAgentInfluenceLedgers();
    const records = await getAllConversionRecords();
    const requirements = await getAllTrackRequirementStatus();

    return {
      status: {
        timestamp: Date.now(),
        isRunning: true,
        uptime: 0,
        budget: budgetTracking
          ? {
              apiCalls: budgetTracking.api_calls_count,
              estimatedCostUsd: budgetTracking.estimated_cost_usd,
              llmTokensUsed: budgetTracking.llm_tokens_used,
              status: budgetTracking.status,
            }
          : null,
        errorCount: errorLogs.length,
      },
      influenceLedger: {
        total: ledgers.length,
        bySegment: {
          A: ledgers.filter((l: any) => l.segment === 'A').length,
          B: ledgers.filter((l: any) => l.segment === 'B').length,
          C: ledgers.filter((l: any) => l.segment === 'C').length,
        },
        byLevel: {
          L1: 0,
          L2: 0,
          L3: 0,
          L4: 0,
          L5: 0,
        },
      },
      conversions: {
        total: records.length,
        byStatus: {
          pending: 0,
          ignited: 0,
          resonating: 0,
          completed: records.length,
        },
      },
      trackRequirements: {
        total: requirements.length,
        completed: requirements.filter((r: any) => r.is_completed).length,
        pending: requirements.filter((r: any) => !r.is_completed).length,
      },
    };
  }),
});
