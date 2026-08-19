import React from 'react';
import { useNavigate } from 'react-router-dom';
import UptimeBadge from './UptimeBadge';
import './StatusCard.css';

export default function StatusCard({ service }) {
  const navigate = useNavigate();
  const { id, name, owner_team, status, latency_ms, uptime_pct, last_checked } = service;

  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'status-green';
      case 'degraded': return 'status-yellow';
      case 'down': return 'status-red';
      default: return 'status-gray';
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Never';
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  return (
    <div className={`card status-card ${getStatusColor()}`} onClick={() => navigate(`/service/${id}`)}>
      <div className="card-header">
        <div className="title-group">
          <span className={`status-dot ${getStatusColor()}`}></span>
          <h3>{name}</h3>
        </div>
        <span className="team-label">{owner_team}</span>
      </div>
      
      <div className="card-body">
        <div className="metric">
          <span className="metric-label">Latency</span>
          <span className="metric-value">{status === 'down' ? '—' : `${latency_ms}ms`}</span>
        </div>
        <div className="metric">
          <span className="metric-label">Uptime</span>
          <UptimeBadge uptime={uptime_pct} />
        </div>
      </div>
      
      <div className="card-footer">
        <span>Last checked: {timeAgo(last_checked)}</span>
      </div>
    </div>
  );
}
