const hre = require("hardhat");

async function main() {
  console.log("开始升级 GUGUToken 合约...\n");

  // 获取代理合约地址（从命令行参数或环境变量）
  const proxyAddress = process.env.PROXY_ADDRESS || process.argv[2];
  
  if (!proxyAddress) {
    throw new Error("请提供代理合约地址: PROXY_ADDRESS=0x... npx hardhat run scripts/upgrade-gugu.js --network bscTestnet");
  }

  console.log("代理合约地址:", proxyAddress);

  // 获取当前实现合约地址
  const currentImplementation = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("当前实现合约地址:", currentImplementation);
  console.log("");

  // 获取新的合约工厂
  const GUGUTokenV2 = await hre.ethers.getContractFactory("GUGUToken");

  // 使用 OpenZeppelin upgrades 插件升级合约
  // 通过 hre.upgrades 访问插件（插件已在 hardhat.config.js 中注册）
  // 这会自动：
  // 1. 部署新的实现合约
  // 2. 调用代理合约的升级函数
  // 3. 验证升级兼容性（如果启用了验证）
  console.log("正在升级合约...");
  const upgraded = await hre.upgrades.upgradeProxy(proxyAddress, GUGUTokenV2);

  await upgraded.waitForDeployment();
  console.log("✅ 合约升级成功!");

  // 获取新的实现合约地址
  const newImplementation = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("新实现合约地址:", newImplementation);
  console.log("代理合约地址（不变）:", proxyAddress);

  // 等待区块确认
  console.log("\n等待区块确认...");
  await upgraded.deploymentTransaction()?.wait(5);
  console.log("区块确认完成!\n");

  // 验证新实现合约
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("开始验证新实现合约...");
    try {
      await hre.run("verify:verify", {
        address: newImplementation,
        constructorArguments: [],
      });
      console.log("✅ 新实现合约验证成功!");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ 合约已经验证过了");
      } else {
        console.error("❌ 验证失败:", error.message);
        console.log("\n可以手动验证合约:");
        console.log(`npx hardhat verify --network ${hre.network.name} ${newImplementation}`);
      }
    }
  } else {
    console.log("本地网络，跳过验证");
  }

  console.log("\n=== 升级信息 ===");
  console.log("网络:", hre.network.name);
  console.log("代理合约地址:", proxyAddress);
  console.log("旧实现合约地址:", currentImplementation);
  console.log("新实现合约地址:", newImplementation);
  console.log("BSCScan 链接:", `https://${hre.network.name === "bsc" ? "bscscan.com" : "testnet.bscscan.com"}/address/${proxyAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

