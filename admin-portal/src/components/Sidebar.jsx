import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard'},
  { to: '/backtracing', label: 'Backtracing' },
  { to: '/alerts', label: 'Alerts'},
  { to: '/parking', label: 'Parking' },
  { to: '/fireportal', label: 'Fire Portal'},
  { to: '/queuing', label: 'Queuing'},
  { to: '/blacklist', label: 'Add Blacklist' },
];

export default function Sidebar() {
  const { email, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('sidebar:collapsed') || 'false');
    } catch {
      return false;
    }
  });

  // Persist + set a CSS var for the grid column width
  useEffect(() => {
    localStorage.setItem('sidebar:collapsed', JSON.stringify(collapsed));
    document.documentElement.style.setProperty('--sidebar-w', collapsed ? '80px' : '280px');
  }, [collapsed]);

  const initials = useMemo(() => {
    if (!email) return 'AD';
    const [name] = String(email).split('@');
    return name.slice(0, 2).toUpperCase();
  }, [email]);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Main navigation">
      {/* Brand / Header */}
      <div className="sb-head">
        <div className="brand">
          <span className="brand-badge" />
          {!collapsed && (
            <div>
              <div className="brand-title">Admin Portal</div>
              <div className="brand-sub">Secure Control Center</div>
            </div>
          )}
        </div>

        <button
          className="button ghost sb-toggle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
          onClick={() => setCollapsed(v => !v)}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Navigation */}
      <nav className="nav" role="navigation">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="icon" aria-hidden>{item.icon}</span>
            {!collapsed && <span className="label">{item.label}</span>}
            {item.badge && !collapsed && <span className="pill">{item.badge}</span>}
            {/* tooltip when collapsed */}
            {collapsed && <span className="tooltip">{item.label}</span>}
            <span className="active-indicator" aria-hidden />
          </NavLink>
        ))}
      </nav>

      {/* Footer: user + logout */}
      <div className="sb-foot">
        <div className="user">
          <div className="avatar" aria-hidden>{initials}</div>
          {!collapsed && (
            <div className="user-meta">
              <div className="user-email">{email || 'admin@company.com'}</div>
              <div className="help">Administrator</div>
            </div>
          )}
        </div>
        <button className="button ghost w-full" onClick={logout} title="Logout">
          {collapsed ? '⎋' : 'Logout'}
        </button>
      </div>
    </aside>
  );
}
