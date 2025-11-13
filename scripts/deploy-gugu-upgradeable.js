const hre = require("hardhat");

async function main() {
  console.log("开始部署 GUGUToken 合约（UUPS 可升级）...\n");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log("账户余额:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB\n");

  // 获取初始所有者地址（默认为部署者）
  const initialOwner = process.env.INITIAL_OWNER || deployer.address;
  console.log("初始所有者地址:", initialOwner);
  console.log("最大供应量: 10,000,000,000 GUGU\n");

  // 获取合约工厂
  const GUGUToken = await hre.ethers.getContractFactory("GUGUToken");

  // 使用 OpenZeppelin upgrades 插件部署 UUPS 代理
  // 通过 hre.upgrades 访问插件（插件已在 hardhat.config.js 中注册）
  // 这会自动处理：
  // 1. 部署实现合约
  // 2. 部署代理合约
  // 3. 调用 initialize 函数
  console.log("正在部署 GUGUToken 代理合约...");
  const proxy = await hre.upgrades.deployProxy(GUGUToken, [initialOwner], {
    kind: "uups",
    initializer: "initialize",
  });

  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();

  console.log("✅ GUGUToken 代理合约部署成功!");
  console.log("代理合约地址:", proxyAddress);

  // 获取实现合约地址
  const implementationAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log("实现合约地址:", implementationAddress);

  // 等待区块确认
  console.log("\n等待区块确认...");
  await proxy.deploymentTransaction()?.wait(5);
  console.log("区块确认完成!\n");

  // 获取代币信息
  const name = await proxy.name();
  const symbol = await proxy.symbol();
  const totalSupply = await proxy.totalSupply();
  const maxSupply = await proxy.MAX_SUPPLY();
  const ownerBalance = await proxy.balanceOf(initialOwner);

  console.log("=== 代币信息 ===");
  console.log("名称:", name);
  console.log("符号:", symbol);
  console.log("当前总供应量:", hre.ethers.formatEther(totalSupply), symbol);
  console.log("最大供应量:", hre.ethers.formatEther(maxSupply), symbol);
  console.log("所有者余额:", hre.ethers.formatEther(ownerBalance), symbol);
  console.log("所有者地址:", initialOwner);
  console.log("");

  // 验证合约
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("开始验证合约...");
    try {
      // 验证实现合约
      await hre.run("verify:verify", {
        address: implementationAddress,
        constructorArguments: [],
      });
      console.log("✅ 实现合约验证成功!");

      // 验证代理合约（需要特殊处理）
      // 注意：代理合约的验证可能需要手动在 BSCScan 上进行
      console.log("\n⚠️  代理合约验证说明:");
      console.log("代理合约需要手动验证，请访问 BSCScan:");
      console.log(`https://${hre.network.name === "bsc" ? "bscscan.com" : "testnet.bscscan.com"}/address/${proxyAddress}#code`);
      console.log("选择 'Is this a proxy?' 选项，然后输入实现合约地址:", implementationAddress);
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ 合约已经验证过了");
      } else {
        console.error("❌ 验证失败:", error.message);
      }
    }
  } else {
    console.log("本地网络，跳过验证");
  }

  console.log("\n=== 部署信息 ===");
  console.log("网络:", hre.network.name);
  console.log("代理合约地址:", proxyAddress);
  console.log("实现合约地址:", implementationAddress);
  console.log("BSCScan 链接:", `https://${hre.network.name === "bsc" ? "bscscan.com" : "testnet.bscscan.com"}/address/${proxyAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

