import pkg from 'hardhat';
const { ethers } = pkg;
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  const agentAddress = process.env.AGENT_ADDRESS || deployer.address;

  console.log('═══════════════════════════════════════════');
  console.log('  MOIXA — Deploying to Mantle');
  console.log('═══════════════════════════════════════════');
  console.log('Deployer:', deployer.address);
  console.log('Agent:   ', agentAddress);
  console.log('Balance: ', ethers.formatEther(await ethers.provider.getBalance(deployer.address)), 'MNT');
  console.log('───────────────────────────────────────────');

  console.log('Deploying MoixaBrain...');
  const Brain = await ethers.getContractFactory('MoixaBrain');
  const brain = await Brain.deploy(agentAddress);
  await brain.waitForDeployment();
  const brainAddr = await brain.getAddress();
  console.log('  → MoixaBrain @', brainAddr);

  console.log('Deploying MoixaIdentity...');
  const Identity = await ethers.getContractFactory('MoixaIdentity');
  const identity = await Identity.deploy(agentAddress);
  await identity.waitForDeployment();
  const identityAddr = await identity.getAddress();
  console.log('  → MoixaIdentity @', identityAddr);

  console.log('Deploying MoixaExecutor...');
  const Executor = await ethers.getContractFactory('MoixaExecutor');
  const executor = await Executor.deploy(agentAddress);
  await executor.waitForDeployment();
  const executorAddr = await executor.getAddress();
  console.log('  → MoixaExecutor @', executorAddr);

  console.log('Minting MOIXA Agent #1 identity NFT...');
  const tx = await identity.mintAgentIdentity('MOIXA');
  const receipt = await tx.wait();
  console.log('  → mint tx:', receipt?.hash);

  const envPath = join(process.cwd(), '.env.local');
  let env = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const update = (key: string, val: string) => {
    if (env.match(new RegExp(`^${key}=.*$`, 'm'))) {
      env = env.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${val}`);
    } else {
      env += `\n${key}=${val}`;
    }
  };
  update('NEXT_PUBLIC_MOIXA_BRAIN_ADDRESS', brainAddr);
  update('NEXT_PUBLIC_MOIXA_IDENTITY_ADDRESS', identityAddr);
  update('NEXT_PUBLIC_MOIXA_EXECUTOR_ADDRESS', executorAddr);
  writeFileSync(envPath, env.trim() + '\n');

  console.log('───────────────────────────────────────────');
  console.log('  Deployment Summary');
  console.log('───────────────────────────────────────────');
  console.log('  MoixaBrain   ', brainAddr);
  console.log('  MoixaIdentity', identityAddr);
  console.log('  MoixaExecutor', executorAddr);
  console.log('  Agent ID #1 minted to', deployer.address);
  console.log('═══════════════════════════════════════════');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
