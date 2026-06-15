import { NextRequest, NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ?? '50';
  try {
    const r = await fetch(`${AGENT}/decisions?limit=${limit}`, { cache: 'no-store' });
    if (!r.ok) throw new Error();
    const data = await r.json();
    const trades = (data?.decisions ?? [])
      .filter((d: any) => d.decision !== 'FLAT')
      .map((d: any) => ({
        id: d.id,
        token: d.token,
        direction: d.decision,
        size: d.positionSize,
        protocol: d.protocol,
        txHash: d.txHash,
        executedAt: d.timestamp,
        actualReturn: d.actualReturn,
        wasCorrect: d.wasCorrect,
      }));
    return NextResponse.json({ trades });
  } catch {
    return NextResponse.json({ trades: [] });
  }
}
