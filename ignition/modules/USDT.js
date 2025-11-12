// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://v2.hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("USDTModule", (m) => {
  // 部署 BEP20USDT 合约（无构造函数参数）
  const usdt = m.contract("BEP20USDT");

  return { usdt };
});

