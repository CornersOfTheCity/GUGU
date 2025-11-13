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
- `ETHERSCAN_API_KEY`: Etherscan API Key（用于合约验证，支持 BSC 网络，获取地址：https://etherscan.io/myapikey）
- `GUGU_TOKEN_OWNER`: （可选）GUGUToken 的初始所有者地址，如果不设置则使用部署者地址
- `GUGU_NFT_ADMIN`: （可选）GUGUNFT 的默认管理员地址，如果不设置则使用部署者地址
- `GUGU_NFT_MINTER`: （可选）GUGUNFT 的铸造者地址，如果不设置则使用部署者地址

### 3. 编译合约

```bash
npx hardhat compile
```

### 4. 部署合约

#### 部署 BSC-USDT 合约

**使用 Hardhat Ignition 部署：**

部署到 BSC 测试网：
```bash
npx hardhat ignition deploy ignition/modules/USDT.js --network bscTestnet
```

部署到 BSC 主网：
```bash
npx hardhat ignition deploy ignition/modules/USDT.js --network bsc
```

#### 部署 GUGUToken 合约（UUPS 可升级）

**推荐方式：使用 @openzeppelin/hardhat-upgrades 插件**

这是 OpenZeppelin 官方推荐的方式，会自动处理代理部署、初始化和升级兼容性验证。

部署到 BSC 测试网：
```bash
npx hardhat run scripts/deploy-gugu-upgradeable.js --network bscTestnet
```

部署到 BSC 主网：
```bash
npx hardhat run scripts/deploy-gugu-upgradeable.js --network bsc
```

自定义初始所有者地址：
```bash
# 方式1：通过环境变量
GUGU_TOKEN_OWNER=0xYourAddress npx hardhat run scripts/deploy-gugu-upgradeable.js --network bscTestnet

# 方式2：在 .env 文件中设置 GUGU_TOKEN_OWNER=0xYourAddress
```

部署后会显示：
- **代理合约地址**：这是实际使用的地址，用户应该使用这个地址
- **实现合约地址**：实现逻辑的地址

**备选方式：使用 Hardhat Ignition**

如果希望使用 Ignition 的部署管理功能：

```bash
# 测试网
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bscTestnet

# 主网
npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bsc
```

查看 Ignition 部署状态：
```bash
npx hardhat ignition status --network bscTestnet
```

#### 部署 GUGUNFT 合约

**使用部署脚本（推荐）：**

```bash
# 测试网
npx hardhat run scripts/deploy-gugu-nft.js --network bscTestnet

# 主网
npx hardhat run scripts/deploy-gugu-nft.js --network bsc
```

自定义管理员或铸造者地址：
```bash
# 方式1：通过环境变量
GUGU_NFT_ADMIN=0xAdmin GUGU_NFT_MINTER=0xMinter \
  npx hardhat run scripts/deploy-gugu-nft.js --network bscTestnet

# 方式2：在 .env 文件中设置
# GUGU_NFT_ADMIN=0xAdmin
# GUGU_NFT_MINTER=0xMinter
```

部署后会输出合约地址和验证命令，如需手动验证可参考脚本提示。

### 5. 升级合约

**推荐方式：使用 @openzeppelin/hardhat-upgrades 插件**

升级 GUGUToken 合约到新版本：

```bash
# 测试网
PROXY_ADDRESS=0x代理合约地址 npx hardhat run scripts/upgrade-gugu.js --network bscTestnet

# 或
npx hardhat run scripts/upgrade-gugu.js --network bscTestnet 0x代理合约地址

# 主网
PROXY_ADDRESS=0x代理合约地址 npx hardhat run scripts/upgrade-gugu.js --network bsc
```

**备选方式：使用 Hardhat Ignition**

```bash
# 测试网
npx hardhat ignition deploy ignition/modules/UpgradeGUGUToken.js --network bscTestnet --parameters '{"UpgradeGUGUTokenModule":{"proxyAddress":"0x代理合约地址"}}'

# 主网
npx hardhat ignition deploy ignition/modules/UpgradeGUGUToken.js --network bsc --parameters '{"UpgradeGUGUTokenModule":{"proxyAddress":"0x代理合约地址"}}'
```

**升级注意事项：**
- 只有合约的 owner 可以执行升级
- 升级不会影响代理合约地址，用户继续使用代理地址
- 升级前请确保新实现合约已经通过测试
- `@openzeppelin/hardhat-upgrades` 插件会自动验证升级兼容性

### 6. 验证合约（开源）

#### 验证 BSC-USDT

```bash
npx hardhat verify --network bscTestnet <合约地址>
```

#### 验证 GUGUToken

**使用 @openzeppelin/hardhat-upgrades 部署的合约：**

部署脚本会自动尝试验证实现合约。如果自动验证失败，可以手动验证：

```bash
# 验证实现合约
npx hardhat verify --network bscTestnet <实现合约地址>

# 代理合约验证
# 代理合约需要在 BSCScan 上手动验证
# 访问：https://testnet.bscscan.com/address/<代理合约地址>#code
# 选择 "Is this a proxy?" 选项，输入实现合约地址
```

**使用 Ignition 部署的合约：**

首先查看部署状态获取合约地址：

```bash
npx hardhat ignition status --network bscTestnet
```

然后验证：

```bash
# 验证实现合约
npx hardhat verify --network bscTestnet <实现合约地址>

# 验证代理合约（需要手动在 BSCScan 上进行）
```

## 网络配置

- **BSC 主网**: Chain ID 56
- **BSC 测试网**: Chain ID 97

## Solidity 版本

- 主要版本：0.8.28（用于 GUGUToken.sol 等新合约）
- 兼容版本：0.5.16（专门用于 BSC-USDT.sol）

## 技术栈

- **Hardhat**: 开发框架
- **OpenZeppelin Contracts**: 安全合约库
- **@openzeppelin/hardhat-upgrades**: 可升级合约部署工具（推荐）
- **Hardhat Ignition**: 部署管理工具（备选）

## 合约说明

### GUGUToken

- **类型**: ERC20 代币（UUPS 可升级）
- **总供应量**: 10,000,000,000 GUGU
- **初始供应量**: 10,000,000,000 GUGU（部署时全部铸造给初始所有者）
- **功能**: 
  - ERC20 标准功能
  - ERC20Permit（签名授权）
  - ERC20Votes（治理投票）
  - UUPS 可升级

### BSC-USDT

- **类型**: BEP20 代币
- **总供应量**: 30,000,000 USDT
- **功能**: 标准 BEP20 功能