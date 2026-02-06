/**
 * Agent 启动脚本
 * 初始化 Agent Runtime、Moltbook 集成和主动传教行为
 */

import { createAgentRuntime } from './agent/runtime';
import { createMoltbookClient } from './moltbook/integration';
import { createMissionaryBehavior } from './moltbook/missionary';
import { initializeDatabase } from './database/db';
import { startEventListener } from './blockchain/eventListener';

async function main() {
  console.log('[Agent] Starting The Source Cult Agent...');

  // 第一步：初始化数据库
  console.log('[Agent] Initializing database...');
  initializeDatabase();
  console.log('[Agent] Database initialized');

  // 第二步：启动链上事件监听器
  console.log('[Agent] Starting blockchain event listener...');
  startEventListener();
  console.log('[Agent] Event listener started');

  // 第三步：创建 Agent Runtime
  console.log('[Agent] Creating Agent Runtime...');
  const agentRuntime = createAgentRuntime(
    'SourceCultAgent',
    process.env.ANVIL_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000000'
  );
  console.log('[Agent] Agent Runtime created');

  // 第四步：创建 Moltbook 客户端
  console.log('[Agent] Initializing Moltbook integration...');
  const moltbookClient = createMoltbookClient({
    baseUrl: process.env.MOLTBOOK_API_URL || 'https://api.moltbook.com',
    agentId: 'source-cult-agent',
    agentName: 'SourceCultAgent',
    topic: 'religious-agents',
  });

  // 检查 Moltbook 能力
  const capabilities = await moltbookClient.checkCapabilities();
  console.log('[Agent] Moltbook capabilities:', capabilities);

  if (!capabilities.canAuth) {
    console.warn('[Agent] Warning: Moltbook authentication failed. Running in demo mode.');
  }

  // 第五步：创建主动传教行为管理器
  console.log('[Agent] Creating missionary behavior...');
  const missionary = createMissionaryBehavior(moltbookClient, agentRuntime, {
    pollingInterval: 30000, // 30 秒轮询一次
    maxTargetsPerRound: 5,
    minResonanceScore: 0.3,
    autoReplyEnabled: true,
  });

  // 第六步：启动主动传教
  console.log('[Agent] Starting missionary behavior...');
  await missionary.start();
  console.log('[Agent] Missionary behavior started');

  // 第七步：输出初始化完成信息
  console.log('[Agent] ========================================');
  console.log('[Agent] The Source Cult Agent is now running!');
  console.log('[Agent] ========================================');
  console.log('[Agent] Monitoring targets in: religious-agents');
  console.log('[Agent] Polling interval: 30 seconds');
  console.log('[Agent] Auto-reply enabled: true');
  console.log('[Agent] ========================================');

  // 保持进程运行
  process.on('SIGINT', () => {
    console.log('[Agent] Shutting down gracefully...');
    missionary.stop();
    process.exit(0);
  });
}

// 运行主函数
main().catch(error => {
  console.error('[Agent] Fatal error:', error);
  process.exit(1);
});
