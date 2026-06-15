import { NextRequest, NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') ?? 'ETH';
  const points = searchParams.get('points') ?? '60';
  try {
    const r = await fetch(`${AGENT}/market/${token}?points=${points}`, {
      cache: 'no-store',
    });
    if (!r.ok) throw new Error('agent unavailable');
    return NextResponse.json(await r.json());
  } catch {
    return NextResponse.json({ token, series: [], context: {} });
  }
}
