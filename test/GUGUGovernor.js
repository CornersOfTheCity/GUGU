const { expect } = require("chai");
const { loadFixture, time, mine } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers, upgrades } = require("hardhat");

describe("GUGUGovernor", function () {
  async function deployGovernorFixture() {
    const [deployer, voter] = await ethers.getSigners();

    const GUGUToken = await ethers.getContractFactory("GUGUToken");
    const token = await upgrades.deployProxy(GUGUToken, [deployer.address], {
      kind: "uups",
      initializer: "initialize",
    });
    await token.waitForDeployment();

    const TimelockController = await ethers.getContractFactory(
      "TimelockController"
    );

    const minDelay = 1;
    const proposers = [];
    const executors = [ethers.ZeroAddress];

    const timelock = await TimelockController.deploy(
      minDelay,
      proposers,
      executors,
      deployer.address
    );
    await timelock.waitForDeployment();

    const GUGUGovernor = await ethers.getContractFactory("GUGUGovernor");
    const governor = await GUGUGovernor.deploy(await token.getAddress(), await timelock.getAddress());
    await governor.waitForDeployment();

    const Box = await ethers.getContractFactory("Box");
    const box = await Box.deploy(deployer.address);
    await box.waitForDeployment();

    await box.transferOwnership(await timelock.getAddress());

    const proposerRole = await timelock.PROPOSER_ROLE();
    const executorRole = await timelock.EXECUTOR_ROLE();
    const adminRole = await timelock.DEFAULT_ADMIN_ROLE();

    await timelock.grantRole(proposerRole, await governor.getAddress());
    await timelock.grantRole(executorRole, ethers.ZeroAddress);
    await timelock.revokeRole(adminRole, deployer.address);

    const votingPower = ethers.parseEther("1000000");
    await token.transfer(voter.address, votingPower);
    await token.connect(voter).delegate(voter.address);
    await token.connect(deployer).delegate(deployer.address);
    await mine(1);

    return { deployer, voter, token, timelock, governor, box, minDelay };
  }

  async function proposeVoteQueueExecute({ governor, proposer, targets, values, calldatas, description, minDelay }) {
    const proposeTx = await governor
      .connect(proposer)
      .propose(targets, values, calldatas, description);
    await proposeTx.wait();

    const descriptionHash = ethers.id(description);
    const proposalId = await governor.hashProposal(
      targets,
      values,
      calldatas,
      descriptionHash
    );

    const votingDelay = await governor.votingDelay();
    await mine(Number(votingDelay) + 1);

    await governor.connect(proposer).castVote(proposalId, 1);

    const votingPeriod = await governor.votingPeriod();
    await mine(Number(votingPeriod) + 1);

    await governor.queue(targets, values, calldatas, descriptionHash);

    await time.increase(minDelay + 1);
    await mine(1);

    await governor.execute(targets, values, calldatas, descriptionHash);
  }

  it("should go through propose -> vote -> queue -> execute", async function () {
    const { deployer, voter, governor, box, minDelay } = await loadFixture(
      deployGovernorFixture
    );

    const encodedCall = box.interface.encodeFunctionData("store", [42]);
    const description = "Proposal #1: Store 42 in the Box";

    const proposeTx = await governor
      .connect(voter)
      .propose([await box.getAddress()], [0], [encodedCall], description);
    await proposeTx.wait();

    const descriptionHash = ethers.id(description);
    const proposalId = await governor.hashProposal(
      [await box.getAddress()],
      [0],
      [encodedCall],
      descriptionHash
    );

    expect(await governor.state(proposalId)).to.equal(0);

    const votingDelay = await governor.votingDelay();
    await mine(Number(votingDelay) + 1);

    expect(await governor.state(proposalId)).to.equal(1);

    await expect(governor.connect(voter).castVote(proposalId, 1))
      .to.emit(governor, "VoteCast");

    await expect(governor.connect(deployer).castVote(proposalId, 1))
      .to.emit(governor, "VoteCast");

    const votingPeriod = await governor.votingPeriod();
    await mine(Number(votingPeriod) + 1);

    expect(await governor.state(proposalId)).to.equal(4);

    await expect(
      governor.queue(
        [await box.getAddress()],
        [0],
        [encodedCall],
        descriptionHash
      )
    ).to.emit(governor, "ProposalQueued");

    await time.increase(minDelay + 1);
    await mine(1);

    await expect(
      governor.execute(
        [await box.getAddress()],
        [0],
        [encodedCall],
        descriptionHash
      )
    ).to.emit(governor, "ProposalExecuted");

    expect(await box.retrieve()).to.equal(42);
  });

  it("should restrict settings functions to onlyGovernance", async function () {
    const { governor } = await loadFixture(deployGovernorFixture);

    await expect(governor.setVotingDelay(1)).to.be.reverted;
    await expect(governor.setVotingPeriod(1)).to.be.reverted;
    await expect(governor.setProposalThreshold(1)).to.be.reverted;
  });

  it("should be able to change GovernorSettings via proposal", async function () {
    const { deployer, governor, minDelay } = await loadFixture(
      deployGovernorFixture
    );

    const newVotingPeriod = 10;
    const calldata = governor.interface.encodeFunctionData("setVotingPeriod", [
      newVotingPeriod,
    ]);

    await proposeVoteQueueExecute({
      governor,
      proposer: deployer,
      targets: [await governor.getAddress()],
      values: [0],
      calldatas: [calldata],
      description: "Proposal #2: Update voting period",
      minDelay,
    });

    expect(await governor.votingPeriod()).to.equal(newVotingPeriod);
  });
});
