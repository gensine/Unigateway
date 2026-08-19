import React from 'react';
import './FilterBar.css';

export default function FilterBar({ filters, onFilterChange, teams = ['all', 'Security', 'Finance', 'Core', 'Logistics'] }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="filter-bar card">
      <div className="filter-group">
        <label htmlFor="environment">Environment</label>
        <select 
          id="environment" 
          name="environment" 
          className="form-control" 
          value={filters.environment} 
          onChange={handleChange}
        >
          <option value="all">All Environments</option>
          <option value="prod">Production</option>
          <option value="staging">Staging</option>
          <option value="dev">Development</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="team">Owner Team</label>
        <select 
          id="team" 
          name="team" 
          className="form-control" 
          value={filters.team} 
          onChange={handleChange}
        >
          {teams.map(team => (
            <option key={team} value={team}>
              {team === 'all' ? 'All Teams' : team}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
