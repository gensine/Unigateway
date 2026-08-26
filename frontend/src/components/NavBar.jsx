import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './NavBar.css';

/*
 *
 * - NavLink is a special version of the <Link> component that knows whether or not it is "active".
 *   This is how we apply the 'active-link' CSS class to highlight the current page.
 */
export default function NavBar() {
  const [alertCount, setAlertCount] = useState(0);

  /*
   *
   * - We use useEffect to subscribe to custom window events ('new-alert').
   * - It's CRUCIAL to return a cleanup function to remove the event listener when 
   *   the component unmounts, otherwise we get memory leaks.
   */
  useEffect(() => {
    const handleAlert = () => setAlertCount(prev => prev + 1);
    window.addEventListener('new-alert', handleAlert);
    return () => window.removeEventListener('new-alert', handleAlert);
  }, []);

  const handleBellClick = () => {
    setAlertCount(0); // reset on click
    // in real app, might open a dropdown here
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
      <div className="navbar-actions">
        <div className="notification-bell" onClick={handleBellClick}>
          <span className="bell-icon">🔔</span>
          {alertCount > 0 && <span className="badge">{alertCount}</span>}
        </div>
      </div>
    </nav>
  );
}
