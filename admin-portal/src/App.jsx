import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Backtracing from './pages/Backtracing';
import Alerts from './pages/Alerts';
import Parking from './pages/Parking';
import FirePortal from './pages/FirePortal';
import Queuing from './pages/Queuing';
import Blacklist from './pages/Blacklist';
import Login from './pages/Login';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected shell */}
      <Route element={<ProtectedRoute />}>
        {/* App layout IN THIS FILE */}
        <Route
          path="/"
          element={
            <div className="app-shell">
              <Sidebar />
              <main className="p-6">
                <div className="header">
                  <h1 className="text-lg font-semibold">Control Center</h1>
                  <div className="flex items-center gap-2 text-xs text-subtext">
                    <span className="status-dot" /> Live
                  </div>
                </div>
                {/* child routes render here */}
                <Outlet />
              </main>
            </div>
          }
        >
          {/* Child routes (no extra <Routes>!) */}
          <Route index element={<Dashboard />} />
          <Route path="backtracing" element={<Backtracing />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="parking" element={<Parking />} />
          <Route path="fireportal" element={<FirePortal />} />
          <Route path="queuing" element={<Queuing />} />
          <Route path="blacklist" element={<Blacklist />} />
        </Route>
      </Route>

      {/* Fallback (optional) */}
      <Route path="*" element={<div className="p-6">Not found</div>} />
    </Routes>
  );
}
