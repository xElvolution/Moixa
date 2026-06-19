import { NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function GET() {
  try {
    const r = await fetch(`${AGENT}/agents`, { cache: 'no-store' });
    if (!r.ok) throw new Error('agent unavailable');
    return NextResponse.json(await r.json());
  } catch {
    return NextResponse.json({ agents: [] });
  }
}
