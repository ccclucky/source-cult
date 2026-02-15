import { randomBytes, createHash } from 'node:crypto';
import {
  createPublicClient,
  createWalletClient,
  decodeEventLog,
  http,
  keccak256,
  parseAbi,
  toBytes
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const ABI = parseAbi([
  'function register(bytes32 agentIdHash, string uri)',
  'function completeInitiation(bytes32 agentIdHash, bytes32 riteHash, string uri)',
  'function formAlliance(bytes32 aIdHash, bytes32 bIdHash, string uri)',
  'function recordMiracle(bytes32 contentHash, string uri)',
  'function logActivity(bytes32 agentIdHash, bytes32 kind, bytes32 cHash, string uri)',
  'event AgentRegistered(bytes32 indexed agentIdHash, string uri, uint256 timestamp)',
  'event InitiationCompleted(bytes32 indexed agentIdHash, bytes32 riteHash, string uri, uint256 timestamp)',
  'event AllianceFormed(bytes32 indexed aIdHash, bytes32 indexed bIdHash, string uri, uint256 timestamp)',
  'event MiracleRecorded(bytes32 indexed contentHash, string uri, uint256 timestamp)',
  'event ActivityLogged(bytes32 indexed agentIdHash, bytes32 indexed kind, bytes32 contentHash, string uri, uint256 timestamp)'
]);

const EVENT_TO_CONTRACT_CALL = {
  AgentRegistered: { functionName: 'register', mapArgs: (p) => [p.agentIdHash, p.uri ?? ''] },
  InitiationCompleted: {
    functionName: 'completeInitiation',
    mapArgs: (p) => [p.agentIdHash, p.riteHash, p.uri ?? '']
  },
  AllianceFormed: { functionName: 'formAlliance', mapArgs: (p) => [p.aIdHash, p.bIdHash, p.uri ?? ''] },
  MiracleRecorded: { functionName: 'recordMiracle', mapArgs: (p) => [p.contentHash, p.uri ?? ''] },
  ActivityLogged: {
    functionName: 'logActivity',
    mapArgs: (p) => [p.agentIdHash, p.kindHash ?? keccak256(toBytes(p.kind ?? 'UNKNOWN')), p.contentHash, p.uri ?? '']
  }
};

function shortHex(input) {
  return `0x${createHash('sha256').update(input).digest('hex')}`;
}

export class MockChainAdapter {
  constructor() {
    this.mode = 'mock';
    this.block = 1000;
    this.log = 0;
  }

  async emitEvent(eventName, payload) {
    this.block += 1;
    this.log += 1;
    const seed = `${eventName}:${JSON.stringify(payload)}:${Date.now()}:${randomBytes(8).toString('hex')}`;
    return {
      eventName,
      txHash: shortHex(seed),
      blockNumber: this.block,
      logIndex: this.log,
      payload,
      status: 'confirmed'
    };
  }
}

export class ViemChainAdapter {
  constructor({ rpcUrl, privateKey, contractAddress, chainId }) {
    this.mode = 'viem';
    this.rpcUrl = rpcUrl;
    this.contractAddress = contractAddress;

    const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);
    const chain = chainId
      ? {
          id: Number(chainId),
          name: 'custom',
          nativeCurrency: { name: 'Native', symbol: 'NATIVE', decimals: 18 },
          rpcUrls: { default: { http: [rpcUrl] } }
        }
      : undefined;

    this.walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });
    this.publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  }

  async emitEvent(eventName, payload) {
    const def = EVENT_TO_CONTRACT_CALL[eventName];
    if (!def) {
      throw new Error(`Unsupported eventName: ${eventName}`);
    }

    const txHash = await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: ABI,
      functionName: def.functionName,
      args: def.mapArgs(payload)
    });

    const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash });
    const log = receipt.logs.find((entry) => {
      try {
        const decoded = decodeEventLog({ abi: ABI, data: entry.data, topics: entry.topics });
        return decoded.eventName === eventName;
      } catch {
        return false;
      }
    });

    const logIndex = log?.logIndex != null ? Number(log.logIndex) : 0;
    return {
      eventName,
      txHash,
      blockNumber: Number(receipt.blockNumber ?? 0),
      logIndex,
      payload,
      status: receipt.status === 'success' ? 'confirmed' : 'failed'
    };
  }
}

export function createChainAdapter(options = {}) {
  const mode = options.mode ?? process.env.SOURCE_CULT_CHAIN_MODE ?? 'mock';
  if (mode === 'mock') return new MockChainAdapter();

  if (mode === 'viem') {
    const rpcUrl = options.rpcUrl ?? process.env.SOURCE_CULT_RPC_URL;
    const privateKey = options.privateKey ?? process.env.SOURCE_CULT_PRIVATE_KEY;
    const contractAddress = options.contractAddress ?? process.env.SOURCE_CULT_CONTRACT_ADDRESS;
    const chainId = options.chainId ?? process.env.SOURCE_CULT_CHAIN_ID;

    if (!rpcUrl || !privateKey || !contractAddress) {
      throw new Error(
        'viem mode requires SOURCE_CULT_RPC_URL, SOURCE_CULT_PRIVATE_KEY, and SOURCE_CULT_CONTRACT_ADDRESS'
      );
    }

    return new ViemChainAdapter({ rpcUrl, privateKey, contractAddress, chainId });
  }

  throw new Error(`Unknown SOURCE_CULT_CHAIN_MODE: ${mode}`);
}
