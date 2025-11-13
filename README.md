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

**部署 GUGUToken 合约（UUPS 可升级）：**

使用默认所有者（部署者地址）：
```bash
# 测试网
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bscTestnet

# 主网
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bsc
```

自定义初始所有者地址（通过环境变量）：
```bash
# 在 .env 文件中设置 INITIAL_OWNER=0xYourAddress
# 然后运行：
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bscTestnet
```

或者通过参数传递：
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

部署后会返回两个地址：
- `implementation`: 实现合约地址
- `proxy`: 代理合约地址（这是实际使用的地址）

### 5. 升级合约

**升级 GUGUToken 合约：**

升级到新版本：
```bash
# 测试网
npx hardhat ignition deploy ignition/modules/UpgradeGUGUToken.js --network bscTestnet --parameters '{"UpgradeGUGUTokenModule":{"proxyAddress":"0x代理合约地址"}}'

# 主网
npx hardhat ignition deploy ignition/modules/UpgradeGUGUToken.js --network bsc --parameters '{"UpgradeGUGUTokenModule":{"proxyAddress":"0x代理合约地址"}}'
```

**注意：**
- 只有合约的 owner 可以执行升级
- 升级不会影响代理合约地址，用户继续使用代理地址
- 升级前请确保新实现合约已经通过测试

### 6. 验证合约（开源）

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

## Solidity 版本

- 主要版本：0.8.28（用于 GUGUToken.sol 等新合约）
- 兼容版本：0.5.16（专门用于 BSC-USDT.sol）