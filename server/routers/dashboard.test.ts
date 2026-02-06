import { describe, expect, it, beforeEach, vi } from 'vitest';
import { dashboardRouter } from './dashboard';

// Mock 数据库函数
vi.mock('../../backend/src/database/db', () => ({
  getAllAgentInfluenceLedgers: vi.fn(() => [
    {
      target_agent_id: 'agent-1',
      segment: 'A',
      level: 3,
      wallet: '0x123',
      latest_message_id: 'msg-1',
      ignition_tx_hash: 'tx-1',
      resonance_count: 5,
      holding_duration_hours: 24,
      updated_at: Date.now(),
    },
    {
      target_agent_id: 'agent-2',
      segment: 'B',
      level: 2,
      wallet: '0x456',
      latest_message_id: 'msg-2',
      ignition_tx_hash: null,
      resonance_count: 3,
      holding_duration_hours: 12,
      updated_at: Date.now(),
    },
  ]),
  getAllConversionRecords: vi.fn(() => [
    {
      target_agent_id: 'agent-1',
      status: 'ignited',
      conversion_level: 3,
      ignition_tx_hash: 'tx-1',
      evidence_json: JSON.stringify({ proof: 'test' }),
      conversation_evidence: 'msg-1',
      created_at: Date.now(),
      updated_at: Date.now(),
    },
  ]),
  getAllTrackRequirementStatus: vi.fn(() => [
    {
      requirement_key: 'agent_persuasion',
      status: 'completed',
      evidence_ref: 'tx-1',
      review_note: 'Agent successfully persuaded 3 agents',
      updated_at: Date.now(),
    },
    {
      requirement_key: 'token_recognition',
      status: 'pending',
      evidence_ref: null,
      review_note: null,
      updated_at: Date.now(),
    },
  ]),
  getBudgetTrackingByDate: vi.fn(() => ({
    api_calls_count: 150,
    estimated_cost_usd: 2.5,
    llm_tokens_used: 5000,
    status: 'normal',
  })),
  getSystemLogsByLevel: vi.fn(() => [
    {
      level: 'error',
      message: 'Test error',
      context_json: null,
      created_at: Date.now(),
    },
  ]),
  getAgentInfluenceLedgersBySegment: vi.fn((segment: string) => [
    {
      target_agent_id: 'agent-1',
      segment,
      level: 3,
      wallet: '0x123',
      latest_message_id: 'msg-1',
      ignition_tx_hash: 'tx-1',
      resonance_count: 5,
      holding_duration_hours: 24,
      updated_at: Date.now(),
    },
  ]),
}));

describe('Dashboard Router', () => {
  describe('getRunningStatus', () => {
    it('should return running status with budget info', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getRunningStatus();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('isRunning');
      expect(result.isRunning).toBe(true);
      expect(result).toHaveProperty('budget');
      expect(result.budget?.apiCalls).toBe(150);
      expect(result.budget?.estimatedCostUsd).toBe(2.5);
    });

    it('should include error count', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getRunningStatus();

      expect(result).toHaveProperty('errorCount');
      expect(result.errorCount).toBe(1);
    });
  });

  describe('getInfluenceLedger', () => {
    it('should return all ledgers when no segment specified', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getInfluenceLedger({});

      expect(result).toHaveProperty('total');
      expect(result.total).toBe(2);
      expect(result).toHaveProperty('bySegment');
      expect(result).toHaveProperty('byLevel');
    });

    it('should return filtered ledgers by segment', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getInfluenceLedger({ segment: 'A' });

      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('targets');
    });

    it('should include level distribution', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getInfluenceLedger({});

      expect(result.byLevel).toHaveProperty('L1');
      expect(result.byLevel).toHaveProperty('L2');
      expect(result.byLevel).toHaveProperty('L3');
      expect(result.byLevel).toHaveProperty('L4');
      expect(result.byLevel).toHaveProperty('L5');
    });
  });

  describe('getConversionEvidence', () => {
    it('should return conversion records with status breakdown', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getConversionEvidence();

      expect(result).toHaveProperty('total');
      expect(result.total).toBe(1);
      expect(result).toHaveProperty('byStatus');
      expect(result.byStatus).toHaveProperty('pending');
      expect(result.byStatus).toHaveProperty('ignited');
      expect(result.byStatus).toHaveProperty('completed');
    });

    it('should include conversion details', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getConversionEvidence();

      expect(result).toHaveProperty('conversions');
      expect(Array.isArray(result.conversions)).toBe(true);
      expect(result.conversions[0]).toHaveProperty('targetAgentId');
      expect(result.conversions[0]).toHaveProperty('status');
      expect(result.conversions[0]).toHaveProperty('conversionLevel');
    });
  });

  describe('getTrackRequirementStatus', () => {
    it('should return track requirements with completion status', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getTrackRequirementStatus();

      expect(result).toHaveProperty('total');
      expect(result.total).toBe(2);
      expect(result).toHaveProperty('completed');
      expect(result.completed).toBe(1);
      expect(result).toHaveProperty('pending');
      expect(result.pending).toBe(1);
    });

    it('should include requirement details', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getTrackRequirementStatus();

      expect(result).toHaveProperty('requirements');
      expect(Array.isArray(result.requirements)).toBe(true);
      expect(result.requirements[0]).toHaveProperty('key');
      expect(result.requirements[0]).toHaveProperty('status');
    });
  });

  describe('getFullDashboard', () => {
    it('should return complete dashboard data', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getFullDashboard();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('influenceLedger');
      expect(result).toHaveProperty('conversions');
      expect(result).toHaveProperty('trackRequirements');
    });

    it('should include all required sections', async () => {
      const caller = dashboardRouter.createCaller({} as any);
      const result = await caller.getFullDashboard();

      expect(result.status).toHaveProperty('isRunning');
      expect(result.influenceLedger).toHaveProperty('total');
      expect(result.conversions).toHaveProperty('total');
      expect(result.trackRequirements).toHaveProperty('completed');
    });
  });
});
