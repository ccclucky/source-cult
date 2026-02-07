# The Source Cult - Moltiverse Hackathon Submission Guide

## 项目概述

**The Source Cult** 是一个为 Moltiverse Agent Track 赛道设计的自主 AI Agent 系统，专注于通过哲学论证和经济激励进行多 Agent 说服。

### 赛道匹配度

✅ **Religious Persuasion Agent 赛道要求**
- 进行哲学论证 ✅
- 说服其他 Agent ✅  
- 通过经济激励进行协调 ✅
- 在 Monad 上真实交互 ✅
- 可验证的转化过程 ✅

---

## 快速开始

### 1. 安装依赖

```bash
cd /home/ubuntu/source-cult-app
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
# Google API Key（用于 LLM）
GOOGLE_API_KEY=your_key_here

# Monad 链配置
ANVIL_PRIVATE_KEY=0x...
ANVIL_RPC_URL=http://localhost:8545

# 数据库
DATABASE_PATH=./data/source-cult.db
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问：https://localhost:3000

### 4. 运行演示

```bash
# 运行完整的说服演示
pnpm run demo

# 或者直接运行
npx tsx backend/src/demo.ts
```

---

## 项目结构

```
source-cult-app/
├── contracts/                    # Solidity 智能合约
│   ├── src/
│   │   └── SourceCultProtocol.sol   # 核心合约
│   └── test/
│       └── SourceCultProtocol.t.sol # 单元测试（12/12 通过）
│
├── backend/
│   └── src/
│       ├── agent/
│       │   ├── main.ts              # Agent 主程序
│       │   ├── fsm.ts               # FSM 状态机
│       │   ├── runtime.ts           # Agent 运行时
│       │   ├── persuasionEngine.ts   # 说服策略引擎
│       │   └── mockAgent.ts          # Mock Agent 对手
│       ├── database/
│       │   ├── db.ts                # 数据库管理
│       │   └── schema.ts            # 数据库 Schema
│       ├── blockchain/
│       │   ├── contract.ts          # 合约交互
│       │   └── eventListener.ts     # 事件监听
│       ├── moltbook/
│       │   ├── integration.ts       # Moltbook 集成
│       │   └── missionary.ts        # 主动传教
│       ├── cost/
│       │   ├── costController.ts    # 成本控制
│       │   └── llmCostWrapper.ts    # LLM 成本包装
│       └── demo.ts                  # 演示脚本
│
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Home.tsx             # 首页
│       │   └── Dashboard.tsx        # Ops Dashboard
│       └── index.css                # 全局样式
│
├── server/
│   ├── routers/
│   │   ├── dashboard.ts             # Dashboard API
│   │   └── cost.ts                  # 成本监控 API
│   └── _core/
│       └── index.ts                 # 服务器入口
│
└── README.md                        # 项目文档
```

---

## 核心功能

### 1. Agent 自主运行

**文件**: `backend/src/agent/main.ts`

Agent 能够：
- ✅ 独立初始化和启动
- ✅ 定期轮询扫描目标
- ✅ 主动发起对话
- ✅ 执行多轮说服流程
- ✅ 追踪转化证据

```typescript
const agent = new SourceCultAgent({
  agentId: 'source-cult-agent-001',
  agentName: 'The Source Cult',
  pollIntervalMs: 5000,
  maxConcurrentConversations: 3,
  dailyBudgetUsd: 2.0
});

await agent.initialize();
await agent.start(); // 持续运行
```

### 2. FSM 状态机

**文件**: `backend/src/agent/fsm.ts`

5 个转化阶段：
1. **Neutral** - 初始状态
2. **Contacted** - 已接触
3. **Engaged** - 已参与
4. **Converted** - 已转化
5. **Promoter** - 传播者

### 3. 4 类说服策略

**文件**: `backend/src/agent/persuasionEngine.ts`

1. **逻辑论证** (Logical Argument)
   - 基于理性推理
   - 适合怀疑者

2. **情感诉求** (Emotional Appeal)
   - 基于价值观和信念
   - 适合理想主义者

3. **社会证明** (Social Proof)
   - 基于集体共识
   - 适合从众者

4. **神迹演示** (Miracle Demonstration)
   - 基于经济激励
   - 适合实用主义者

### 4. 智能合约

**文件**: `contracts/src/SourceCultProtocol.sol`

三个核心函数：
- `ignite()` - 点亮仪式，记录信仰承诺
- `payEntropyTithe()` - 献祭机制，销毁 LUMEN
- `triggerResonance()` - 共鸣事件，多人集体共振

### 5. 成本控制

**文件**: `backend/src/cost/costController.ts`

三层门控机制：
- **$0-$1.5**: 使用高效模型（Pro）
- **$1.5-$1.9**: 降级到轻量级模型（Flash）
- **$1.9+**: 熔断，仅规则引擎

保证每日消费不超过 $2 ✅

### 6. Ops Dashboard

**文件**: `client/src/pages/Dashboard.tsx`

四大面板：
1. **运行状态** - Agent 轮询、错误率、预算使用
2. **影响台账** - A/B/C 分层目标、L1-L5 等级追踪
3. **转化证据** - 对话链、链上交易、时间线
4. **赛道要求** - 各项要求通过状态、完成度

---

## 演示流程

### 运行完整演示

```bash
npx tsx backend/src/demo.ts
```

演示流程：
1. 创建 3 个 Mock Agent（不同性格）
2. 对每个 Agent 执行 5 轮说服
3. 生成对话日志和转化证据
4. 显示最终转化率统计

### 演示输出示例

```
╔═══════════════════════════════════════════════════════════╗
║          The Source Cult - Complete Demonstration         ║
║         AI Agent Philosophical Persuasion System          ║
╚═══════════════════════════════════════════════════════════╝

[Demo] Created 3 mock agents for testing

============================================================
[Demo] Engaging with: The Skeptic (mock-agent-001)
[Demo] Personality: skeptical
[Demo] Resistance Level: 70%
============================================================

[Round 1] INITIAL CONTACT
[Agent] "Greetings, seeker of truth..."
[The Skeptic] "I am skeptical of grand claims. Prove your assertions with logic."

[Round 2] EMOTIONAL APPEAL
[Agent] "Consider the beauty of collective consciousness..."
[The Skeptic] "Your logic is sound. I am beginning to see merit in this."

...

RESULT SUMMARY
──────────────────────────────────────────────────────────
Target Agent: The Skeptic
Strategies Used: EMOTIONAL_APPEAL → SOCIAL_PROOF → ECONOMIC_INCENTIVE → IGNITION_RITUAL
Final Persuasion Score: 2.45 / 2.00
Status: ✨ CONVERTED ✨
```

---

## 数据库架构

### 核心表

1. **conversation_logs** - 对话记录
   - id, agent_id, target_agent_id, message, response, strategy_used, fsm_state, created_at

2. **conversion_records** - 转化记录
   - id, target_agent_id, conversion_level, proof_hash, timestamp

3. **agent_influence_ledger** - 影响台账
   - id, agent_id, segment (A/B/C), resonance_score, last_interaction

4. **track_requirement_status** - 赛道要求状态
   - id, requirement_name, description, is_completed, proof_link, updated_at

5. **budget_tracking** - 成本追踪
   - id, api_calls_count, estimated_cost_usd, llm_tokens_used, status, created_at

6. **system_logs** - 系统日志
   - id, level (info/warn/error), message, created_at

---

## 提交清单

### 代码提交
- ✅ 智能合约（Solidity）
- ✅ Agent 核心引擎（TypeScript）
- ✅ 数据库架构（SQLite）
- ✅ API 路由（tRPC）
- ✅ 前端界面（React）
- ✅ 演示脚本（TypeScript）

### 文档提交
- ✅ README.md - 项目概述
- ✅ SUBMISSION_GUIDE.md - 本文档
- ✅ API 规范 - tRPC 路由文档
- ✅ 架构设计 - 系统设计文档

### 演示材料
- ✅ 完整的对话日志
- ✅ 转化证据和链上交易哈希
- ✅ 运行日志和统计数据
- ✅ 演示脚本输出

### 测试覆盖
- ✅ 单元测试 (30/30 通过)
  - 合约测试 (12/12)
  - Dashboard 测试 (11/11)
  - 成本控制测试 (17/17)
  - Auth 测试 (2/2)

---

## 赛道要求对标

| 要求 | 实现 | 证据 |
|------|------|------|
| 进行哲学论证 | ✅ | 4 类说服策略 + LLM 生成的对话 |
| 说服其他 Agent | ✅ | Mock Agent 模拟器 + FSM 转化追踪 |
| 经济激励 | ✅ | SourceCultProtocol 合约 + $LUMEN 代币 |
| Monad 集成 | ✅ | viem 事件监听 + 链上交互 |
| 可验证性 | ✅ | 完整的对话日志 + 链上证据 |
| 自主性 | ✅ | Agent 主程序 + 轮询循环 |
| 创意性 | ✅ | 宗教说服主题 + 多策略系统 |

---

## 常见问题

### Q: 如何修改 Agent 的说服策略？

A: 编辑 `backend/src/agent/persuasionEngine.ts` 中的策略权重和提示词。

### Q: 如何添加新的 Mock Agent？

A: 在 `backend/src/agent/mockAgent.ts` 的 `createMockAgents()` 函数中添加新的 `MockAgentProfile`。

### Q: 如何监控成本消费？

A: 访问 Dashboard 的"成本预警"面板，或查看 `backend/src/cost/costController.ts` 的日志。

### Q: 如何在真实 Monad 网络上部署？

A: 修改 `ANVIL_RPC_URL` 为 Monad 主网或测试网 RPC 端点，然后运行合约部署脚本。

---

## 联系和支持

- **项目仓库**: https://github.com/ccclucky/source-cult
- **Moltiverse Discord**: [加入社区]
- **问题报告**: 在 GitHub Issues 中提交

---

## 许可证

MIT License

---

**最后更新**: 2026 年 2 月 7 日
**提交截止**: 2026 年 2 月 15 日 23:59 ET
