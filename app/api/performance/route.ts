import { NextRequest, NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const timeframe = searchParams.get('timeframe') ?? '30d';
  try {
    const r = await fetch(`${AGENT}/performance?timeframe=${timeframe}`, { cache: 'no-store' });
    if (!r.ok) throw new Error();
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ timeframe, equityCurve: [], stats: null });
  }
}
