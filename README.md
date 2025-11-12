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

#### 使用 Hardhat Ignition 部署（推荐）

**部署 BSC-USDT 合约：**

部署到 BSC 测试网：
```bash
npx hardhat ignition deploy ignition/modules/USDT.js --network bscTestnet
```

部署到 BSC 主网：
```bash
npx hardhat ignition deploy ignition/modules/USDT.js --network bsc
```

**部署 GUGUToken 合约：**

使用默认所有者（部署者地址）：
```bash
# 测试网
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bscTestnet

# 主网
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bsc
```

自定义初始所有者地址：
```bash
# 测试网
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bscTestnet --parameters '{"GUGUTokenModule":{"initialOwner":"0xYourAddress"}}'

# 主网
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bsc --parameters '{"GUGUTokenModule":{"initialOwner":"0xYourAddress"}}'
```

**查看部署状态：**
```bash
npx hardhat ignition status --network bscTestnet
```

**重新执行失败的部署：**
```bash
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bscTestnet --reset
```

#### 使用传统脚本部署（备选方案）

**部署 BSC-USDT 合约：**

部署到 BSC 测试网：
```bash
npx hardhat run scripts/deploy-usdt.js --network bscTestnet
```

部署到 BSC 主网：
```bash
npx hardhat run scripts/deploy-usdt.js --network bsc
```

**部署 GUGUToken 合约：**

部署到 BSC 测试网：
```bash
npx hardhat run scripts/deploy-gugu.js --network bscTestnet
```

部署到 BSC 主网：
```bash
npx hardhat run scripts/deploy-gugu.js --network bsc
```

**注意**：传统脚本支持通过环境变量设置初始所有者：
```bash
INITIAL_OWNER=0xYourAddress npx hardhat run scripts/deploy-gugu.js --network bscTestnet
```

### 5. 验证合约（开源）

#### 使用 Ignition 部署后的验证

Ignition 部署后，需要手动验证合约。首先查看部署状态获取合约地址：

```bash
npx hardhat ignition status --network bscTestnet
```

然后使用以下命令验证：

**验证 BSC-USDT：**
```bash
npx hardhat verify --network bscTestnet <合约地址>
```

**验证 GUGUToken：**
```bash
npx hardhat verify --network bscTestnet <合约地址> <初始所有者地址>
```

例如：
```bash
npx hardhat verify --network bscTestnet 0x1234567890abcdef... 0xYourOwnerAddress
```

#### 使用传统脚本部署的验证

传统部署脚本会自动尝试验证合约。如果自动验证失败，可以使用上述手动验证命令。

## 网络配置

- **BSC 主网**: Chain ID 56
- **BSC 测试网**: Chain ID 97

## Solidity 版本

- 主要版本：0.8.28（用于 GUGUToken.sol 等新合约）
- 兼容版本：0.5.16（专门用于 BSC-USDT.sol）