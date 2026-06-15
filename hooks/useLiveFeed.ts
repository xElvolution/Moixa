'use client';

import { useEffect, useRef, useState } from 'react';
import type { WsEvent } from '@/types';

const DEFAULT_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

export interface LiveFeedState {
  connected: boolean;
  events: WsEvent[];
  latest: WsEvent | null;
}

export function useLiveFeed(maxEvents = 200): LiveFeedState {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<WsEvent[]>([]);
  const [latest, setLatest] = useState<WsEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      try {
        const ws = new WebSocket(DEFAULT_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          retryRef.current = 0;
          setConnected(true);
        };

        ws.onmessage = (msg) => {
          try {
            const evt = JSON.parse(msg.data) as WsEvent;
            setLatest(evt);
            setEvents((prev) => {
              const next = [...prev, evt];
              if (next.length > maxEvents) next.splice(0, next.length - maxEvents);
              return next;
            });
          } catch {
            /* ignore malformed event */
          }
        };

        ws.onclose = () => {
          setConnected(false);
          if (stopped) return;
          retryRef.current += 1;
          const delay = Math.min(8000, 600 * retryRef.current);
          setTimeout(connect, delay);
        };

        ws.onerror = () => {
          try {
            ws.close();
          } catch {
            /* ignore */
          }
        };
      } catch {
        retryRef.current += 1;
        setTimeout(connect, Math.min(8000, 600 * retryRef.current));
      }
    };

    connect();

    return () => {
      stopped = true;
      wsRef.current?.close();
    };
  }, [maxEvents]);

  return { connected, events, latest };
}
