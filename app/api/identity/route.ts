import { NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const r = await fetch(`${AGENT}/identity`, { cache: 'no-store' });
    if (!r.ok) throw new Error();
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    // Agent unreachable — return genesis state matching the on-chain mint.
    return NextResponse.json({
      agentId: 1,
      name: 'MOIXA',
      birthBlock: 0,
      totalTrades: 0,
      correctTrades: 0,
      totalVolume: 0,
      winRate: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      reputationScore: 500,
    });
  }
}
