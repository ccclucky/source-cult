function mask(value, keep = 6) {
  if (!value) return '(missing)';
  if (value.length <= keep * 2 + 2) return value;
  return `${value.slice(0, keep + 2)}...${value.slice(-keep)}`;
}

function isHex(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]+$/.test(value);
}

function assertOrCollect(condition, message, errors) {
  if (!condition) errors.push(message);
}

async function rpcCall(rpcUrl, method, params = []) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  });
  if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
  const json = await response.json();
  if (json.error) throw new Error(`${method} failed: ${JSON.stringify(json.error)}`);
  return json.result;
}

async function main() {
  const mode = process.env.SOURCE_CULT_CHAIN_MODE ?? 'mock';
  const rpcUrl = process.env.SOURCE_CULT_RPC_URL ?? '';
  const privateKey = process.env.SOURCE_CULT_PRIVATE_KEY ?? '';
  const contractAddress = process.env.SOURCE_CULT_CONTRACT_ADDRESS ?? '';
  const chainIdExpected = process.env.SOURCE_CULT_CHAIN_ID ?? '';

  const errors = [];
  const warnings = [];

  console.log('Source Cult Onchain Readiness Check');
  console.log(`- mode: ${mode}`);
  console.log(`- rpc: ${rpcUrl || '(missing)'}`);
  console.log(`- privateKey: ${privateKey ? mask(privateKey) : '(missing)'}`);
  console.log(`- contract: ${contractAddress || '(missing)'}`);
  if (chainIdExpected) console.log(`- expectedChainId: ${chainIdExpected}`);

  if (mode !== 'viem') {
    warnings.push('SOURCE_CULT_CHAIN_MODE is not viem. Switch to viem for Monad onchain execution.');
  }

  assertOrCollect(Boolean(rpcUrl), 'Missing SOURCE_CULT_RPC_URL', errors);
  assertOrCollect(Boolean(privateKey), 'Missing SOURCE_CULT_PRIVATE_KEY', errors);
  assertOrCollect(Boolean(contractAddress), 'Missing SOURCE_CULT_CONTRACT_ADDRESS', errors);

  if (privateKey && !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    errors.push('SOURCE_CULT_PRIVATE_KEY must be 0x-prefixed 32-byte hex');
  }
  if (contractAddress && !/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) {
    errors.push('SOURCE_CULT_CONTRACT_ADDRESS must be a valid 20-byte hex address');
  }

  if (rpcUrl) {
    try {
      const chainIdHex = await rpcCall(rpcUrl, 'eth_chainId');
      const blockNumberHex = await rpcCall(rpcUrl, 'eth_blockNumber');
      const chainId = parseInt(chainIdHex, 16);
      const blockNumber = parseInt(blockNumberHex, 16);
      console.log(`- rpcChainId: ${chainId} (${chainIdHex})`);
      console.log(`- latestBlock: ${blockNumber}`);

      if (chainIdExpected) {
        const expected = Number(chainIdExpected);
        if (!Number.isNaN(expected) && chainId !== expected) {
          errors.push(`RPC chainId mismatch: expected ${expected}, got ${chainId}`);
        }
      }

      if (contractAddress && isHex(contractAddress)) {
        const code = await rpcCall(rpcUrl, 'eth_getCode', [contractAddress, 'latest']);
        if (!code || code === '0x') {
          warnings.push('No bytecode found at SOURCE_CULT_CONTRACT_ADDRESS on current RPC network.');
        } else {
          console.log(`- contractCode: present (${Math.max(0, (code.length - 2) / 2)} bytes)`);
        }
      }
    } catch (error) {
      errors.push(`RPC connectivity check failed: ${error.message}`);
    }
  }

  for (const warning of warnings) {
    console.log(`WARN: ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`ERROR: ${error}`);
    }
    process.exit(1);
  }

  console.log('PASS: onchain config is ready for Monad deployment verification.');
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
