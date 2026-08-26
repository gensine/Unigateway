import React, { useState, useEffect } from 'react';
import { getServices, createService, updateService, deleteService } from '../api/services';
import FilterBar from '../components/FilterBar';
import './ServiceRegistry.css';

/*
 *
 * - This component demonstrates complex form handling in React.
 * - `formData` is an object holding all form fields, allowing us to update them with a single `handleChange` function.
 */
export default function ServiceRegistry() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ environment: 'all', team: 'all' });
  const [formData, setFormData] = useState({
    name: '', base_url: '', health_path: '/health', interval_seconds: 30, sla_threshold_ms: 1000, owner_team: '', environment: 'prod'
  });
  const [editingId, setEditingId] = useState(null);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await getServices(filters);
      setServices(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [filters]);

  /*
   *
   * - We use dynamic object keys `[name]: value` to update the specific field that was typed in.
   * - `prev => ({ ...prev, ... })` ensures we don't accidentally overwrite state when updates happen rapidly.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await updateService(editingId, formData);
    } else {
      await createService(formData);
    }
    setFormData({ name: '', base_url: '', health_path: '/health', interval_seconds: 30, sla_threshold_ms: 1000, owner_team: '', environment: 'prod' });
    setEditingId(null);
    fetchServices();
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setFormData({
      name: service.name, base_url: service.base_url, health_path: service.health_path, 
      interval_seconds: service.interval_seconds, sla_threshold_ms: service.sla_threshold_ms, 
      owner_team: service.owner_team, environment: service.environment
    });
  };

  const handleDelete = async (id) => {
    if(confirm("Are you sure you want to deactivate this service?")) {
      await deleteService(id);
      fetchServices();
    }
  };

  return (
    <div className="page-container">
      <h1>Service Registry</h1>
      <p>Register and manage your microservices.</p>

      <div className="card registry-form-card">
        <h2>{editingId ? 'Edit Service' : 'Register New Service'}</h2>
        <form onSubmit={handleSubmit} className="registry-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Service Name</label>
              <input type="text" name="name" className="form-control" required value={formData.name} onChange={handleChange} placeholder="e.g. auth-service" />
            </div>
            <div className="form-group">
              <label>Base URL</label>
              <input type="url" name="base_url" className="form-control" required value={formData.base_url} onChange={handleChange} placeholder="https://api.internal" />
            </div>
            <div className="form-group">
              <label>Health Path</label>
              <input type="text" name="health_path" className="form-control" required value={formData.health_path} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Owner Team</label>
              <input type="text" name="owner_team" className="form-control" required value={formData.owner_team} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Environment</label>
              <select name="environment" className="form-control" value={formData.environment} onChange={handleChange}>
                <option value="prod">Production</option>
                <option value="staging">Staging</option>
                <option value="dev">Development</option>
              </select>
            </div>
            <div className="form-group">
              <label>Polling Interval (s)</label>
              <input type="number" name="interval_seconds" className="form-control" min="10" required value={formData.interval_seconds} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>SLA Threshold (ms)</label>
              <input type="number" name="sla_threshold_ms" className="form-control" required value={formData.sla_threshold_ms} onChange={handleChange} />
            </div>
          </div>
          <div className="form-actions">
            {editingId && <button type="button" className="btn btn-danger" onClick={() => {setEditingId(null); setFormData({name: '', base_url: '', health_path: '/health', interval_seconds: 30, sla_threshold_ms: 1000, owner_team: '', environment: 'prod'})}}>Cancel</button>}
            <button type="submit" className="btn btn-primary">{editingId ? 'Update Service' : 'Register Service'}</button>
          </div>
        </form>
      </div>

      <FilterBar filters={filters} onFilterChange={setFilters} />

      <div className="data-table-container">
        {loading ? (
          <div className="loading-state">Loading services...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Team</th>
                <th>Env</th>
                <th>Base URL</th>
                <th>SLA (ms)</th>
                <th>Interval (s)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr><td colSpan="7" className="empty-state">No services found.</td></tr>
              ) : (
                services.map(s => (
                  <tr key={s.id}>
                    <td className="fw-600">{s.name}</td>
                    <td>{s.owner_team}</td>
                    <td><span className={`env-badge ${s.environment}`}>{s.environment}</span></td>
                    <td className="text-muted">{s.base_url}</td>
                    <td>{s.sla_threshold_ms}</td>
                    <td>{s.interval_seconds}</td>
                    <td className="actions-cell">
                      <button className="btn-icon" onClick={() => handleEdit(s)}>✏️</button>
                      <button className="btn-icon text-danger" onClick={() => handleDelete(s.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
