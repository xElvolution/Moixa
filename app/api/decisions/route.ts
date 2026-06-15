import { NextRequest, NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get('limit') ?? '50';
  try {
    const r = await fetch(`${AGENT}/decisions?limit=${limit}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('agent unavailable');
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ decisions: [] });
  }
}
