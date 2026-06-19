import { NextRequest, NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function POST(req: NextRequest) {
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }
  try {
    const r = await fetch(`${AGENT}/agents/mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    return NextResponse.json(await r.json(), { status: r.ok ? 200 : 502 });
  } catch {
    return NextResponse.json(
      { error: 'MOIXA agent is not reachable right now.' },
      { status: 503 }
    );
  }
}
