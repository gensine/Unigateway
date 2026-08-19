import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceById } from '../api/services';
import LatencyChart from '../components/LatencyChart';
import UptimeBadge from '../components/UptimeBadge';
import './ServiceDetail.css';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await getServiceById(id);
        setService(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  useEffect(() => {
    // Generate mock chart data based on timeRange
    const data = [];
    const points = timeRange === '1h' ? 60 : timeRange === '6h' ? 60 : 24;
    const now = new Date();
    for(let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - i * (timeRange === '1h' ? 60000 : timeRange === '6h' ? 360000 : 3600000));
      // simulate some downtime
      const isDown = Math.random() > 0.95;
      data.push({
        time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latency_ms: isDown ? null : Math.floor(Math.random() * 300) + 50
      });
    }
    setChartData(data);
  }, [timeRange]);

  if (loading) return <div className="page-container"><div className="loading-state">Loading...</div></div>;
  if (!service) return <div className="page-container"><div className="empty-state">Service not found.</div></div>;

  return (
    <div className="page-container">
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="title-area">
          <h1>{service.name}</h1>
          <span className={`status-pill ${service.status}`}>
            {service.status === 'healthy' ? '🟢 Healthy' : service.status === 'degraded' ? '🟡 Degraded' : '🔴 Down'}
          </span>
        </div>
      </div>

      <LatencyChart 
        data={chartData} 
        slaThreshold={service.sla_threshold_ms} 
        range={timeRange} 
        onRangeChange={setTimeRange} 
      />

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-label">Status</div>
          <div className="stat-value">{service.status === 'healthy' ? '🟢' : service.status === 'degraded' ? '🟡' : '🔴'}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">Uptime</div>
          <div className="stat-value"><UptimeBadge uptime={service.uptime_pct} /></div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">p95 Latency</div>
          <div className="stat-value">{service.latency_ms ? `${service.latency_ms + 45}ms` : '—'}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">SLA %</div>
          <div className="stat-value">99.1%</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">Error Rate</div>
          <div className="stat-value">0.2%</div>
        </div>
      </div>
    </div>
  );
}
