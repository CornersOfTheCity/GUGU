// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://v2.hardhat.org/ignition

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

  // 部署实现合约（Implementation）
  const implementation = m.contract("GUGUToken");

  // 编码 initialize 函数调用
  const initializeData = m.encodeFunctionCall(implementation, "initialize", [
    initialOwner,
  ]);

  // 部署 ERC1967 代理合约（UUPS 使用 ERC1967 标准）
  // ERC1967Proxy 构造函数参数：(implementation, _data)
  const proxy = m.contract("ERC1967Proxy", [implementation, initializeData], {
    id: "GUGUTokenProxy",
  });

  return { implementation, proxy };
});

