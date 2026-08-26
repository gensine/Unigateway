import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Dashboard from './pages/Dashboard';
import ServiceRegistry from './pages/ServiceRegistry';
import AlertsPage from './pages/AlertsPage';
import ServiceDetail from './pages/ServiceDetail';
import './App.css';

/*
 *
 * - This component represents the "Shell" or "Layout" of the application.
 * - It renders the global `<NavBar />` which stays on screen at all times.
 * - The `<Routes>` component acts like a switch statement. It looks at the current URL 
 *   and renders ONLY the `<Route>` that matches.
 * - Notice the path "/service/:id" — the ":id" is a URL parameter. The ServiceDetail 
 *   component will be able to extract this ID using the `useParams()` hook.
 */
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
