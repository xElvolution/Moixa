import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-verify';
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

const PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || '0x0000000000000000000000000000000000000000000000000000000000000001';
const MANTLE_RPC = process.env.MANTLE_RPC_URL || 'https://rpc.mantle.xyz';
const MANTLE_SEPOLIA_RPC = process.env.MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  paths: {
    sources: './contracts',
    tests: './contracts/test',
    cache: './contracts/cache',
    artifacts: './contracts/artifacts',
  },
  networks: {
    hardhat: { chainId: 31337 },
    mantle: {
      url: MANTLE_RPC,
      chainId: 5000,
      accounts: [PRIVATE_KEY],
    },
    mantleSepolia: {
      url: MANTLE_SEPOLIA_RPC,
      chainId: 5003,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    // Etherscan V2: a single key works across all Etherscan-family explorers,
    // routed via a single unified API endpoint that takes ?chainid=<id>.
    apiKey: ETHERSCAN_API_KEY,
    customChains: [
      {
        network: 'mantle',
        chainId: 5000,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api?chainid=5000',
          browserURL: 'https://mantlescan.xyz',
        },
      },
      {
        network: 'mantleSepolia',
        chainId: 5003,
        urls: {
          apiURL: 'https://api.etherscan.io/v2/api?chainid=5003',
          browserURL: 'https://sepolia.mantlescan.xyz',
        },
      },
    ],
  },
  sourcify: { enabled: false },
};

export default config;
