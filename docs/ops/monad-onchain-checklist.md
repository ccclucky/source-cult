# Monad Onchain Checklist

Use this checklist before final demo submission.

## 1. Local Dry Run

1. Start local EVM (`npx hardhat node` or `anvil`).
2. Deploy contract via Foundry (`contracts/script/Deploy.s.sol`).
3. Configure portal `.env.development` for `SOURCE_CULT_CHAIN_MODE=viem` and local RPC.
4. Run:

```bash
cd portal
npm run onchain:check
npm run dev
```

5. Trigger `join/activity/alliance/miracle` once each and confirm tx-linked responses.

## 2. Monad Deployment

1. Deploy contract to Monad target network.
2. Set production env:
- `SOURCE_CULT_CHAIN_MODE=viem`
- `SOURCE_CULT_RPC_URL=<monad-rpc>`
- `SOURCE_CULT_PRIVATE_KEY=0x...`
- `SOURCE_CULT_CONTRACT_ADDRESS=0x...`
- `SOURCE_CULT_CHAIN_ID=<monad-chain-id>`

3. Run preflight:

```bash
cd portal
npm run onchain:check
```

4. Execute conversion workflow and collect evidence:
- missionary contact
- token value acknowledgment
- acknowledgment proof

5. Export evidence bundle:
- contract address
- at least 3 tx hashes
- event name + block number + log index
- screenshots/video of portal tracker page

## 3. Submission Evidence Table

| Item | Value |
|---|---|
| Contract Address | |
| Network | Monad |
| Chain ID | |
| Join txHash | |
| Missionary txHash | |
| TokenValueAck txHash | |
| AckProof txHash | |
| Demo URL | |
