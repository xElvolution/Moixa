import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

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

export const wagmiConfig = createConfig({
  chains: [mantle],
  transports: {
    [mantle.id]: http('https://rpc.mantle.xyz'),
  },
  ssr: true,
});
