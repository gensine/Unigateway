import React, { useState, useEffect, useCallback } from 'react';
import { getServices } from '../api/services';
import { useWebSocket } from '../hooks/useWebSocket';
import StatusCard from '../components/StatusCard';
import FilterBar from '../components/FilterBar';
import './Dashboard.css';

/*
 *
 * - This is a "Container" or "Smart" component. It holds state and fetches data.
 * - It passes the data down to "Presentational" components like `<StatusCard />` via props.
 */
export default function Dashboard() {
  const [services, setServices] = useState([]);
  const [filters, setFilters] = useState({ environment: 'all', team: 'all' });
  const [loading, setLoading] = useState(true);

  /*
   *
   * - This runs after the initial render, and whenever `filters` changes.
   * - We use an async function inside because the effect callback itself cannot be async.
   */
  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const res = await getServices(filters);
        setServices(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [filters]);

  // WebSocket message handler
  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'STATUS_UPDATE') {
      setServices(prevServices => 
        prevServices.map(svc => {
          if (svc.id === msg.service_id) {
            return {
              ...svc,
              status: msg.status,
              latency_ms: msg.latency_ms,
              last_checked: msg.timestamp,
              // mock uptime calculation for demo
              uptime_pct: msg.status === 'down' ? Math.max(0, svc.uptime_pct - 0.1) : Math.min(100, svc.uptime_pct + 0.05)
            };
          }
          return svc;
        })
      );
    } else if (msg.type === 'ALERT') {
      // In a real app, we'd trigger a toast or dispatch to a global state for the NavBar bell.
      // For this phase, we'll emit a custom event that NavBar could listen to.
      window.dispatchEvent(new CustomEvent('new-alert', { detail: msg }));
    }
  }, []);

  // Connect WebSocket
  /*
   * Browser opens a WebSocket connection to the backend
   * │
   * ├── stays open the whole time you have the dashboard open
   * │
   * └── whenever a service changes status, the backend PUSHES a message
   *     → browser receives it instantly
   *     → card updates on screen — no refresh needed
   */
  useWebSocket('ws://localhost:8000/ws/live', handleWsMessage);

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>System Dashboard</h1>
          <p>Real-time view of your microservices</p>
        </div>
      </div>

      <FilterBar filters={filters} onFilterChange={setFilters} />

      {loading ? (
        <div className="loading-state">Loading dashboard...</div>
      ) : services.length === 0 ? (
        <div className="empty-state">No services match your filters.</div>
      ) : (
        <div className="dashboard-grid">
          {services.map(svc => (
            <StatusCard key={svc.id} service={svc} />
          ))}
        </div>
      )}
    </div>
  );
}
