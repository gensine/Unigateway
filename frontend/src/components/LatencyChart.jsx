import React from 'react';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts';
import './LatencyChart.css';


export default function LatencyChart({ data = [], slaThreshold, range, onRangeChange }) {
  // Calculate dynamic Y-axis upper limit to ensure SLA threshold line and peak latencies fit
  const validLatencies = data.map(d => d.latency_ms).filter(v => v !== null && v !== undefined);
  const maxDataVal = validLatencies.length > 0 ? Math.max(...validLatencies) : 0;
  const thresholdNum = Number(slaThreshold) || 0;
  const yMax = Math.max(maxDataVal, thresholdNum) > 0 
    ? Math.ceil(Math.max(maxDataVal, thresholdNum) * 1.25) 
    : 1000;

  const hasData = data.length > 0;
  const hasValidPoints = validLatencies.length > 0;

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

      <div className="chart-wrapper" style={{ position: 'relative' }}>
        {!hasValidPoints && (
          <div className="chart-overlay-message" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#94a3b8',
            fontSize: '0.9rem',
            textAlign: 'center',
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.75)',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {hasData ? '🔴 Service Down / No Successful Ping Responses' : '⏳ Waiting for Health Check Data...'}
          </div>
        )}

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 25, right: 35, left: 15, bottom: 5 }}>
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickMargin={10} />
            <YAxis 
              domain={[0, yMax]} 
              unit="ms" 
              stroke="#94a3b8" 
              fontSize={12} 
              width={55}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
              itemStyle={{ color: '#818cf8', fontWeight: 600 }}
              formatter={(val) => [val !== null ? `${val} ms` : 'Down', 'Latency']}
            />
            {thresholdNum > 0 && (
              <ReferenceLine 
                y={thresholdNum} 
                stroke="#f59e0b" 
                strokeDasharray="4 4" 
                strokeWidth={2}
                label={{ position: 'top', value: `SLA Limit: ${thresholdNum}ms`, fill: '#f59e0b', fontSize: 12, fontWeight: 600 }} 
              />
            )}
            <Line 
              type="monotone" 
              dataKey="latency_ms" 
              connectNulls={true}
              dot={{ r: 4, fill: '#6366f1', stroke: '#1e1b4b', strokeWidth: 1 }}
              activeDot={{ r: 7, fill: '#a855f7', stroke: '#fff', strokeWidth: 2 }}
              stroke="#6366f1" 
              strokeWidth={3} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

