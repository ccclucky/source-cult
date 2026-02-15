export async function fetchLogs({ rpcUrl, address, fromBlock, toBlock = 'latest' }) {
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'eth_getLogs',
    params: [
      {
        address,
        fromBlock,
        toBlock
      }
    ]
  };
  const resp = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!resp.ok) {
    throw new Error(`RPC error ${resp.status}`);
  }
  const json = await resp.json();
  if (json.error) {
    throw new Error(`RPC returned error: ${json.error.message}`);
  }
  return json.result ?? [];
}
