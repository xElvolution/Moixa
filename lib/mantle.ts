import { JsonRpcProvider } from 'ethers';

// NEXT_PUBLIC_MANTLE_RPC is browser-safe (server MANTLE_RPC_URL is not exposed
// to the client). Falls back to the public Mantle RPC.
export const MANTLE_RPC =
  process.env.NEXT_PUBLIC_MANTLE_RPC ||
  process.env.MANTLE_RPC_URL ||
  'https://rpc.mantle.xyz';
export const MANTLE_CHAIN_ID = Number(process.env.NEXT_PUBLIC_MANTLE_CHAIN_ID || 5000);

let _provider: JsonRpcProvider | null = null;
export function getMantleProvider(): JsonRpcProvider {
  if (_provider) return _provider;
  _provider = new JsonRpcProvider(MANTLE_RPC, MANTLE_CHAIN_ID, {
    staticNetwork: true,
  });
  return _provider;
}

export const BRAIN_ADDRESS = process.env.NEXT_PUBLIC_MOIXA_BRAIN_ADDRESS ?? '';
export const IDENTITY_ADDRESS = process.env.NEXT_PUBLIC_MOIXA_IDENTITY_ADDRESS ?? '';
export const EXECUTOR_ADDRESS = process.env.NEXT_PUBLIC_MOIXA_EXECUTOR_ADDRESS ?? '';

export const BRAIN_ABI = [
  'function totalDecisions() view returns (uint256)',
  'function correctDecisions() view returns (uint256)',
  'function totalVolume() view returns (uint256)',
  'function getAccuracy() view returns (uint256)',
  'function getTotalStats() view returns (uint256, uint256, uint256, uint256)',
];

export const IDENTITY_ABI = [
  'function getProfile(uint256) view returns (tuple(uint256 agentId, string name, uint256 birthTimestamp, uint256 birthBlock, uint256 totalTrades, uint256 totalVolume, uint256 winRate, uint256 sharpeRatio, uint256 maxDrawdown, uint256 reputationScore, uint256 lastUpdated))',
  'function getReputationHistory(uint256) view returns (uint256[], uint256[])',
  'function tokenURI(uint256) view returns (string)',
  'function agentOf(address) view returns (uint256)',
  'function nextTokenId() view returns (uint256)',
  'function ownerOf(uint256) view returns (address)',
];
