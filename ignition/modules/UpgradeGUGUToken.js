// This setup uses Hardhat Ignition to manage smart contract upgrades.
// Learn more about it at https://v2.hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("UpgradeGUGUTokenModule", (m) => {
  // 获取已部署的代理合约地址
  // 可以通过 --parameters 选项传递，例如：
  // npx hardhat ignition deploy ignition/modules/UpgradeGUGUToken.js --network bscTestnet --parameters '{"UpgradeGUGUTokenModule":{"proxyAddress":"0x..."}}'
  const proxyAddress = m.getParameter(
    "proxyAddress",
    "0x0000000000000000000000000000000000000000"
  );

  if (proxyAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("proxyAddress parameter is required");
  }

  // 部署新的实现合约
  const newImplementation = m.contract("GUGUToken", {
    id: "GUGUTokenV2",
  });

  // 获取代理合约实例
  const proxy = m.contractAt("GUGUToken", proxyAddress);

  // 调用升级函数（只有 owner 可以调用）
  // upgradeToAndCall 是 UUPSUpgradeable 提供的函数
  // 第二个参数是空字节，表示不调用任何函数
  m.call(proxy, "upgradeToAndCall", [newImplementation, "0x"], {
    id: "upgradeGUGUToken",
  });

  return { newImplementation, proxy };
});

