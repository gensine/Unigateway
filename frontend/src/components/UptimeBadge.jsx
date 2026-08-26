import React from 'react';
import './UptimeBadge.css';

/*
 *
 * - This is a pure functional component. For a given input (`uptime`), it always renders the same output.
 * - We use dynamic CSS classes (`colorClass`) computed from the prop value to change the styling.
 */
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
