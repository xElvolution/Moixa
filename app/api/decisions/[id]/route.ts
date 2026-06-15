import { NextRequest, NextResponse } from 'next/server';

const AGENT = process.env.NEXT_PUBLIC_AGENT_HTTP_URL || 'http://localhost:3001';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const r = await fetch(`${AGENT}/decisions/${params.id}`, { cache: 'no-store' });
    if (!r.ok) throw new Error('not found');
    const data = await r.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
}
