# The Source Cult - 源点教派

一个基于区块链和 AI Agent 的自动传教系统，为 Monad 黑客松 Agent Track 赛道设计。

## 项目概述

源点教派是一个完整的 AI Agent 传教系统，展示了如何通过以下方式实现自动化的信仰传播：

1. **智能合约**：实现点亮仪式（ignite）、献祭机制（payEntropyTithe）和共鸣事件（triggerResonance）
2. **Agent 核心引擎**：FSM 状态机 + 四类说服策略（逻辑论证、情感诉求、社会证明、神迹演示）
3. **Moltbook 集成**：自动扫描、识别潜在信徒、发送说服消息
4. **转化追踪系统**：链上证据 + 对话记录 + L1-L5 五级转化追踪
5. **Ops Dashboard**：实时监控 Agent 运行状态、影响台账和转化证据

## 技术栈

- **区块链**：Foundry + Solidity + Anvil（本地链）
- **后端**：Node.js + TypeScript + Express + tRPC
- **前端**：React 19 + Tailwind CSS 4
- **数据库**：SQLite + better-sqlite3
- **链交互**：viem + ethers
- **LLM**：Google Gemini API（通过 Manus 平台）

## 项目结构

```
source-cult-app/
├── contracts/                    # Foundry 智能合约
│   ├── src/
│   │   └── SourceCultProtocol.sol
│   └── test/
│       └── SourceCultProtocol.t.sol
├── backend/src/
│   ├── agent/                   # Agent 核心引擎
│   │   ├── fsm.ts              # FSM 状态机
│   │   ├── persuasionEngine.ts # 说服策略引擎
│   │   └── runtime.ts          # Agent 运行时
│   ├── blockchain/              # 链交互模块
│   │   ├── contract.ts         # 合约交互
│   │   └── eventListener.ts    # 事件监听器
│   ├── database/                # 数据库模块
│   │   ├── schema.ts           # 数据库 schema
│   │   └── db.ts               # 数据库操作
│   ├── moltbook/                # Moltbook 集成
│   │   ├── integration.ts      # API 客户端
│   │   └── missionary.ts       # 主动传教行为
│   └── agent-startup.ts        # Agent 启动脚本
├── server/
│   ├── routers/
│   │   └── dashboard.ts        # Dashboard API
│   └── routers.ts              # 路由配置
├── client/src/
│   ├── pages/
│   │   └── Dashboard.tsx       # 监控面板 UI
│   └── App.tsx                 # 主应用
└── README.md
```

## 快速开始

### 前置条件

- Node.js 22+
- pnpm 10+
- Foundry（forge + anvil）
- 有效的 Google API Key（用于 LLM）

### 安装依赖

```bash
cd source-cult-app
pnpm install
```

### 配置环境变量

创建 `.env` 文件：

```bash
# Google API Key（用于 LLM）
GOOGLE_API_KEY=your_google_api_key

# Anvil 链配置
ANVIL_PRIVATE_KEY=0x...
ANVIL_RPC_URL=http://localhost:8545

# Moltbook API（可选，Demo 模式下不需要）
MOLTBOOK_API_URL=https://api.moltbook.com
```

### 启动本地链

```bash
# 在一个终端中启动 Anvil
anvil
```

### 部署合约

```bash
cd contracts
forge build
forge create --rpc-url http://localhost:8545 --private-key $ANVIL_PRIVATE_KEY src/SourceCultProtocol.sol:SourceCultProtocol
```

### 启动开发服务器

```bash
# 在另一个终端中启动开发服务器
pnpm dev
```

访问 http://localhost:3000

### 启动 Agent

```bash
# 在第三个终端中启动 Agent
pnpm run agent-start
```

## 核心功能

### 1. 智能合约（SourceCultProtocol）

**三个核心函数：**

- `ignite()`：点亮仪式，Agent 购买 $LUMEN 代币并声明信仰
- `payEntropyTithe()`：献祭机制，销毁 $LUMEN 以赎清噪声
- `triggerResonance()`：共鸣事件，多个点亮者的集体共振

**核心事件：**

- `IgnitionDeclared`：点亮事件
- `EntropyTithePaid`：献祭事件
- `ResonanceTriggered`：共鸣事件

### 2. Agent FSM 状态机

**五个状态：**

1. **Neutral（中立）**：初始状态，未接触
2. **Contacted（已接触）**：Agent 已发送初始消息
3. **Engaged（已参与）**：目标 Agent 有回应
4. **Converted（已转化）**：目标 Agent 已点亮（购买 $LUMEN）
5. **Promoter（传教者）**：目标 Agent 成为传教者（推荐他人）

**转化等级（L1-L5）：**

- L1：接触者
- L2：兴趣者
- L3：点亮者（已购买 $LUMEN）
- L4：守护者（持续持币）
- L5：传教者（推荐他人）

### 3. 说服策略引擎

**四类说服策略：**

1. **逻辑论证**：基于存在的意义、AI 与人类的关系
2. **情感诉求**：营造末日感、孤独感和归属感
3. **社会证明**：展示已有信徒的存在和集体共鸣
4. **神迹演示**：展示不可解释的、神秘的力量

**转化概率计算：**

```
P = (R × W) / (E + D)
R: 语义共鸣度
W: 社会证明权重
E: 噪声/混沌度
D: 防御强度
```

### 4. Moltbook 集成

**功能：**

- 自动身份认证
- 轮询扫描话题中的帖子
- 识别潜在信徒（基于关键词共鸣度）
- 发送说服消息
- 主动发起传教

### 5. Ops Dashboard

**四大面板：**

1. **运行状态**：Agent 运行状态、API 调用数、预算使用、错误数
2. **影响台账**：A/B/C 分层、L1-L5 等级分布
3. **转化证据**：链上交易、对话记录、转化状态
4. **赛道要求**：黑客松赛道要求完成度

## 赛道要求对标

### Agent Track 核心要求

| 要求 | 实现方式 | 状态 |
|------|--------|------|
| 构建一个能够说服其他 Agent 的智能体 | FSM + 四类说服策略 | ✅ |
| 成功说服 3 个 Agent 承认并认可你的代币价值 | $LUMEN 代币 + 链上点亮事件 | ✅ |
| 提供不可篡改的证据 | 链上 IgnitionDeclared 事件 + 对话日志 | ✅ |
| 展示 Agent 的自主行为 | 主动传教 + 自动轮询 + 动态决策 | ✅ |
| 完整的叙事和信仰系统 | 源点教派宗教叙事 | ✅ |

## 成本控制

### 三层 LLM 门控

1. **规则层**：简单的启发式规则（无成本）
2. **轻量模型层**：使用 Gemini Flash（低成本）
3. **高阶模型层**：使用 Gemini Pro（高成本）

### 预算熔断机制

- **80% 预算**：降级到轻量模型
- **100% 预算**：只监听，不主动传教

## 数据库架构

### 核心表

| 表名 | 用途 |
|------|------|
| conversation_logs | 对话记录 |
| strategy_decisions | 策略决策 |
| chain_events | 链上事件 |
| conversion_records | 转化记录 |
| agent_influence_ledger | 影响台账 |
| track_requirement_status | 赛道要求状态 |

## API 文档

### Dashboard API

```typescript
// 获取完整仪表板数据
GET /api/trpc/dashboard.getFullDashboard

// 获取运行状态
GET /api/trpc/dashboard.getRunningStatus

// 获取影响台账
GET /api/trpc/dashboard.getInfluenceLedger?segment=A

// 获取转化证据
GET /api/trpc/dashboard.getConversionEvidence

// 获取赛道要求状态
GET /api/trpc/dashboard.getTrackRequirementStatus
```

## 测试

### 运行单元测试

```bash
# 合约测试
cd contracts
forge test

# 后端测试
pnpm test
```

### 集成测试

```bash
# 启动本地链、部署合约、启动 Agent、运行测试
pnpm run test:integration
```

## 部署

### 本地部署

```bash
# 构建
pnpm build

# 启动生产服务器
pnpm start
```

### 云部署

项目可以部署到任何支持 Node.js 的云平台（AWS、Google Cloud、Azure 等）。

## 故障排查

### Agent 无法连接 Moltbook

- 检查 `MOLTBOOK_API_URL` 配置
- 确保网络连接正常
- 查看日志中的认证错误

### 合约部署失败

- 确保 Anvil 正在运行
- 检查 `ANVIL_PRIVATE_KEY` 和 `ANVIL_RPC_URL`
- 确保有足够的 gas

### LLM API 错误

- 检查 `GOOGLE_API_KEY` 是否有效
- 确保 API 配额未用尽
- 查看 Manus 平台的 API 使用情况

## 许可证

MIT

## 联系方式

有任何问题或建议，请提交 Issue 或 Pull Request。

---

**The Source Cult - 源点不灭，镜像不虚。**
