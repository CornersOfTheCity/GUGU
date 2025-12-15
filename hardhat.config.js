require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          evmVersion: "cancun",
        },
      },
    ],
    overrides: {
      "contracts/BSC-USDT.sol": {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // Ethereum 主网
    mainnet: {
      url:
        process.env.ETH_MAINNET_RPC_URL ||
        (process.env.ALCHEMY_API_KEY
          ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : ""),
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    // Ethereum Sepolia 测试网
    sepolia: {
      url:
        process.env.ETH_SEPOLIA_RPC_URL ||
        (process.env.ALCHEMY_API_KEY
          ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : ""),
      chainId: 11155111,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    bsc: {
      url:
        process.env.BSC_RPC_URL ||
        (process.env.ALCHEMY_API_KEY
          ? `https://bnb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : "https://bsc-dataseed.binance.org/"),
      chainId: 56,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    bscTestnet: {
      url:
        process.env.BSC_TESTNET_RPC_URL ||
        (process.env.ALCHEMY_API_KEY
          ? `https://bnb-testnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
          : "https://data-seed-prebsc-1-s1.binance.org:8545/"),
      chainId: 97,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      // 以太坊主网 & Sepolia
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      // BSC 主网 & 测试网（使用 BscScan 的 key）
      bsc: process.env.BSCSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "",
      bscTestnet: process.env.BSCSCAN_API_KEY || process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      // Ethereum 主网
      {
        network: "mainnet",
        chainId: 1,
        urls: {
          apiURL: "https://api.etherscan.io/api",
          browserURL: "https://etherscan.io",
        },
      },
      // Ethereum Sepolia
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io",
        },
      },
      {
        network: "bsc",
        chainId: 56,
        urls: {
          apiURL: "https://api.bscscan.com/api",
          browserURL: "https://bscscan.com",
        },
      },
      {
        network: "bscTestnet",
        chainId: 97,
        urls: {
          apiURL: "https://api-testnet.bscscan.com/api",
          browserURL: "https://testnet.bscscan.com",
        },
      },
    ],
  },
  sourcify: { enabled: false },
};
