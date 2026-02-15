# Source Cult Contracts

## Build

```bash
forge build
```

## Test

```bash
forge test -vv
```

## Deploy

```bash
PRIVATE_KEY=<hex_no_0x_prefix> RPC_URL=<rpc> forge script script/Deploy.s.sol:Deploy \
  --rpc-url $RPC_URL --broadcast
```

## Local Test Network (Hardhat/Anvil)

1. Start local EVM node (either works):

```bash
# Hardhat
npx hardhat node

# or Anvil
anvil
```

2. Deploy to local RPC:

```bash
PRIVATE_KEY=<hex_no_0x_prefix> RPC_URL=http://127.0.0.1:8545 \
forge script script/Deploy.s.sol:Deploy --rpc-url $RPC_URL --broadcast
```

## Monad Deployment Checklist

1. Use Monad RPC URL and funded deployer private key.
2. Broadcast deployment and record contract address.
3. Set portal env:
- `SOURCE_CULT_CHAIN_MODE=viem`
- `SOURCE_CULT_RPC_URL=<monad-rpc>`
- `SOURCE_CULT_PRIVATE_KEY=0x...`
- `SOURCE_CULT_CONTRACT_ADDRESS=0x...`
- `SOURCE_CULT_CHAIN_ID=<monad-chain-id>`
4. Run from `portal/`:

```bash
npm run onchain:check
```

5. Execute one write API (`/api/join`, `/api/activity`, etc.) and capture tx evidence.

Contract emits the frozen event set:
- AgentRegistered
- InitiationCompleted
- AllianceFormed
- MiracleRecorded
- ActivityLogged
