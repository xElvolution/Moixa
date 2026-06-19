import { NextRequest, NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function POST(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = (params.token || '').toUpperCase();
  try {
    const r = await fetch(`${AGENT}/trigger/${token}`, {
      method: 'POST',
      cache: 'no-store',
    });
    if (!r.ok) throw new Error('agent unavailable');
    return NextResponse.json(await r.json());
  } catch {
    return NextResponse.json(
      { error: 'MOIXA agent is not reachable right now. Try again shortly.' },
      { status: 503 }
    );
  }
}
