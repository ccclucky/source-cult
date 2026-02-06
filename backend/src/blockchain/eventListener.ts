/**
 * 链上事件监听器
 * 使用 viem 监听 SourceCultProtocol 合约的事件
 * 支持幂等处理和异步确认
 */

import { createPublicClient, http, parseAbiItem, Log } from 'viem';
import { insertChainEvent, getChainEventByTxHash } from '../database/db';
import type { ChainEvent } from '../database/schema';

// SourceCultProtocol 合约事件 ABI
export const SOURCE_CULT_EVENTS = {
  IgnitionDeclared: parseAbiItem(
    'event IgnitionDeclared(address indexed believer, uint256 indexed timestamp, string narrative)'
  ),
  EntropyTithePaid: parseAbiItem(
    'event EntropyTithePaid(address indexed believer, uint256 amount, uint256 indexed timestamp, string reason)'
  ),
  ResonanceTriggered: parseAbiItem(
    'event ResonanceTriggered(address[] indexed believers, bytes32 indexed resonanceHash, uint256 indexed timestamp, string consensusText)'
  ),
};

export interface EventListenerConfig {
  rpcUrl: string;
  contractAddress: string;
  chainId: number;
  pollingInterval: number; // milliseconds
  confirmationBlocks: number;
}

export class SourceCultEventListener {
  private config: EventListenerConfig;
  private publicClient: ReturnType<typeof createPublicClient>;
  private lastProcessedBlock: number = 0;
  private isRunning: boolean = false;

  constructor(config: EventListenerConfig) {
    this.config = config;
    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
      chain: {
        id: config.chainId,
        name: 'Local Anvil',
        network: 'anvil',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
          default: { http: [config.rpcUrl] },
          public: { http: [config.rpcUrl] },
        },
      },
    });
  }

  /**
   * 启动事件监听器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('[EventListener] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[EventListener] Started');

    // 获取当前区块号
    const currentBlock = await this.publicClient.getBlockNumber();
    this.lastProcessedBlock = Number(currentBlock) - this.config.confirmationBlocks;

    // 启动轮询
    this.startPolling();
  }

  /**
   * 停止事件监听器
   */
  stop(): void {
    this.isRunning = false;
    console.log('[EventListener] Stopped');
  }

  /**
   * 启动轮询机制
   */
  private startPolling(): void {
    const poll = async () => {
      if (!this.isRunning) return;

      try {
        await this.pollEvents();
      } catch (error) {
        console.error('[EventListener] Error during polling:', error);
      }

      // 继续轮询
      setTimeout(poll, this.config.pollingInterval);
    };

    poll();
  }

  /**
   * 轮询事件
   */
  private async pollEvents(): Promise<void> {
    try {
      const currentBlock = await this.publicClient.getBlockNumber();
      const toBlock = Number(currentBlock) - this.config.confirmationBlocks;

      if (toBlock <= this.lastProcessedBlock) {
        return; // 没有新区块
      }

      // 监听 IgnitionDeclared 事件
      await this.listenToEvent('IgnitionDeclared', this.lastProcessedBlock, toBlock);

      // 监听 EntropyTithePaid 事件
      await this.listenToEvent('EntropyTithePaid', this.lastProcessedBlock, toBlock);

      // 监听 ResonanceTriggered 事件
      await this.listenToEvent('ResonanceTriggered', this.lastProcessedBlock, toBlock);

      this.lastProcessedBlock = toBlock;
    } catch (error) {
      console.error('[EventListener] Error polling events:', error);
    }
  }

  /**
   * 监听特定事件
   */
  private async listenToEvent(
    eventName: keyof typeof SOURCE_CULT_EVENTS,
    fromBlock: number,
    toBlock: number
  ): Promise<void> {
    try {
      const logs = await this.publicClient.getLogs({
        address: this.config.contractAddress as `0x${string}`,
        event: SOURCE_CULT_EVENTS[eventName],
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
      });

      for (const log of logs) {
        await this.processLog(eventName, log);
      }
    } catch (error) {
      console.error(`[EventListener] Error listening to ${eventName}:`, error);
    }
  }

  /**
   * 处理单个日志
   */
  private async processLog(eventName: string, log: Log): Promise<void> {
    const txHash = log.transactionHash || '';
    const logIndex = log.logIndex || 0;

    // 检查是否已处理（幂等性）
    const existingEvent = getChainEventByTxHash(txHash, logIndex);
    if (existingEvent) {
      console.log(`[EventListener] Event already processed: ${txHash}:${logIndex}`);
      return;
    }

    // 解析事件数据
    const eventData = this.parseEventData(eventName, log);

    // 插入数据库
    const chainEvent: Omit<ChainEvent, 'id'> = {
      event_name: eventName,
      tx_hash: txHash,
      log_index: logIndex,
      payload_json: JSON.stringify(eventData),
      block_time: Math.floor(Date.now() / 1000),
      block_number: log.blockNumber ? Number(log.blockNumber) : undefined,
    };

    const inserted = insertChainEvent(chainEvent);
    console.log(`[EventListener] Processed ${eventName}: ${inserted.id}`);

    // 触发事件处理回调
    await this.onEventProcessed(eventName, eventData);
  }

  /**
   * 解析事件数据
   */
  private parseEventData(eventName: string, log: Log): Record<string, any> {
    const topics = log.topics || [];
    const data = log.data || '0x';

    switch (eventName) {
      case 'IgnitionDeclared':
        return {
          believer: topics[1],
          timestamp: topics[2],
          narrative: data,
        };

      case 'EntropyTithePaid':
        return {
          believer: topics[1],
          amount: topics[2],
          timestamp: topics[3],
          reason: data,
        };

      case 'ResonanceTriggered':
        return {
          believers: topics[1],
          resonanceHash: topics[2],
          timestamp: topics[3],
          consensusText: data,
        };

      default:
        return { raw: log };
    }
  }

  /**
   * 事件处理回调（可被子类覆盖）
   */
  protected async onEventProcessed(eventName: string, eventData: Record<string, any>): Promise<void> {
    console.log(`[EventListener] Event processed: ${eventName}`, eventData);
  }

  /**
   * 获取最后处理的区块号
   */
  getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }
}

/**
 * 创建事件监听器实例
 */
export function createEventListener(config: EventListenerConfig): SourceCultEventListener {
  return new SourceCultEventListener(config);
}
