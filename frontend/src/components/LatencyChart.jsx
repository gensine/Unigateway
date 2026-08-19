import React from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts';
import './LatencyChart.css';

export default function LatencyChart({ data, slaThreshold, range, onRangeChange }) {
  return (
    <div className="latency-chart-container card">
      <div className="chart-header">
        <h3>Latency Trend</h3>
        <div className="range-selector">
          {['1h','6h','24h'].map(r => (
            <button 
              key={r} 
              onClick={() => onRangeChange(r)}
              className={`range-btn ${range === r ? 'active' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
            <YAxis unit="ms" stroke="#94a3b8" fontSize={12} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
              itemStyle={{ color: '#6366f1' }}
            />
            {slaThreshold && (
              <ReferenceLine y={slaThreshold} stroke="#f59e0b" strokeDasharray="4 4" label={{ position: 'top', value: `SLA: ${slaThreshold}ms`, fill: '#f59e0b', fontSize: 12 }} />
            )}
            <Line 
              type="monotone" 
              dataKey="latency_ms" 
              dot={false}
              stroke="#6366f1" 
              strokeWidth={3} 
              activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
