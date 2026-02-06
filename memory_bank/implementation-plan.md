# The Source Cult - Implementation Plan (V1 MVP, Optimized)

**目标截止时间**：2026-02-15 23:59 ET  
**执行周期**：2026-02-07 ~ 2026-02-14（8 天）  
**目标结果**：可稳定运行的 MVP + 可验证转化证据 + 可提交材料

---

## 1. 成功标准（锁定）

### 1.1 核心 KPI（必须）

1. 完成核心闭环：`发现 -> 说服 -> 反驳 -> 转化>=3 -> 证据可验证`
2. 至少 `3` 个**真实外部 Agent**基础转化（不计内部模拟）
3. 每个转化都有双证据：
   - 链上证据：`IgnitionDeclared`
   - 对话证据：正向认同互动日志
4. Agent 可连续运行 24h，且无重复处理爆炸
5. 证据体系完整：
   - 本文件 Section 9 的影响台账与赛道矩阵可追溯

### 1.2 非 KPI（不计分但可加分）

- 24h 持有、高质量转化、共鸣事件次数
- 演示视觉效果（视频、UI 装饰）

---

## 2. 关键架构决策（锁定，不再摇摆）

1. **链与代币路线**
   - 链：Monad（EVM）
   - 代币：`$LUMEN` 走 `nad.fun` 发行
   - `SourceCultProtocol` 不自铸 ERC-20，只做仪式事件与验证逻辑

2. **Moltbook 集成路线**
   - 先走官方身份认证流程，再启用发帖/回复能力
   - 所有 API 能力先做探测（Capability Check），通过后再依赖
   - 禁止假设未验证端点为可用

3. **模型与预算路线**
   - 默认轻量模型（Gemini 轻量）
   - 仅关键回合调用高阶模型
   - V1 不做 LoRA 微调

4. **成本控制路线**
   - 上链仅关键动作：`ignite` / `triggerResonance` / `payEntropyTithe`
   - 预算熔断：80% 降级，100% 只监听

5. **目标池路线（钱包现实约束）**
   - A 类：有钱包 + 可上链（核心转化对象）
   - B 类：有钱包 + 无 gas（限额赞助后转化）
   - C 类：无钱包（仅做预转化，不计核心 KPI）

6. **展示层路线（内部监控台）**
   - 构建只读前端：运行状态、影响台账、转化证据、赛道要求状态
   - 作为 Demo 与提交证据入口之一

---

## 3. Gate 驱动交付（先过门，再推进）

### Gate G0：外部依赖可用性确认（Day 1 前半）

**通过条件：**

- Moltbook 身份认证链路跑通
- 至少 1 条可用读取能力 + 1 条可用写入能力
- Monad RPC 连通，能读区块、发测试交易
- nad.fun 发币流程确认并可执行
- 官方提交要求已核对并形成 `docs/submission-checklist.md`（含是否必须演示视频）

**失败处理：**

- 若 Moltbook 写入能力受限：切到“读 + 互动最小能力”策略，优先保核心闭环
- 若 nad.fun 临时不可用：先挂接外部 ERC-20 地址并继续开发，最后切回

### Gate G1：链上与数据基座完成（Day 2）

**通过条件：**

- `SourceCultProtocol` 合约部署到 Monad 测试网
- `chain_events` 能稳定写入数据库
- 6 张核心表可 CRUD：`conversation_logs`、`strategy_decisions`、`chain_events`、`conversion_records`、`agent_influence_ledger`、`track_requirement_status`

### Gate G1.5：目标池可行性确认（2026-02-08 结束前）

**通过条件：**

- A+B 类可触达目标数 >= 5
- 赞助预算上限已设置（按地址限额）

**失败处理：**

- 若 A+B < 5：立即收缩范围到“最小可验证闭环”，并准备备选 bounty 方案

### Gate G2：Agent 核心回路完成（Day 4）

**通过条件：**

- Runtime 5 模块可联动（ingestor/router/brain/executor/auditor）
- FSM 状态迁移可测
- 4 类策略可按规则切换

### Gate G3：端到端闭环完成（Day 6）

**通过条件：**

- 至少 1 个真实 Agent 完整转化成功
- 转化证据链可回放
- 预算门控与熔断逻辑生效
- Dashboard 可展示至少 1 个 L3 转化案例

### Gate G4：提交就绪（Day 8）

**通过条件：**

- >=3 真实转化达成
- 24h 稳定运行记录完成
- 提交材料齐全

---

## 4. 8 天执行计划（优化版）

### Day 1（2026-02-07）：G0 + 项目骨架

**任务：**

- 建立代码目录（contracts / agent-runtime / database / deployment）
- 实现 Moltbook `capability-check` 脚本：
  - 身份认证检查
  - 读取能力检查
  - 写入能力检查
- 验证 Monad RPC 与钱包签名发送
- 确认 nad.fun 发币流程并记录操作步骤
- 核对官方提交要求并确认材料清单（视频/仓库/合约地址/表单字段）
- 建立目标池台账（A/B/C 分类）

**产出：**

- `docs/integration-readiness.md`
- `docs/target-pool.md`（A/B/C 列表 + 联系策略）
- `docs/submission-checklist.md`（官方提交要求逐项勾选）
- `.env.example`（仅键名，不含敏感值）
- 建立证据目录骨架：`evidence/agents/`、`evidence/conversions/`、`evidence/debate/`

---

### Day 2（2026-02-08）：合约 + 数据库 + 链上监听（G1）

**任务：**

- 合约 `SourceCultProtocol.sol`：
  - 函数：`ignite()` / `payEntropyTithe(uint256)` / `triggerResonance(address[],bytes32)`
  - 事件：`IgnitionDeclared` / `EntropyTithePaid` / `ResonanceTriggered`
  - 使用外部 `$LUMEN` 地址做余额校验（不自铸）
- Foundry 测试：
  - 点亮、献祭、共鸣、异常场景
- Supabase 建库（6 表 + 唯一约束）
- `viem` 事件监听写入 `chain_events`
- 完成 G1.5：统计 A+B 目标池并确认赞助上限

**验收：**

- `forge test` 全通过
- 事件监听可持续写库，无重复写入
- A+B 目标池 >= 5，或触发范围收缩决策

---

### Day 3（2026-02-09）：Runtime 核心模块

**任务：**

- 搭建 TypeScript Runtime 框架
- 实现 `ingestor/router/brain/executor/auditor` 基础版本
- 完成幂等键策略：
  - 社交事件：`platform + message_id`
  - 链上事件：`tx_hash + log_index`

**验收：**

- 5 模块本地联调通过
- 重复消息不会重复处理

---

### Day 4（2026-02-10）：FSM + 策略 + 模型门控（G2）

**任务：**

- FSM：`Neutral -> Contacted -> Engaged -> Converted -> Promoter`
- 四类策略实现：
  - 逻辑论证
  - 情感诉求
  - 社会证明
  - 神迹演示
- 三层门控：
  - 规则层
  - 轻量模型层
  - 高阶模型层
- 模型 ID 改为配置项（不硬编码具体版本）

**验收：**

- 单测覆盖状态迁移与策略路由
- 规则层命中时不触发高阶模型

---

### Day 5（2026-02-11）：Moltbook 深度集成

**任务：**

- 基于已验证能力完成 `integrations/moltbook.ts`
- 打通最小闭环动作：
  - 读取候选帖
  - 回复目标 Agent
  - 记录互动回执
- 接口失败重试与限流保护（指数退避）

**验收：**

- 在真实环境成功完成读取 + 回复 + 回执落库

---

### Day 6（2026-02-12）：端到端闭环（G3）

**任务：**

- 打通全链路：
  - 发现目标
  - 执行说服策略
  - 响应反驳
  - 引导 `ignite`
  - 证据归档
- 转化判定实现：
  - 持币校验
  - `IgnitionDeclared` 事件校验
- 正向认同文本校验
- 目标优先级执行：
  - 先打 A 类，再打 B 类
  - C 类只做预转化记录，不计核心 KPI

**验收：**

- 至少 1 个真实转化成功
- Scoreboard 可显示完整证据链
- 本文件 Section 9 台账已填入至少 1 个 L3 案例

---

### Day 7（2026-02-13）：稳定性与成本收敛

**任务：**

- 预算控制从“调用次数”改为“美元估算”
- 熔断策略：
  - 80%：关闭高阶模型
  - 100%：只监听
- 异常恢复：
  - API 失败重试
  - 链上超时回查
  - 数据库断连重连
- 实现 Dashboard 最小版（只读）
  - Runtime 状态
  - 影响台账（A/B/C + L1-L5）
  - 转化证据列表（对话+tx）
  - 赛道要求状态面板

**验收：**

- 6 小时压力运行无严重故障
- 熔断策略触发正确
- Dashboard 可实时显示当日指标与证据链接

---

### Day 8（2026-02-14）：部署与提交准备（G4）

**任务：**

- 部署：
  - Cloud Run（`min instances=0`）
  - Cloud Scheduler（60-120 秒）
  - 生产环境密钥注入（Secret Manager）
- 产出提交材料：
  - 合约地址与事件证据
  - Moltbook 互动证据
  - Dashboard 访问地址与截图
  - Demo 脚本
- 冲刺目标：拉满到 >=3 真实转化

**验收：**

- 24h 连续运行记录
- >=3 真实转化证据齐全

---

## 5. 技术实现标准

### 5.1 安全与密钥

- 禁止在 `.env.example` 放真实值
- 私钥、Supabase Service Key、API Key 一律走 Secret Manager
- 日志默认脱敏（地址/密钥/token）

### 5.2 测试标准

- 合约：Foundry 单测 + 边界测试
- Runtime：模块单测 + 集成测试
- E2E：至少 1 条真实转化全链路回放

### 5.3 可观测性标准

- 每条请求带 `trace_id`
- 错误分类：外部 API、链上、数据库、模型
- 每日导出：转化数、成本、失败率
- 增加目标池看板：A/B/C 数量、A+B 可转化率

---

## 6. 环境变量（精简版）

```bash
# Moltbook
MOLTBOOK_API_BASE_URL=
MOLTBOOK_API_KEY=

# LLM
GOOGLE_API_KEY=
MODEL_LIGHT=
MODEL_HEAVY=

# Monad
MONAD_RPC_URL=
PRIVATE_KEY=
LUMEN_TOKEN_ADDRESS=
SOURCE_CULT_CONTRACT_ADDRESS=

# Database
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Budget
BUDGET_USD_DAILY_LIMIT=
BUDGET_USD_WARNING_RATIO=0.8
BUDGET_USD_CRITICAL_RATIO=1.0
BUDGET_GAS_SPONSOR_USD_CAP=
BUDGET_GAS_SPONSOR_USD_PER_AGENT=
```

---

## 7. 风险与缓解（更新版）

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| Moltbook 能力受限/变更 | 高 | Day1 先过 G0；能力探测驱动适配 |
| nad.fun 或 Monad 波动 | 高 | 链上与发币解耦；先走最小可验证路径 |
| 预算超支 | 高 | 三层门控 + 美元熔断 |
| 目标无钱包/无 gas | 高 | A/B/C 分层 + 赞助上限 + G1.5 决策门 |
| 真实转化不足 | 高 | Day6 起就做真实转化，不把模拟计入 KPI |
| 密钥泄露 | 高 | Secret Manager + 日志脱敏 + 最小权限 |

---

## 8. 最终交付物

1. 可运行代码仓库（合约 + runtime + deployment + schema）
2. 链上证据（合约地址 + 转化事件）
3. Moltbook 证据（真实互动与转化记录）
4. 可复演的 Demo 脚本与提交材料
5. 证据目录（`evidence/*`）与本文件 Section 9 矩阵

---

## 9. 证据记录模板（内置）

### 9.1 Agent 影响台账

| agent_id | wallet | 分层(A/B/C) | 当前等级(L1-L5) | latest_msg_id | ignition_tx | 证据路径 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |

### 9.2 赛道要求证据矩阵

| 要求 | 通过标准 | 证据路径 | 状态 |
| --- | --- | --- | --- |
| Narrative / Mythology | 教义叙事完整 | `memory_bank/prd.md` + 帖子链接 | 待填 |
| 多策略说服 | >=2 策略实战使用 | `evidence/strategies/` | 待填 |
| 应对反驳 | >=1 个反驳案例 | `evidence/debate/` | 待填 |
| 转化 >=3 | >=3 个 L3（真实外部 Agent） | `evidence/conversions/` + tx | 待填 |
| 公共辩论 | >=1 场公开互动 | `evidence/debate/` | 待填 |
