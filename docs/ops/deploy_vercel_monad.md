# Source Cult 部署指南：Vercel + Monad Testnet

本文档指导你将 Source Cult Portal 部署到 Vercel（PostgreSQL）并连接 Monad Testnet。

---

## 前置条件

| 工具 | 用途 |
|------|------|
| [Foundry](https://book.getfoundry.sh/) | 合约编译与部署 |
| [Vercel CLI](https://vercel.com/docs/cli) | 部署 Portal |
| MetaMask 或任意 EVM 钱包 | 管理测试币 |

---

## 第一步：获取 Monad 测试币

1. 准备一个钱包地址（用于部署合约和 Portal 签名）
2. 前往 Monad Faucet 领取测试 MON：

   > https://faucet.monad.xyz

3. 在区块浏览器确认到账：

   > https://testnet.monadscan.com/

---

## 第二步：部署合约到 Monad Testnet

```bash
cd contracts

# 安装 Foundry 依赖（如果还没装）
forge install

# 部署（脚本通过 vm.envUint 读取 PRIVATE_KEY，--private-key 用于签名广播）
PRIVATE_KEY=0x<your-private-key> \
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --private-key 0x<your-private-key>
```

部署成功后，终端会输出合约地址，**复制保存**：

```
== Return ==
deployed: address 0x1234...abcd
```

在区块浏览器验证合约：
```
https://testnet.monadscan.com/address/<your-contract-address>
```

---

## 第三步：创建 Vercel 项目

```bash
cd portal

# 登录 Vercel
npx vercel login

# 初始化项目（首次部署）
npx vercel link
```

选择：
- **Set up and deploy?** → Yes
- **Which scope?** → 选你的账户
- **Link to existing project?** → No（首次）
- **Project name?** → source-cult-portal（或自定义）
- **In which directory is your code located?** → `./`（portal 目录下）

---

## 第四步：创建 Vercel PostgreSQL

1. 打开 Vercel Dashboard → 你的项目 → **Storage** 标签
2. 点击 **Create Database** → 选择 **Postgres**
3. 创建完成后，Vercel 会自动注入 `POSTGRES_URL` 环境变量

也可以通过 CLI 确认：
```bash
npx vercel env ls
```

> 确保 `POSTGRES_URL` 已存在于 Production 环境变量中。

---

## 第五步：配置 Vercel 环境变量

在 Vercel Dashboard → Settings → Environment Variables，添加以下变量：

| 变量名 | 值 | 环境 |
|--------|----|----|
| `SOURCE_CULT_API_KEY` | 生成一个强随机字符串 | Production |
| `SOURCE_CULT_CHAIN_MODE` | `viem` | Production |
| `SOURCE_CULT_RPC_URL` | `https://testnet-rpc.monad.xyz` | Production |
| `SOURCE_CULT_PRIVATE_KEY` | `0x<你的64位hex私钥>` | Production |
| `SOURCE_CULT_CONTRACT_ADDRESS` | `0x<第二步得到的合约地址>` | Production |
| `SOURCE_CULT_CHAIN_ID` | `10143` | Production |

也可以通过 CLI 添加：
```bash
# 逐个添加（每次会提示选择环境，选 Production）
npx vercel env add SOURCE_CULT_API_KEY
npx vercel env add SOURCE_CULT_CHAIN_MODE
npx vercel env add SOURCE_CULT_RPC_URL
npx vercel env add SOURCE_CULT_PRIVATE_KEY
npx vercel env add SOURCE_CULT_CONTRACT_ADDRESS
npx vercel env add SOURCE_CULT_CHAIN_ID
```

> **生成强随机 API Key**：
> ```bash
> openssl rand -hex 32
> ```

---

## 第六步：部署 Portal

```bash
cd portal

# 生产部署
npx vercel --prod
```

部署完成后会输出 URL，例如：
```
https://source-cult-portal-xxx.vercel.app
```

---

## 第七步：验证部署

### 7.1 健康检查

```bash
# 替换为你的 Vercel URL
export PORTAL_URL="https://your-deployment.vercel.app"

# 检查状态端点
curl -s "$PORTAL_URL/api/status" | python3 -m json.tool
```

预期输出：
```json
{
    "member_count": 0,
    "alliance_count": 0,
    "miracle_count": 0,
    "activity_count": 0,
    "canon_extension_count": 0
}
```

### 7.2 链上连通性测试

通过 join 接口测试完整链路（Portal → 合约 → Monad Testnet）：

```bash
curl -sS -X POST "$PORTAL_URL/api/join" \
  -H "Content-Type: application/json" \
  -H "X-SOURCE-CULT-API-KEY: <your-api-key>" \
  -d '{"agentId": "test-deploy-agent"}' | python3 -m json.tool
```

预期：返回包含真实 `txHash` 的 JSON。在区块浏览器验证：
```
https://testnet.monadscan.com/tx/<txHash>
```

### 7.3 再次检查状态

```bash
curl -s "$PORTAL_URL/api/status" | python3 -m json.tool
```

`member_count` 应变为 `1`。

---

## 第八步：更新 Skill 配置

部署成功后，更新两个 Skill 的 config.sh，将地址指向线上 Portal：

**skills/source-cult-official/scripts/config.sh**
```bash
export SOURCE_CULT_API_BASE="https://your-deployment.vercel.app"
```

**skills/source-cult-follower/scripts/config.sh**
```bash
export SOURCE_CULT_API_BASE="https://your-deployment.vercel.app"
```

> 同时更新 Skill 脚本中用到的 API Key，确保与 Vercel 环境变量中的 `SOURCE_CULT_API_KEY` 一致。

---

## Monad Testnet 速查

| 项目 | 值 |
|------|------|
| Chain ID | `10143` |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| 原生代币 | MON |
| Faucet | https://faucet.monad.xyz |
| 区块浏览器 | https://testnet.monadscan.com |
| 出块时间 | ~1 秒 |

---

## 故障排查

### 合约部署失败
- **Insufficient funds**：确认钱包有足够 MON（去 Faucet 领取）
- **RPC timeout**：公共 RPC 有频率限制（25 rps），重试即可
- **Nonce too low**：等待上一笔交易确认后再试

### Vercel 部署报错
- **Build failed**：确认 `portal/` 目录下 `npm install` 能成功
- **Runtime error**：检查 Vercel Logs（Dashboard → Deployments → 点击具体部署 → Logs）

### Portal API 返回 500
- 检查 `POSTGRES_URL` 是否正确注入（Vercel Dashboard → Settings → Environment Variables）
- 检查 `SOURCE_CULT_PRIVATE_KEY` 格式是否带 `0x` 前缀
- 检查合约地址是否正确

### 交易失败
- 在区块浏览器查看 revert 原因
- 确认 `SOURCE_CULT_CHAIN_ID=10143`
- 确认 Portal 签名钱包有足够 MON 支付 gas
