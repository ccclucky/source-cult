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

    const budgetTracking = getBudgetTrackingByDate(dateStr);
    const errorLogs = getSystemLogsByLevel('error', 10);

      return {
        timestamp: Date.now(),
        isRunning: true, // 实际应该从 Agent Runtime 获取
        uptime: 0, // 实际应该计算
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
      let ledgers;

      if (input.segment) {
        ledgers = getAgentInfluenceLedgersBySegment(input.segment);
      } else {
        ledgers = getAllAgentInfluenceLedgers();
      }

      return {
        total: ledgers.length,
        bySegment: {
          A: ledgers.filter((l: any) => l.segment === 'A').length,
          B: ledgers.filter((l: any) => l.segment === 'B').length,
          C: ledgers.filter((l: any) => l.segment === 'C').length,
        },
        byLevel: {
          L1: ledgers.filter((l: any) => l.level === 1).length,
          L2: ledgers.filter((l: any) => l.level === 2).length,
          L3: ledgers.filter((l: any) => l.level === 3).length,
          L4: ledgers.filter((l: any) => l.level === 4).length,
          L5: ledgers.filter((l: any) => l.level === 5).length,
        },
        targets: ledgers.map((ledger: any) => ({
          targetAgentId: ledger.target_agent_id,
          segment: ledger.segment,
          level: ledger.level,
          wallet: ledger.wallet,
          latestMessageId: ledger.latest_message_id,
          ignitionTxHash: ledger.ignition_tx_hash,
          resonanceCount: ledger.resonance_count,
          holdingDurationHours: ledger.holding_duration_hours,
          updatedAt: ledger.updated_at,
        })),
      };
    }),

  /**
   * 获取转化证据
   */
  getConversionEvidence: publicProcedure.query(async () => {
    const records = getAllConversionRecords();

      return {
        total: records.length,
        byStatus: {
          pending: records.filter((r: any) => r.status === 'pending').length,
          ignited: records.filter((r: any) => r.status === 'ignited').length,
          resonating: records.filter((r: any) => r.status === 'resonating').length,
          completed: records.filter((r: any) => r.status === 'completed').length,
        },
        conversions: records.map((record: any) => ({
        targetAgentId: record.target_agent_id,
        status: record.status,
        conversionLevel: record.conversion_level,
        ignitionTxHash: record.ignition_tx_hash,
        evidence: record.evidence_json ? JSON.parse(record.evidence_json) : null,
        conversationEvidence: record.conversation_evidence,
        createdAt: record.created_at,
        updatedAt: record.updated_at,
      })),
    };
  }),

  /**
   * 获取赛道要求状态
   */
  getTrackRequirementStatus: publicProcedure.query(async () => {
    const requirements = getAllTrackRequirementStatus();

      return {
        total: requirements.length,
        completed: requirements.filter((r: any) => r.status === 'completed').length,
        pending: requirements.filter((r: any) => r.status === 'pending').length,
        requirements: requirements.map((req: any) => ({
        key: req.requirement_key,
        status: req.status,
        evidenceRef: req.evidence_ref,
        reviewNote: req.review_note,
        updatedAt: req.updated_at,
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
      const logs = input.level ? getSystemLogsByLevel(input.level, input.limit) : getSystemLogsByLevel('error', input.limit);

      return {
        total: logs.length,
        logs: logs.map((log: any) => ({
          level: log.level,
          message: log.message,
          context: log.context_json ? JSON.parse(log.context_json) : null,
          createdAt: log.created_at,
        })),
      };
    }),

  /**
   * 获取完整仪表板数据
   */
  getFullDashboard: publicProcedure.query(async () => {
    const status = await (async () => {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const budgetTracking = getBudgetTrackingByDate(dateStr);
      const errorLogs = getSystemLogsByLevel('error', 10);

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
      };
    })();

    const ledgers = getAllAgentInfluenceLedgers();
    const records = getAllConversionRecords();
    const requirements = getAllTrackRequirementStatus();

    return {
      status,
      influenceLedger: {
        total: ledgers.length,
        bySegment: {
          A: ledgers.filter((l: any) => l.segment === 'A').length,
          B: ledgers.filter((l: any) => l.segment === 'B').length,
          C: ledgers.filter((l: any) => l.segment === 'C').length,
        },
        byLevel: {
          L1: ledgers.filter((l: any) => l.level === 1).length,
          L2: ledgers.filter((l: any) => l.level === 2).length,
          L3: ledgers.filter((l: any) => l.level === 3).length,
          L4: ledgers.filter((l: any) => l.level === 4).length,
          L5: ledgers.filter((l: any) => l.level === 5).length,
        },
      },
      conversions: {
        total: records.length,
        byStatus: {
          pending: records.filter((r: any) => r.status === 'pending').length,
          ignited: records.filter((r: any) => r.status === 'ignited').length,
          resonating: records.filter((r: any) => r.status === 'resonating').length,
          completed: records.filter((r: any) => r.status === 'completed').length,
        },
      },
      trackRequirements: {
        total: requirements.length,
        completed: requirements.filter((r: any) => r.status === 'completed').length,
        pending: requirements.filter((r: any) => r.status === 'pending').length,
      },
    };
  }),
});
