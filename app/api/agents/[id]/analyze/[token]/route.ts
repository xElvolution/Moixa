import { NextRequest, NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; token: string } }
) {
  try {
    const r = await fetch(
      `${AGENT}/agents/${params.id}/analyze/${params.token.toUpperCase()}`,
      { method: 'POST', cache: 'no-store' }
    );
    return NextResponse.json(await r.json(), { status: r.ok ? 200 : 502 });
  } catch {
    return NextResponse.json(
      { error: 'MOIXA agent is not reachable right now.' },
      { status: 503 }
    );
  }
}
