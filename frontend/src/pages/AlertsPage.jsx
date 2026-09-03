import React, { useState, useEffect } from 'react';
import { getAlertRules, createAlertRule, getAlertEvents } from '../api/alerts';
import { getServices } from '../api/services';
import './AlertsPage.css';

export default function AlertsPage() {
  const [rules, setRules] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    service_id: '', condition: 'downtime', threshold: '', failures: 3, channel: 'slack'
  });

  const fetchData = async () => {
    try {
      const [rulesRes, eventsRes, servicesRes] = await Promise.all([
        getAlertRules(),
        getAlertEvents(),
        getServices()
      ]);
      setRules(rulesRes.data);
      setIncidents(eventsRes.data);
      setServices(servicesRes.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch alerts data", err);
      setError("Failed to load alerts. Backend may be offline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Alerts & Rules | Unigateway";
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        service_id: parseInt(formData.service_id, 10),
        threshold: formData.condition === 'downtime' ? null : parseInt(formData.threshold, 10),
        failures: parseInt(formData.failures, 10)
      };
      await createAlertRule(payload);
      setFormData({ service_id: '', condition: 'downtime', threshold: '', failures: 3, channel: 'slack' });
      fetchData();
    } catch (err) {
      console.error("Failed to create rule", err);
      alert("Failed to create rule");
    }
  };

  const getMttr = (triggered, resolved) => {
    if (!resolved) return '—';
    const t1 = new Date(triggered);
    const t2 = new Date(resolved);
    const diff = Math.floor((t2 - t1) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}m ${secs}s`;
  };

  const getServiceName = (id) => {
    const s = services.find(s => s.id === id);
    return s ? s.name : `Service ${id}`;
  };

  if (loading) return (
    <div className="page-container">
      <div className="loading-state">
        <div className="spinner"></div>
        Loading alerts...
      </div>
    </div>
  );

  return (
    <div className="page-container">
      <h1>Alerts & Rules</h1>
      <p>Configure alerting rules and view incident history.</p>

      {error && (
        <div className="error-banner mb-2">
          ⚠️ {error}
        </div>
      )}

      <div className="card alerts-form-card">
        <h2>Create Alert Rule</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Service</label>
              <select name="service_id" className="form-control" required value={formData.service_id} onChange={handleChange}>
                <option value="">Select Service...</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Condition</label>
              <select name="condition" className="form-control" value={formData.condition} onChange={handleChange}>
                <option value="downtime">Downtime</option>
                <option value="latency_threshold">Latency Threshold (ms)</option>
                <option value="error_rate">Error Rate (%)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Threshold {formData.condition === 'downtime' ? '(N/A)' : ''}</label>
              <input type="number" name="threshold" className="form-control" disabled={formData.condition === 'downtime'} required={formData.condition !== 'downtime'} value={formData.threshold} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Failures before firing</label>
              <input type="number" name="failures" className="form-control" min="1" required value={formData.failures} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Channel</label>
              <select name="channel" className="form-control" value={formData.channel} onChange={handleChange}>
                <option value="slack">Slack</option>
                <option value="email">Email</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div className="form-actions mt-1">
            <button type="submit" className="btn btn-primary">Create Rule</button>
          </div>
        </form>
      </div>

      <div className="card rules-table-card">
        <h2>Active Rules</h2>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Condition</th>
                <th>Threshold</th>
                <th>Failures</th>
                <th>Channel</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td className="fw-600">{getServiceName(r.service_id)}</td>
                  <td>{r.condition}</td>
                  <td>{r.threshold || '—'}</td>
                  <td>{r.failures}</td>
                  <td>{r.channel}</td>
                  <td><span className={`status-pill ${r.is_active ? 'healthy' : 'gray'}`}>{r.is_active ? 'active' : 'inactive'}</span></td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No alert rules found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card incidents-table-card">
        <h2>Incident History</h2>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Condition</th>
                <th>Triggered At</th>
                <th>Resolved At</th>
                <th>MTTR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(i => {
                const rule = rules.find(r => r.id === i.rule_id);
                const condition = rule ? rule.condition : 'Unknown';
                const serviceName = rule ? getServiceName(rule.service_id) : 'Unknown';
                
                return (
                  <tr key={i.id} className={i.status === 'active' ? 'incident-active' : ''}>
                    <td className="fw-600">{serviceName}</td>
                    <td>{condition}</td>
                    <td>{new Date(i.triggered_at).toLocaleString()}</td>
                    <td>{i.resolved_at ? new Date(i.resolved_at).toLocaleString() : '—'}</td>
                    <td>{getMttr(i.triggered_at, i.resolved_at)}</td>
                    <td>
                      <span className={`status-pill ${i.status === 'active' ? 'down' : 'healthy'}`}>
                        {i.status === 'active' ? '🔴 Active' : '⚪ Resolved'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>No incidents found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
