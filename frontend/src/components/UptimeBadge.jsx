import React from 'react';
import './UptimeBadge.css';

export default function UptimeBadge({ uptime }) {
  let colorClass = 'bg-danger';
  
  if (uptime >= 99) {
    colorClass = 'bg-success';
  } else if (uptime >= 95) {
    colorClass = 'bg-warning';
  }

  return (
    <span className={`uptime-badge ${colorClass}`}>
      {uptime.toFixed(1)}%
    </span>
  );
}
