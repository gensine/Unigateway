import React, { useState } from 'react';
import './AlertsPage.css';

/*
 *
 * - This component currently uses hardcoded mock data for `rules` and `incidents`.
 * - It demonstrates how to render lists of data using `.map()`, which is heavily used in React.
 * - Note that every item mapped MUST have a unique `key` prop (like `key={r.id}`) so React 
 *   can efficiently update the DOM when items are added, removed, or reordered.
 */
export default function AlertsPage() {
  const [rules, setRules] = useState([
    { id: 1, service: 'auth-service', condition: 'downtime', threshold: null, failures: 3, channel: 'slack', status: 'active' },
    { id: 2, service: 'payments-api', condition: 'latency_threshold', threshold: 500, failures: 2, channel: 'both', status: 'active' }
  ]);
  
  const [incidents, setIncidents] = useState([
    { id: 101, service: 'payments-api', condition: 'downtime', triggered: '2026-08-19T10:30:00Z', resolved: null, status: 'active' },
    { id: 102, service: 'inventory-sync', condition: 'latency_threshold', triggered: '2026-08-18T14:15:00Z', resolved: '2026-08-18T14:20:00Z', status: 'resolved' }
  ]);

  const [formData, setFormData] = useState({
    service: '', condition: 'downtime', threshold: '', failures: 3, channel: 'slack'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setRules([...rules, { ...formData, id: Date.now(), status: 'active' }]);
    setFormData({ service: '', condition: 'downtime', threshold: '', failures: 3, channel: 'slack' });
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

  return (
    <div className="page-container">
      <h1>Alerts & Rules</h1>
      <p>Configure alerting rules and view incident history.</p>

      <div className="card alerts-form-card">
        <h2>Create Alert Rule</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Service</label>
              <select name="service" className="form-control" required value={formData.service} onChange={handleChange}>
                <option value="">Select Service...</option>
                <option value="auth-service">auth-service</option>
                <option value="payments-api">payments-api</option>
                <option value="orders-worker">orders-worker</option>
                <option value="inventory-sync">inventory-sync</option>
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
                  <td className="fw-600">{r.service}</td>
                  <td>{r.condition}</td>
                  <td>{r.threshold || '—'}</td>
                  <td>{r.failures}</td>
                  <td>{r.channel}</td>
                  <td><span className={`status-pill ${r.status === 'active' ? 'healthy' : 'gray'}`}>{r.status}</span></td>
                </tr>
              ))}
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
              {incidents.map(i => (
                <tr key={i.id} className={i.status === 'active' ? 'incident-active' : ''}>
                  <td className="fw-600">{i.service}</td>
                  <td>{i.condition}</td>
                  <td>{new Date(i.triggered).toLocaleString()}</td>
                  <td>{i.resolved ? new Date(i.resolved).toLocaleString() : '—'}</td>
                  <td>{getMttr(i.triggered, i.resolved)}</td>
                  <td>
                    <span className={`status-pill ${i.status === 'active' ? 'down' : 'healthy'}`}>
                      {i.status === 'active' ? '🔴 Active' : '⚪ Resolved'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
