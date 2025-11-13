// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://v2.hardhat.org/ignition
//
// 注意：对于可升级合约，推荐使用 scripts/deploy-gugu-upgradeable.js
// 该脚本使用 @openzeppelin/hardhat-upgrades 插件，这是 OpenZeppelin 官方推荐的方式

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("GUGUTokenModule", (m) => {
  // 获取部署者地址作为默认初始所有者
  const deployer = m.getAccount(0);

  // 从环境变量读取初始所有者（可选）
  const envInitialOwner = process.env.INITIAL_OWNER;

  // 获取初始所有者地址参数（可选）
  // 可以通过 --parameters 选项传递，例如：
  // npx hardhat ignition deploy ignition/modules/GUGUToken.js --network bscTestnet --parameters '{"GUGUTokenModule":{"initialOwner":"0x..."}}'
  // 默认顺序：参数 > 环境变量 > 部署者地址
  const initialOwner = m.getParameter(
    "initialOwner",
    envInitialOwner && envInitialOwner !== "" ? envInitialOwner : deployer
  );

  // 注意：Ignition 目前对可升级合约的支持有限
  // 推荐使用 scripts/deploy-gugu-upgradeable.js 进行部署
  // 该脚本使用 @openzeppelin/hardhat-upgrades 插件
  
  // 如果仍想使用 Ignition，需要手动部署实现和代理
  // 这里提供一个基础示例（不推荐）
  const implementation = m.contract("GUGUToken");
  
  // 编码 initialize 函数调用
  const initializeData = m.encodeFunctionCall(implementation, "initialize", [
    initialOwner,
  ]);

  // 注意：这需要 contracts/ERC1967Proxy.sol 存在
  // 更好的方式是使用 scripts/deploy-gugu-upgradeable.js
  throw new Error(
    "请使用 scripts/deploy-gugu-upgradeable.js 部署可升级合约。" +
    "该脚本使用 @openzeppelin/hardhat-upgrades 插件，是 OpenZeppelin 官方推荐的方式。"
  );
});

