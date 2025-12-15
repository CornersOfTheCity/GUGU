const hre = require("hardhat");

async function main() {
  console.log("开始部署 DropNFT (NFT Drop) 合约...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("部署账户:", deployer.address);
  console.log(
    "账户余额:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    ),
    "BNB\n"
  );

  const nftAddress = process.env.NFT_CONTRACT;
  const signer = process.env.NFT_DROP_SIGNER;

  if (!nftAddress || nftAddress === "") {
    throw new Error("请在 .env 中设置 NFT_CONTRACT（NFT 合约地址）");
  }

  if (!signer || signer === "") {
    throw new Error("请在 .env 中设置 NFT_DROP_SIGNER（签名者地址）");
  }

  console.log("NFT_CONTRACT:", nftAddress);
  console.log("NFT_DROP_SIGNER:", signer, "\n");

  console.log("正在部署 DropNFT 合约...");
  const Distributor = await hre.ethers.getContractFactory(
    "DropNFT"
  );

  const distributor = await Distributor.deploy(nftAddress, signer);

  await distributor.waitForDeployment();
  const distributorAddress = await distributor.getAddress();

  console.log("✅ DropNFT 合约部署成功!");
  console.log("合约地址:", distributorAddress);
  console.log("部署交易哈希:", distributor.deploymentTransaction()?.hash);
  console.log("\n等待区块确认...");

  await distributor.deploymentTransaction()?.wait(5);
  console.log("区块确认完成!\n");

  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("开始验证合约...");
    try {
      await hre.run("verify:verify", {
        address: distributorAddress,
        constructorArguments: [nftAddress, signer],
      });
      console.log("✅ 合约验证成功! 合约已开源");
    } catch (error) {
      if (error.message && error.message.includes("Already Verified")) {
        console.log("✅ 合约已经验证过了");
      } else {
        console.error("❌ 验证失败:", error.message || error);
        console.log("\n可以手动验证合约:");
        console.log(
          `npx hardhat verify --network ${hre.network.name} ${distributorAddress} ${nftAddress} ${signer}`
        );
      }
    }
  } else {
    console.log("本地网络，跳过验证");
  }

  console.log("\n=== 部署信息 ===");
  console.log("网络:", hre.network.name);
  console.log("合约地址:", distributorAddress);
  console.log(
    "BSCScan 链接:",
    `https://${
      hre.network.name === "bsc" ? "bscscan.com" : "testnet.bscscan.com"
    }/address/${distributorAddress}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

