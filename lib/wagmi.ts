import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';
import { injected } from 'wagmi/connectors';

export const mantle = defineChain({
  id: 5000,
  name: 'Mantle',
  nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MantleScan', url: 'https://mantlescan.xyz' },
  },
  testnet: false,
});

export const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'MantleScan', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
});

// The interactive dApp runs on Sepolia (free, sponsored). Mainnet is the
// verified flagship. Both chains supported so users can connect on either.
export const wagmiConfig = createConfig({
  chains: [mantleSepolia, mantle],
  connectors: [injected()],
  transports: {
    [mantleSepolia.id]: http('https://rpc.sepolia.mantle.xyz'),
    [mantle.id]: http('https://rpc.mantle.xyz'),
  },
  ssr: true,
});
