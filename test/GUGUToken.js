const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");
const hre = require("hardhat");

describe("GUGUToken", function () {
  // 部署合约的 fixture
  async function deployGUGUTokenFixture() {
    const [owner, account1, account2, account3] = await ethers.getSigners();

    // 使用 upgrades 插件部署可升级合约
    const GUGUToken = await ethers.getContractFactory("GUGUToken");
    const token = await hre.upgrades.deployProxy(
      GUGUToken,
      [owner.address],
      {
        kind: "uups",
        initializer: "initialize",
      }
    );

    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();

    return {
      token,
      tokenAddress,
      owner,
      account1,
      account2,
      account3,
    };
  }

  describe("部署", function () {
    it("应该正确设置代币名称和符号", async function () {
      const { token } = await loadFixture(deployGUGUTokenFixture);

      expect(await token.name()).to.equal("GUGUToken");
      expect(await token.symbol()).to.equal("GUGU");
      expect(await token.decimals()).to.equal(18);
    });

    it("应该将全部代币铸造给初始所有者", async function () {
      const { token, owner } = await loadFixture(deployGUGUTokenFixture);

      const maxSupply = await token.MAX_SUPPLY();
      const ownerBalance = await token.balanceOf(owner.address);
      const totalSupply = await token.totalSupply();

      expect(ownerBalance).to.equal(maxSupply);
      expect(totalSupply).to.equal(maxSupply);
    });

    it("应该正确设置 owner", async function () {
      const { token, owner } = await loadFixture(deployGUGUTokenFixture);

      expect(await token.owner()).to.equal(owner.address);
    });
  });

  describe("转账功能", function () {
    it("应该能够转账代币", async function () {
      const { token, owner, account1 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("1000");
      await expect(token.transfer(account1.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, account1.address, amount);

      expect(await token.balanceOf(account1.address)).to.equal(amount);
    });

    it("转账后余额应该正确更新", async function () {
      const { token, owner, account1 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("5000");
      const ownerBalanceBefore = await token.balanceOf(owner.address);

      await token.transfer(account1.address, amount);

      expect(await token.balanceOf(owner.address)).to.equal(
        ownerBalanceBefore - amount
      );
      expect(await token.balanceOf(account1.address)).to.equal(amount);
    });

    it("应该拒绝从零地址转账", async function () {
      const { token, account1 } = await loadFixture(deployGUGUTokenFixture);

      const amount = ethers.parseEther("100");
      await expect(
        token.transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWithCustomError(token, "ERC20InvalidReceiver");
    });

    it("应该拒绝余额不足的转账", async function () {
      const { token, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("100");
      await expect(
        token.connect(account1).transfer(account2.address, amount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("应该支持 approve 和 transferFrom", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("2000");
      const approveAmount = ethers.parseEther("1500");

      // 先转账一些代币给 account1
      await token.transfer(account1.address, amount);

      // account1 授权 account2 使用代币
      await expect(
        token.connect(account1).approve(account2.address, approveAmount)
      )
        .to.emit(token, "Approval")
        .withArgs(account1.address, account2.address, approveAmount);

      expect(
        await token.allowance(account1.address, account2.address)
      ).to.equal(approveAmount);

      // account2 使用授权代币转账
      const transferAmount = ethers.parseEther("1000");
      await expect(
        token
          .connect(account2)
          .transferFrom(account1.address, account2.address, transferAmount)
      )
        .to.emit(token, "Transfer")
        .withArgs(account1.address, account2.address, transferAmount);

      expect(await token.balanceOf(account2.address)).to.equal(transferAmount);
      expect(
        await token.allowance(account1.address, account2.address)
      ).to.equal(approveAmount - transferAmount);
    });

    it("应该拒绝超过授权额度的 transferFrom", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("1000");
      const approveAmount = ethers.parseEther("500");

      await token.transfer(account1.address, amount);
      await token.connect(account1).approve(account2.address, approveAmount);

      await expect(
        token
          .connect(account2)
          .transferFrom(
            account1.address,
            account2.address,
            ethers.parseEther("600")
          )
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });
  });

  describe("Permit 功能 (ERC20Permit)", function () {
    it("应该能够使用 permit 进行授权", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("1000");
      const permitAmount = ethers.parseEther("500");
      const deadline = (await time.latest()) + 3600; // 1小时后过期

      // 先转账一些代币给 account1
      await token.transfer(account1.address, amount);

      // 获取 domain separator 和 nonce
      const domain = {
        name: await token.name(),
        version: "1",
        chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
        verifyingContract: await token.getAddress(),
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const nonce = await token.nonces(account1.address);

      // account1 签名授权 account2
      const value = {
        owner: account1.address,
        spender: account2.address,
        value: permitAmount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await account1.signTypedData(domain, types, value);
      const { r, s, v } = ethers.Signature.from(signature);

      // 使用 permit
      await expect(
        token.permit(
          account1.address,
          account2.address,
          permitAmount,
          deadline,
          v,
          r,
          s
        )
      )
        .to.emit(token, "Approval")
        .withArgs(account1.address, account2.address, permitAmount);

      expect(
        await token.allowance(account1.address, account2.address)
      ).to.equal(permitAmount);
    });

    it("应该拒绝过期的 permit", async function () {
      const { token, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const permitAmount = ethers.parseEther("500");
      const deadline = (await time.latest()) - 100; // 已过期

      const domain = {
        name: await token.name(),
        version: "1",
        chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
        verifyingContract: await token.getAddress(),
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const nonce = await token.nonces(account1.address);

      const value = {
        owner: account1.address,
        spender: account2.address,
        value: permitAmount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await account1.signTypedData(domain, types, value);
      const { r, s, v } = ethers.Signature.from(signature);

      await expect(
        token.permit(
          account1.address,
          account2.address,
          permitAmount,
          deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWithCustomError(token, "ERC2612ExpiredSignature");
    });

    it("应该拒绝重复使用相同 nonce 的 permit", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("1000");
      const permitAmount = ethers.parseEther("500");
      const deadline = (await time.latest()) + 3600;

      await token.transfer(account1.address, amount);

      const domain = {
        name: await token.name(),
        version: "1",
        chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
        verifyingContract: await token.getAddress(),
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      let nonce = await token.nonces(account1.address);

      const value = {
        owner: account1.address,
        spender: account2.address,
        value: permitAmount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await account1.signTypedData(domain, types, value);
      const { r, s, v } = ethers.Signature.from(signature);

      // 第一次使用 permit
      await token.permit(
        account1.address,
        account2.address,
        permitAmount,
        deadline,
        v,
        r,
        s
      );

      // 尝试再次使用相同的签名（应该失败，因为 nonce 已使用）
      await expect(
        token.permit(
          account1.address,
          account2.address,
          permitAmount,
          deadline,
          v,
          r,
          s
        )
      ).to.be.revertedWithCustomError(token, "ERC2612InvalidSigner");
    });
  });

  describe("投票功能 (ERC20Votes)", function () {
    it("应该能够委托投票权", async function () {
      const { token, owner, account1 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("1000");
      await token.transfer(account1.address, amount);

      // account1 委托给自己
      await expect(token.connect(account1).delegate(account1.address))
        .to.emit(token, "DelegateChanged")
        .withArgs(account1.address, ethers.ZeroAddress, account1.address);

      expect(await token.delegates(account1.address)).to.equal(
        account1.address
      );
    });

    it("应该能够更改委托", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("1000");
      await token.transfer(account1.address, amount);

      // 先委托给自己
      await token.connect(account1).delegate(account1.address);
      expect(await token.delegates(account1.address)).to.equal(
        account1.address
      );

      // 更改委托给 account2
      await expect(
        token.connect(account1).delegate(account2.address)
      ).to.emit(token, "DelegateChanged");

      expect(await token.delegates(account1.address)).to.equal(
        account2.address
      );
    });

    it("应该正确计算投票权", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("5000");
      await token.transfer(account1.address, amount);

      // account1 委托给 account2
      await token.connect(account1).delegate(account2.address);

      // account2 应该拥有 account1 的投票权
      const votes = await token.getVotes(account2.address);
      expect(votes).to.equal(amount);
    });

    it("转账后应该更新投票权", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("3000");
      await token.transfer(account1.address, amount);

      // account1 委托给自己
      await token.connect(account1).delegate(account1.address);

      const votesBefore = await token.getVotes(account1.address);
      expect(votesBefore).to.equal(amount);

      // account1 转账给 account2
      const transferAmount = ethers.parseEther("1000");
      await token.connect(account1).transfer(account2.address, transferAmount);

      // account1 的投票权应该减少
      const votesAfter = await token.getVotes(account1.address);
      expect(votesAfter).to.equal(amount - transferAmount);
    });

    it("应该能够获取历史投票权", async function () {
      const { token, owner, account1 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("2000");
      
      // 记录操作前的区块号
      const blockBefore = await ethers.provider.getBlockNumber();
      
      // 进行转账和委托操作
      await token.transfer(account1.address, amount);
      await token.connect(account1).delegate(account1.address);

      // 等待至少一个区块，让历史数据被记录
      // 通过发送一个空交易来推进区块
      await account1.sendTransaction({ to: account1.address, value: 0 });
      
      // 获取当前区块的投票权
      const votes = await token.getVotes(account1.address);
      expect(votes).to.equal(amount);

      // 获取历史投票权（操作前的区块，应该是0，因为还没有委托）
      const pastVotesBefore = await token.getPastVotes(
        account1.address,
        blockBefore
      );
      expect(pastVotesBefore).to.equal(0);

      // 获取当前区块之前的区块的历史投票权
      const currentBlock = await ethers.provider.getBlockNumber();
      const pastVotes = await token.getPastVotes(
        account1.address,
        currentBlock - 1
      );
      expect(pastVotes).to.equal(amount);
    });

    it("应该能够获取总供应量的历史值", async function () {
      const { token, owner } = await loadFixture(deployGUGUTokenFixture);

      // 记录部署后的区块号
      const blockAfterDeploy = await ethers.provider.getBlockNumber();
      
      // 等待至少一个区块
      await owner.sendTransaction({ to: owner.address, value: 0 });

      const totalSupply = await token.totalSupply();
      
      // 获取部署后区块的历史总供应量
      const pastTotalSupply = await token.getPastTotalSupply(blockAfterDeploy);
      expect(pastTotalSupply).to.equal(totalSupply);

      // 获取更早区块的历史总供应量（应该是0，因为还没部署）
      const blockBeforeDeploy = blockAfterDeploy - 1;
      if (blockBeforeDeploy >= 0) {
        const pastTotalSupplyBefore = await token.getPastTotalSupply(
          blockBeforeDeploy
        );
        expect(pastTotalSupplyBefore).to.equal(0);
      }
    });
  });

  describe("组合功能测试", function () {
    it("应该支持 permit + transferFrom 组合", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("2000");
      const permitAmount = ethers.parseEther("1500");
      const deadline = (await time.latest()) + 3600;

      await token.transfer(account1.address, amount);

      // 使用 permit 授权
      const domain = {
        name: await token.name(),
        version: "1",
        chainId: await ethers.provider.getNetwork().then((n) => n.chainId),
        verifyingContract: await token.getAddress(),
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const nonce = await token.nonces(account1.address);
      const value = {
        owner: account1.address,
        spender: account2.address,
        value: permitAmount,
        nonce: nonce,
        deadline: deadline,
      };

      const signature = await account1.signTypedData(domain, types, value);
      const { r, s, v } = ethers.Signature.from(signature);

      await token.permit(
        account1.address,
        account2.address,
        permitAmount,
        deadline,
        v,
        r,
        s
      );

      // 使用授权进行转账
      const transferAmount = ethers.parseEther("800");
      await token
        .connect(account2)
        .transferFrom(account1.address, account2.address, transferAmount);

      expect(await token.balanceOf(account2.address)).to.equal(transferAmount);
    });

    it("转账应该自动更新投票权", async function () {
      const { token, owner, account1, account2 } = await loadFixture(
        deployGUGUTokenFixture
      );

      const amount = ethers.parseEther("5000");
      await token.transfer(account1.address, amount);

      // 两个账户都委托给自己
      await token.connect(account1).delegate(account1.address);
      await token.connect(account2).delegate(account2.address);

      const votes1Before = await token.getVotes(account1.address);
      const votes2Before = await token.getVotes(account2.address);

      // account1 转账给 account2
      const transferAmount = ethers.parseEther("2000");
      await token.connect(account1).transfer(account2.address, transferAmount);

      const votes1After = await token.getVotes(account1.address);
      const votes2After = await token.getVotes(account2.address);

      expect(votes1After).to.equal(votes1Before - transferAmount);
      expect(votes2After).to.equal(votes2Before + transferAmount);
    });
  });
});

