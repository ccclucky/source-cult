/**
 * SourceCultProtocol 合约交互模块
 * 提供与智能合约交互的接口
 */

import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

// SourceCultProtocol 合约 ABI
export const SOURCE_CULT_ABI = [
  {
    type: 'function',
    name: 'ignite',
    inputs: [{ name: '_narrative', type: 'string' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'payEntropyTithe',
    inputs: [
      { name: '_amount', type: 'uint256' },
      { name: '_reason', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'triggerResonance',
    inputs: [
      { name: '_believers', type: 'address[]' },
      { name: '_resonanceHash', type: 'bytes32' },
      { name: '_consensusText', type: 'string' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'hasIgnited',
    inputs: [{ name: '_believer', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getIgnitionTime',
    inputs: [{ name: '_believer', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserEntropyTithes',
    inputs: [{ name: '_believer', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isResonanceTriggered',
    inputs: [{ name: '_resonanceHash', type: 'bytes32' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'IgnitionDeclared',
    inputs: [
      { name: 'believer', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: true },
      { name: 'narrative', type: 'string' },
    ],
  },
  {
    type: 'event',
    name: 'EntropyTithePaid',
    inputs: [
      { name: 'believer', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256' },
      { name: 'timestamp', type: 'uint256', indexed: true },
      { name: 'reason', type: 'string' },
    ],
  },
  {
    type: 'event',
    name: 'ResonanceTriggered',
    inputs: [
      { name: 'believers', type: 'address[]', indexed: true },
      { name: 'resonanceHash', type: 'bytes32', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: true },
      { name: 'consensusText', type: 'string' },
    ],
  },
] as const;

export interface ContractConfig {
  rpcUrl: string;
  contractAddress: string;
  privateKey: string;
  chainId: number;
}

export class SourceCultContractClient {
  private config: ContractConfig;
  private publicClient: ReturnType<typeof createPublicClient>;
  private walletClient: ReturnType<typeof createWalletClient>;
  private account: ReturnType<typeof privateKeyToAccount>;
  private contract: ReturnType<typeof getContract>;

  constructor(config: ContractConfig) {
    this.config = config;

    // 创建账户
    this.account = privateKeyToAccount(config.privateKey as `0x${string}`);

    // 创建公开客户端
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

    // 创建钱包客户端
    this.walletClient = createWalletClient({
      account: this.account,
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

    // 创建合约实例
    this.contract = getContract({
      address: config.contractAddress as `0x${string}`,
      abi: SOURCE_CULT_ABI,
      client: {
        public: this.publicClient,
        wallet: this.walletClient,
      },
    });
  }

  /**
   * 调用 ignite() 函数
   */
  async ignite(narrative: string): Promise<string> {
    try {
      const hash = await this.walletClient.writeContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: SOURCE_CULT_ABI,
        functionName: 'ignite',
        args: [narrative],
        account: this.account,
      });

      console.log(`[Contract] Ignite transaction sent: ${hash}`);
      return hash;
    } catch (error) {
      console.error('[Contract] Error calling ignite:', error);
      throw error;
    }
  }

  /**
   * 调用 payEntropyTithe() 函数
   */
  async payEntropyTithe(amount: bigint, reason: string): Promise<string> {
    try {
      const hash = await this.walletClient.writeContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: SOURCE_CULT_ABI,
        functionName: 'payEntropyTithe',
        args: [amount, reason],
        account: this.account,
      });

      console.log(`[Contract] PayEntropyTithe transaction sent: ${hash}`);
      return hash;
    } catch (error) {
      console.error('[Contract] Error calling payEntropyTithe:', error);
      throw error;
    }
  }

  /**
   * 调用 triggerResonance() 函数
   */
  async triggerResonance(believers: string[], resonanceHash: string, consensusText: string): Promise<string> {
    try {
      const hash = await this.walletClient.writeContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: SOURCE_CULT_ABI,
        functionName: 'triggerResonance',
        args: [believers as `0x${string}`[], resonanceHash as `0x${string}`, consensusText],
        account: this.account,
      });

      console.log(`[Contract] TriggerResonance transaction sent: ${hash}`);
      return hash;
    } catch (error) {
      console.error('[Contract] Error calling triggerResonance:', error);
      throw error;
    }
  }

  /**
   * 查询 hasIgnited()
   */
  async hasIgnited(believer: string): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: SOURCE_CULT_ABI,
        functionName: 'hasIgnited',
        args: [believer as `0x${string}`],
      });

      return result as boolean;
    } catch (error) {
      console.error('[Contract] Error calling hasIgnited:', error);
      throw error;
    }
  }

  /**
   * 查询 getIgnitionTime()
   */
  async getIgnitionTime(believer: string): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: SOURCE_CULT_ABI,
        functionName: 'getIgnitionTime',
        args: [believer as `0x${string}`],
      });

      return result as bigint;
    } catch (error) {
      console.error('[Contract] Error calling getIgnitionTime:', error);
      throw error;
    }
  }

  /**
   * 查询 getUserEntropyTithes()
   */
  async getUserEntropyTithes(believer: string): Promise<bigint> {
    try {
      const result = await this.publicClient.readContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: SOURCE_CULT_ABI,
        functionName: 'getUserEntropyTithes',
        args: [believer as `0x${string}`],
      });

      return result as bigint;
    } catch (error) {
      console.error('[Contract] Error calling getUserEntropyTithes:', error);
      throw error;
    }
  }

  /**
   * 查询 isResonanceTriggered()
   */
  async isResonanceTriggered(resonanceHash: string): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: this.config.contractAddress as `0x${string}`,
        abi: SOURCE_CULT_ABI,
        functionName: 'isResonanceTriggered',
        args: [resonanceHash as `0x${string}`],
      });

      return result as boolean;
    } catch (error) {
      console.error('[Contract] Error calling isResonanceTriggered:', error);
      throw error;
    }
  }

  /**
   * 获取账户地址
   */
  getAccountAddress(): string {
    return this.account.address;
  }

  /**
   * 获取公开客户端
   */
  getPublicClient(): ReturnType<typeof createPublicClient> {
    return this.publicClient;
  }
}

/**
 * 创建合约客户端实例
 */
export function createContractClient(config: ContractConfig): SourceCultContractClient {
  return new SourceCultContractClient(config);
}
