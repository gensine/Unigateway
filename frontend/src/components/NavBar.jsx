import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getAlertEvents } from '../api/alerts';
import './NavBar.css';

export default function NavBar() {
  const [alertCount, setAlertCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchActiveAlerts = async () => {
    try {
      const res = await getAlertEvents({ is_resolved: false });
      setAlerts(res.data);
      setAlertCount(res.data.length);
    } catch (err) {
      console.error("Failed to fetch active alerts for navbar", err);
    }
  };

  useEffect(() => {
    fetchActiveAlerts();
    const handleAlert = () => {
      fetchActiveAlerts();
    };
    window.addEventListener('new-alert', handleAlert);
    
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('new-alert', handleAlert);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchActiveAlerts();
    }
  };

  const handleAlertItemClick = () => {
    setShowDropdown(false);
    navigate('/alerts');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="logo-icon"></div>
        <span>Unigateway</span>
      </div>
      <div className="navbar-links">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/registry" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Registry
        </NavLink>
        <NavLink to="/alerts" className={({ isActive }) => (isActive ? 'active-link' : '')}>
          Alerts
        </NavLink>
      </div>
      <div className="navbar-actions" ref={dropdownRef}>
        <div className="notification-bell" onClick={handleBellClick}>
          <span className="bell-icon">🔔</span>
          {alertCount > 0 && <span className="badge">{alertCount}</span>}
        </div>

        {showDropdown && (
          <div className="notification-dropdown">
            <div className="dropdown-header">
              <span>Recent Alerts ({alerts.length})</span>
            </div>
            <div className="dropdown-body">
              {alerts.length === 0 ? (
                <div className="dropdown-empty">No active unresolved alerts</div>
              ) : (
                alerts.slice(0, 5).map(item => (
                  <div key={item.id} className="dropdown-item" onClick={handleAlertItemClick}>
                    <span className="dropdown-item-dot">🔴</span>
                    <div className="dropdown-item-content">
                      <div className="dropdown-item-text">{item.details}</div>
                      <div className="dropdown-item-time">{new Date(item.triggered_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="dropdown-footer" onClick={handleAlertItemClick}>
              View All Alerts & Rules →
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

