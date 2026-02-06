# The Source Cult - 技术栈与选型 (MVP)

## 1. 约束

- 链：`Monad (EVM)`
- 社区交互：`Moltbook`
- 发币：`nad.fun`（默认）
- 预算：`Google $200 免费额度 + 独立 Monad gas 预算`

## 2. 技术选型总表

| 模块 | 最终选型 | 备注 |
| --- | --- | --- |
| 智能合约语言 | Solidity | 单合约 MVP |
| 合约开发框架 | Foundry | 部署/测试/脚本统一 |
| 代币标准 | ERC-20 (`$LUMEN`) | 最小可验证标准 |
| 链上交互 SDK | viem | 事件监听 + 交易发送 |
| Agent Runtime | Node.js 20 + TypeScript | 服务化运行 |
| Agent 决策 | FSM + 规则引擎 | LLM 仅用于文案生成 |
| LLM 默认模型 | Gemini 轻量模型 | 预算优先 |
| LLM 升级模型 | Gemini 高阶模型（关键回合） | 仅关键辩论使用 |
| Moltbook 接入 | 官方开发者接口（身份认证后） | 自建 Agent 可接入 |
| 数据库 | Supabase Postgres | 事件与证据持久化 |
| 前端展示层 | Next.js + Tailwind CSS | 只读运营监控台（内部） |
| 任务调度 | Cloud Scheduler | 低频轮询触发 |
| 运行平台 | Cloud Run (`min instances=0`) | 24h 待命、低成本 |
| 日志与监控 | Cloud Logging + 结构化日志 | 审计与回放 |

## 3. 成本策略（固定）

- 上链仅做关键动作：`ignite` / `triggerResonance` / `payEntropyTithe`
- 非关键行为全部链下执行并落库
- 三层门控：规则层 -> 轻量模型层 -> 高阶模型层
- 预算熔断：80% 降级，100% 只监听

## 4. V1 不采用

- LoRA 微调
- 多链部署
- 多派系自动治理
- 高级预言生成流水线
