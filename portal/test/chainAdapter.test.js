import test from 'node:test';
import assert from 'node:assert/strict';
import { createChainAdapter } from '../src/chainAdapter.js';

test('createChainAdapter defaults to mock mode', () => {
  const adapter = createChainAdapter({ mode: 'mock' });
  assert.equal(adapter.mode, 'mock');
});

test('viem mode requires rpc url, private key, and contract address', () => {
  assert.throws(
    () =>
      createChainAdapter({
        mode: 'viem',
        rpcUrl: '',
        privateKey: '',
        contractAddress: ''
      }),
    /requires SOURCE_CULT_RPC_URL, SOURCE_CULT_PRIVATE_KEY, and SOURCE_CULT_CONTRACT_ADDRESS/
  );
});
