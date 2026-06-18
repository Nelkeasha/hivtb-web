'use client';
import { useEffect, useRef, useState } from 'react';

export interface LiveAlert {
  id: string;
  patientName: string | null;
  alertType: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  message: string;
  createdAt: string;
}

export function useAlertSocket() {
  const [liveAlerts, setLiveAlerts] = useState<LiveAlert[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    async function connect() {
      try {
        const SockJSModule = await import('sockjs-client');
        const SockJS = SockJSModule.default ?? SockJSModule;
        const { Client } = await import('@stomp/stompjs');

        const wsBase =
          process.env.NEXT_PUBLIC_WS_URL ??
          process.env.NEXT_PUBLIC_API_URL ??
          'https://hivtb-rw-api.onrender.com';

        const client = new Client({
          webSocketFactory: () => new (SockJS as new (url: string) => WebSocket)(`${wsBase}/ws`),
          reconnectDelay: 5000,
          onConnect: () => {
            client.subscribe('/topic/alerts', (frame) => {
              if (!active) return;
              try {
                const alert: LiveAlert = JSON.parse(frame.body);
                setLiveAlerts((prev) => [alert, ...prev].slice(0, 20));
                setUnseenCount((n) => n + 1);
              } catch {
                // malformed frame — ignore
              }
            });
          },
          onStompError: () => { /* reconnect handled by reconnectDelay */ },
        });

        client.activate();
        clientRef.current = client;
      } catch {
        // WebSocket unavailable (SSR guard or network) — silent fail
      }
    }

    connect();

    return () => {
      active = false;
      clientRef.current?.deactivate();
    };
  }, []);

  const clearCount = () => setUnseenCount(0);

  return { liveAlerts, unseenCount, clearCount };
}
