import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getServiceById } from '../api/services';
import { getServiceMetrics, getServiceSummary } from '../api/metrics';
import { useWebSocket } from '../hooks/useWebSocket';
import LatencyChart from '../components/LatencyChart';
import UptimeBadge from '../components/UptimeBadge';
import './ServiceDetail.css';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ uptime_pct: 100.0, p95: 0, sla_compliance_pct: 100.0, error_rate_pct: 0.0 });

  useEffect(() => {
    document.title = "Service Details | Unigateway";
    const fetchService = async () => {
      setLoading(true);
      setError(null);
      try {
        const [serviceRes, summaryRes] = await Promise.all([
          getServiceById(id),
          getServiceSummary(id)
        ]);
        setService(serviceRes.data);
        setSummary(summaryRes.data);
        document.title = `${serviceRes.data.name} | Unigateway`;
      } catch (e) {
        console.error(e);
        setError("Failed to load service details. Backend may be offline.");
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  useWebSocket('ws://localhost:8000/ws/live', (msg) => {
    if (msg.type === 'STATUS_UPDATE' && msg.service_id === parseInt(id, 10)) {
      setService(prev => prev ? { ...prev, status: msg.status, latency_ms: msg.latency_ms } : prev);
      getServiceSummary(id).then(res => setSummary(res.data)).catch(() => {});
    }
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await getServiceMetrics(id, { range: timeRange });
        const data = res.data.map(d => ({
          time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latency_ms: d.latency_ms
        }));
        setChartData(data);
        
        if (res.data.length > 0) {
           const latest = res.data[res.data.length - 1];
           setService(prev => prev ? { ...prev, status: latest.status, latency_ms: latest.latency_ms } : prev);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetrics();
  }, [id, timeRange]);

  if (loading) return (
    <div className="page-container">
      <div className="loading-state">
        <div className="spinner"></div>
        Loading details...
      </div>
    </div>
  );
  
  if (error) return (
    <div className="page-container">
      <div className="error-banner">⚠️ {error}</div>
    </div>
  );
  
  if (!service) return (
    <div className="page-container">
      <div className="empty-state">
        <h3>Service not found</h3>
        <p>This service may have been deleted.</p>
      </div>
    </div>
  );

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
          <div className="stat-value"><UptimeBadge uptime={summary.uptime_pct ?? service.uptime_pct} /></div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">p95 Latency</div>
          <div className="stat-value">{summary.p95 ? `${summary.p95}ms` : '—'}</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">SLA %</div>
          <div className="stat-value">{summary.sla_compliance_pct}%</div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">Error Rate</div>
          <div className="stat-value">{summary.error_rate_pct}%</div>
        </div>
      </div>
    </div>
  );
}

