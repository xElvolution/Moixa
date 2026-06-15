import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AGENT_WS =
  process.env.NEXT_PUBLIC_WS_URL?.replace(/^http/, 'ws') ||
  'ws://localhost:3001/ws';

export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        // Best-effort SSE bridge: Node's `ws` package isn't part of stdlib, so we
        // simply emit a heartbeat. The frontend uses the WebSocket directly when
        // possible. This route exists as a compatibility shim for environments
        // that cannot open a WS (e.g. behind some proxies).
        send({ type: 'STREAM_HELLO', wsUrl: AGENT_WS, timestamp: Date.now() });
        let counter = 0;
        const interval = setInterval(() => {
          counter += 1;
          send({ type: 'HEARTBEAT', counter, timestamp: Date.now() });
          if (counter > 600) {
            clearInterval(interval);
            controller.close();
          }
        }, 5000);
      } catch (e) {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
