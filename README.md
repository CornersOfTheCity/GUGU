# GUGU

## 环境配置

### 1. 安装依赖

```bash
yarn install
# 或
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下信息：

- `PRIVATE_KEY`: 你的钱包私钥（用于部署和交易签名）
- `BSCSCAN_API_KEY`: BSCScan API Key（用于合约验证，获取地址：https://bscscan.com/myapikey）

### 3. 编译合约

```bash
npx hardhat compile
```

### 4. 部署合约

部署到 BSC 测试网：
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

部署到 BSC 主网：
```bash
npx hardhat run scripts/deploy.js --network bsc
```

### 5. 验证合约（开源）

部署后验证合约到 BSCScan：

```bash
npx hardhat verify --network bscTestnet <合约地址> <构造函数参数>
```

例如：
```bash
npx hardhat verify --network bscTestnet 0x1234567890abcdef... "GUGU Token" "GUGU"
```

## 网络配置

- **BSC 主网**: Chain ID 56
- **BSC 测试网**: Chain ID 97

## Solidity 版本

- 主要版本：0.8.28（用于 GUGUToken.sol 等新合约）
- 兼容版本：0.5.16（专门用于 BSC-USDT.sol）