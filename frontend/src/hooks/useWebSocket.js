import { useEffect, useRef, useCallback } from 'react';

// Simulated data for Phase 2 frontend dev
const SIMULATE = false;
const simulatedServiceIds = ['1', '2', '3', '4'];
const simulatedStatuses = ['healthy', 'degraded', 'down'];

/*
 * Browser opens a WebSocket connection to the backend
 * │
 * ├── stays open the whole time you have the dashboard open
 * │
 * └── whenever a service changes status, the backend PUSHES a message
 *     → browser receives it instantly
 *     → card updates on screen — no refresh needed
 * 
 *
 * - This is a "Custom Hook" in React. It encapsulates reusable logic.
 * - We use WebSockets for real-time data instead of HTTP polling because it's much lighter 
 *   on the server and provides instant updates (lower latency).
 */
export function useWebSocket(url, onMessage) {
  // useRef is used here to store the WebSocket instance and the reconnect delay.
  // Why not useState? Because changing these values shouldn't trigger a component re-render.
  // We just need a way to remember the connection across renders.
  const ws = useRef(null);
  const retryDelay = useRef(1000);
  const simInterval = useRef(null);

  // useCallback memoizes this function so it doesn't get recreated on every render.
  // This is important because we pass it to the useEffect dependency array below.
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

    // Creating the actual WebSocket connection.
    ws.current = new WebSocket(url);

    // When the server pushes a message, this event fires. We parse the JSON and pass it to our callback.
    ws.current.onmessage = (e) => onMessage(JSON.parse(e.data));

    // "Exponential Backoff" reconnection strategy.
    // If the server goes down, the socket closes. We try to reconnect, but we double the wait time 
    // on each failure (1s -> 2s -> 4s -> up to 30s) so we don't overwhelm the server when it's struggling.
    ws.current.onclose = () => {
      setTimeout(() => {
        retryDelay.current = Math.min(retryDelay.current * 2, 30000);
        connect();
      }, retryDelay.current);
    };

    // If we successfully connect, reset the retry delay back to 1 second.
    ws.current.onopen = () => { retryDelay.current = 1000; };
  }, [url, onMessage]);

  // useEffect runs after the component using this hook mounts.
  useEffect(() => {
    connect();
    
    // The "Cleanup Function".
    // When the component unmounts (e.g., user leaves the dashboard), this function runs.
    // It closes the WebSocket connection. Failing to do this causes "Memory Leaks" and zombie connections.
    return () => {
      if (ws.current) ws.current.close();
      if (simInterval.current) clearInterval(simInterval.current);
    };
  }, [connect]);
}
