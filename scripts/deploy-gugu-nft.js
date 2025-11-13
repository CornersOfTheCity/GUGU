const hre = require("hardhat");

async function main() {
  console.log("开始部署 GUGUNFT 合约...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log(
    "账户余额:",
    hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)),
    "BNB\n"
  );

  // 读取管理员和铸造者地址（支持新旧环境变量，默认使用部署者）
  const defaultAdmin =
    process.env.GUGU_NFT_ADMIN || process.env.DEFAULT_ADMIN || deployer.address;
  const minter =
    process.env.GUGU_NFT_MINTER || process.env.MINTER || deployer.address;

  console.log("默认管理员地址 (GUGU_NFT_ADMIN):", defaultAdmin);
  console.log("铸造者地址 (GUGU_NFT_MINTER):", minter, "\n");

  // 部署 GUGUNFT 合约
  console.log("正在部署 GUGUNFT 合约...");
  const GUGUNFT = await hre.ethers.getContractFactory("GUGUNFT");
  const nft = await GUGUNFT.deploy(defaultAdmin, minter);

  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();

  console.log("✅ GUGUNFT 合约部署成功!");
  console.log("合约地址:", nftAddress);
  console.log("部署交易哈希:", nft.deploymentTransaction()?.hash);
  console.log("\n等待区块确认...");

  // 等待几个区块确认
  await nft.deploymentTransaction()?.wait(5);
  console.log("区块确认完成!\n");

  // 验证合约
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("开始验证合约...");
    try {
      await hre.run("verify:verify", {
        address: nftAddress,
        constructorArguments: [defaultAdmin, minter],
      });
      console.log("✅ 合约验证成功! 合约已开源");
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        console.log("✅ 合约已经验证过了");
      } else {
        console.error("❌ 验证失败:", error.message);
        console.log("\n可以手动验证合约:");
        console.log(
          `npx hardhat verify --network ${hre.network.name} ${nftAddress} ${defaultAdmin} ${minter}`
        );
      }
    }
  } else {
    console.log("本地网络，跳过验证");
  }

  console.log("\n=== 部署信息 ===");
  console.log("网络:", hre.network.name);
  console.log("合约地址:", nftAddress);
  console.log(
    "BSCScan 链接:",
    `https://${hre.network.name === "bsc" ? "bscscan.com" : "testnet.bscscan.com"}/address/${nftAddress}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
