import { useEffect, useRef, useCallback } from 'react';

// Simulated data for Phase 2 frontend dev
const SIMULATE = true;
const simulatedServiceIds = ['1', '2', '3', '4'];
const simulatedStatuses = ['healthy', 'degraded', 'down'];

export function useWebSocket(url, onMessage) {
  const ws = useRef(null);
  const retryDelay = useRef(1000);
  const simInterval = useRef(null);

  const connect = useCallback(() => {
    if (SIMULATE) {
      console.log("[WS Mock] Connected to", url);
      // Simulate incoming status updates every 3 seconds
      simInterval.current = setInterval(() => {
        const type = Math.random() > 0.8 ? 'ALERT' : 'STATUS_UPDATE';
        if (type === 'STATUS_UPDATE') {
          onMessage({
            type: 'STATUS_UPDATE',
            service_id: simulatedServiceIds[Math.floor(Math.random() * simulatedServiceIds.length)],
            status: simulatedStatuses[Math.floor(Math.random() * simulatedStatuses.length)],
            latency_ms: Math.floor(Math.random() * 2000),
            timestamp: new Date().toISOString()
          });
        } else {
          onMessage({
            type: 'ALERT',
            service_id: simulatedServiceIds[Math.floor(Math.random() * simulatedServiceIds.length)],
            message: 'Threshold breached!',
            timestamp: new Date().toISOString()
          });
        }
      }, 3000);
      return;
    }

    ws.current = new WebSocket(url);

    ws.current.onmessage = (e) => onMessage(JSON.parse(e.data));

    ws.current.onclose = () => {
      setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 30000);
        connect();
      }, retryDelay.current);
    };

    ws.current.onopen = () => { retryDelay.current = 1000; };
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) ws.current.close();
      if (simInterval.current) clearInterval(simInterval.current);
    };
  }, [connect]);
}
