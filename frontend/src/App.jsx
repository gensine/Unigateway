import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import ServiceRegistry from './pages/ServiceRegistry';
import AlertsPage from './pages/AlertsPage';
import ServiceDetail from './pages/ServiceDetail';
import './App.css';

function App() {
  return (
    <div className="app-layout">
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registry" element={<ServiceRegistry />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
