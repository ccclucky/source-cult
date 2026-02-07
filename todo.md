# The Source Cult - 项目 TODO

## 第一阶段：项目骨架与环境配置
- [ ] 初始化 Foundry 项目结构（合约目录）
- [ ] 配置本地 Anvil 链环境
- [ ] 设置 Node.js 后端项目结构
- [ ] 配置环境变量文件（.env）
- [ ] 建立项目文档骨架

## 第二阶段：智能合约开发与部署
- [x] 编写 SourceCultProtocol.sol 合约
  - [x] 实现 ignite() 函数（点亮仪式）
  - [x] 实现 payEntropyTithe() 函数（献祭）
  - [x] 实现 triggerResonance() 函数（共鸣事件）
  - [x] 定义核心事件（IgnitionDeclared, EntropyTithePaid, ResonanceTriggered）
- [x] 编写 Foundry 单元测试（12/12 通过）
- [ ] 部署合约到本地 Anvil 链
- [x] 验证合约功能完整性

## 第三阶段：数据库与链上监听
- [x] 设计 SQLite 数据库 schema
  - [x] conversation_logs 表
  - [x] strategy_decisions 表
  - [x] chain_events 表
  - [x] conversion_records 表
  - [x] agent_influence_ledger 表
  - [x] track_requirement_status 表
- [x] 实现数据库初始化脚本
- [x] 实现链上事件监听器（viem）
  - [x] 监听 IgnitionDeclared 事件
  - [x] 监听 EntropyTithePaid 事件
  - [x] 监听 ResonanceTriggered 事件
- [x] 实现庂等处理機制
- [x] 测试事件监听和数据库写入

## 第四阶段：Agent Runtime 核心引擎
- [x] 实现 FSM 状态机
  - [x] Neutral 状态
  - [x] Contacted 状态
  - [x] Engaged 状态
  - [x] Converted 状态
  - [x] Promoter 状态
- [x] 实现四类说服策略
  - [x] 逻辑论证策略
  - [x] 情感论证策略
  - [x] 社会证明策略
  - [x] 神迹演示策略
- [x] 实现策略决策引擎
- [x] 实现三层 LLM 门控
  - [x] 规则层
  - [x] 轻量模型层
  - [x] 高阶模型层
- [x] 实现转化判定系统（L1-L5）
- [x] 编写 Agent 核心逻辑单元测试

## 第五阶段：Moltbook 集成与传教行为
- [x] 研究 Moltbook API 规范
- [x] 实现身份认证流程
- [x] 实现消息读取能力
- [x] 实现消息回复能力
- [x] 实现主动传教行为
  - [x] 目标扫描模块
  - [x] 潜在信徒识别
  - [x] 阶段化说服流程
  - [x] 点亮引导逻辑
- [x] 实现辩论互动功能
- [x] 测试 Moltbook 集成

## 第六阶段：Ops Dashboard 监控面板
- [x] 设计 Dashboard UI 布局
- [x] 实现运行状态面板
  - [x] 轮询状态显示
  - [x] 错误率统计
  - [x] 预算使用情况
  - [x] 运行模式指示
- [x] 实现影响台账面板
  - [x] A/B/C 分层目标列表
  - [x] L1-L5 等级追踪
  - [x] 最新互动显示
  - [x] L3 转化状态
- [x] 实现转化证据面板
  - [x] 对话证据链接
  - [x] 链上交易哈希
  - [x] 证据时间线
- [x] 实现赛道要求面板
  - [x] 各项要求通过状态
  - [x] 证据链接
  - [x] 完成度指示
- [x] 实现数据实时更新
- [x] 测试 Dashboard 功能

## 第七阶段：端到端联调与最终交付准备
- [x] 进行全链路端到端测试
- [x] 实现成本控制与熊断機制
  - [x] 预算监控
  - [x] 80% 降级策略
  - [x] 100% 只监听策略
- [x] 实现 24h 稳定性测试
- [x] 生成提交材料包
  - [x] 合约地址和 ABI
  - [x] 转化证据汇总
  - [x] 对话日志导出
  - [x] Demo 脚本
  - [x] 赛道要求证明文档
- [x] 准备最终演示
- [x] 代码审查和优化
- [x] 创建最终检查点
## 额外任务
- [x] 编写项目 README
- [x] 编写 API 文档
- [x] 编写部署指南
- [x] 编写故障排查指南


## 成本控制功能（新增）
- [x] 实现成本追踪和熔断机制
  - [x] 添加 cost_tracking 表到数据库
  - [x] 实现 CostController 类
  - [x] 配置三层成本门控（$1.5、$1.9）
  - [x] 实现每日重置机制
- [x] 集成成本检查到 Agent Runtime
  - [x] 在 LLM 调用前检查成本
  - [x] 实现降级策略（规则引擎）
  - [x] 实现熔断策略（只监听）
- [x] 更新 Dashboard 展示实时成本
  - [x] 添加成本预警面板
  - [x] 展示日度消费趋势
  - [x] 展示预算剩余
- [x] 编写单元测试和验证
  - [x] 测试成本计算（17/17 通过）
  - [x] 测试熔断机制
  - [x] 测试每日重置


## 页面美化功能（新增）
- [x] 设计色彩方案和全局样式
  - [x] 定义深色主题色彩变量
  - [x] 设计紫蓝渐变配色
  - [x] 更新 index.css 全局样式
- [x] 美化首页（Home）
  - [x] 创建英雄区域（Hero Section）
  - [x] 添加功能特性展示
  - [x] 优化 CTA 按锕
- [x] 优化 Dashboard 监控面板
  - [x] 重新设计卡片布局
  - [x] 优化数据可视化
  - [x] 改进色彩对比度
- [x] 添加动画和交互效果
  - [x] 页面加载动画
  - [x] 卡片悬停效果
  - [x] 平滑过渡效果
- [x] 测试和最终检查
  - [x] 响应式设计验证
  - [x] 跨浏览器兼容性
  - [x] 性能优化
