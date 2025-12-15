const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log(
    "Balance:",
    hre.ethers.formatEther(
      await hre.ethers.provider.getBalance(deployer.address)
    ),
    "BNB/ETH"
  );

  const tokenAddress = process.env.GOV_TOKEN_ADDRESS;
  if (!tokenAddress) {
    throw new Error(
      "Missing GOV_TOKEN_ADDRESS env var (set it to the deployed GUGUToken proxy address)"
    );
  }

  const minDelay = Number(process.env.TIMELOCK_MIN_DELAY || "3600");

  const TimelockController = await hre.ethers.getContractFactory(
    "TimelockController"
  );

  const proposers = [];
  const executors = [hre.ethers.ZeroAddress];

  console.log("\nDeploying TimelockController...");
  const timelock = await TimelockController.deploy(
    minDelay,
    proposers,
    executors,
    deployer.address
  );
  await timelock.waitForDeployment();
  console.log("TimelockController:", await timelock.getAddress());

  console.log("\nDeploying GUGUGovernor...");
  const GUGUGovernor = await hre.ethers.getContractFactory("GUGUGovernor");
  const governor = await GUGUGovernor.deploy(tokenAddress, await timelock.getAddress());
  await governor.waitForDeployment();
  console.log("GUGUGovernor:", await governor.getAddress());

  console.log("\nConfiguring Timelock roles...");
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.DEFAULT_ADMIN_ROLE();

  await (await timelock.grantRole(proposerRole, await governor.getAddress())).wait();
  await (await timelock.grantRole(executorRole, hre.ethers.ZeroAddress)).wait();

  if (process.env.KEEP_TIMELOCK_ADMIN !== "true") {
    await (await timelock.revokeRole(adminRole, deployer.address)).wait();
    console.log("Revoked TIMELOCK_ADMIN_ROLE from deployer");
  } else {
    console.log("KEEP_TIMELOCK_ADMIN=true, keeping TIMELOCK_ADMIN_ROLE on deployer");
  }

  console.log("\nDone.");
  console.log("Token (IVotes):", tokenAddress);
  console.log("Timelock:", await timelock.getAddress());
  console.log("Governor:", await governor.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
