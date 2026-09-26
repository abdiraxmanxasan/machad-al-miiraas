import { useState, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  ClipboardCheck, BarChart3, Settings, Bell,
  LogOut, ChevronDown, Search, Menu, X
} from 'lucide-react';

import Dashboard    from './pages/Dashboard.jsx';
import Students     from './pages/Students.jsx';
import Teachers     from './pages/Teachers.jsx';
import Classes      from './pages/Classes.jsx';
import Attendance   from './pages/Attendance.jsx';
import Reports      from './pages/Reports.jsx';
import SettingsPage from './pages/Settings.jsx';
import Toast        from './components/Toast.jsx';

import { getNotifications, saveNotifications } from './db.js';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students',   icon: Users,           label: 'Students'  },
  { to: '/teachers',   icon: GraduationCap,   label: 'Teachers'  },
  { to: '/classes',    icon: BookOpen,        label: 'Classes'   },
  { to: '/attendance', icon: ClipboardCheck,  label: 'Attendance' },
  { to: '/reports',    icon: BarChart3,       label: 'Reports'   },
];

const PAGE_TITLES = {
  '/':           { title: 'Dashboard',   sub: 'Overview & quick actions' },
  '/students':   { title: 'Students',    sub: 'Manage student records' },
  '/teachers':   { title: 'Teachers',    sub: 'Manage teacher profiles' },
  '/classes':    { title: 'Classes',     sub: 'Manage class assignments' },
  '/attendance': { title: 'Attendance',  sub: 'Record & track attendance' },
  '/reports':    { title: 'Reports',     sub: 'Generate & export reports' },
  '/settings':   { title: 'Settings',    sub: 'System configuration' },
};

export default function App() {
  const [toasts, setToasts] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState(getNotifications());
  const navigate = useNavigate();

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    setNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const currentPath = window.location.pathname;
  const pageInfo = PAGE_TITLES[currentPath] || PAGE_TITLES['/'];

  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🏫</div>
          <h1>Machad Al-Miiraas</h1>
          <p>School Management System</p>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} className="nav-icon" />
              {label}
            </NavLink>
          ))}

          <div className="sidebar-section-label" style={{ marginTop: 12 }}>System</div>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Settings size={17} className="nav-icon" />
            Settings
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="nav-item" style={{ cursor: 'pointer' }}>
            <div className="avatar" style={{ background: '#2563eb', width: 28, height: 28, fontSize: 11 }}>AD</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Admin</div>
              <div style={{ color: 'var(--gray-500)', fontSize: 10 }}>Super Administrator</div>
            </div>
            <LogOut size={14} style={{ color: 'var(--gray-500)' }} />
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-title">
            <h2>{pageInfo.title}</h2>
            <p>{pageInfo.sub}</p>
          </div>
          <div className="topbar-actions">
            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                className="notification-btn"
                onClick={() => setShowNotifs(v => !v)}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notification-dot" />}
              </button>

              {showNotifs && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  width: 320, background: '#fff', borderRadius: 12,
                  boxShadow: 'var(--shadow-lg)', border: '1px solid var(--gray-100)',
                  zIndex: 200, overflow: 'hidden'
                }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications {unreadCount > 0 && <span className="badge badge-danger" style={{ fontSize: 10 }}>{unreadCount}</span>}</span>
                    <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--gray-400)' }}>No notifications</div>
                    ) : notifications.map(n => (
                      <div key={n.id} style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--gray-50)',
                        background: n.read ? '#fff' : '#f0f9ff',
                        cursor: 'pointer'
                      }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-800)' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 2 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>
                          {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div className="avatar" style={{ background: '#2563eb' }}>AD</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-700)' }}>Admin</span>
              <ChevronDown size={14} style={{ color: 'var(--gray-400)' }} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Routes>
            <Route path="/"           element={<Dashboard  addToast={addToast} />} />
            <Route path="/students"   element={<Students   addToast={addToast} />} />
            <Route path="/teachers"   element={<Teachers   addToast={addToast} />} />
            <Route path="/classes"    element={<Classes    addToast={addToast} />} />
            <Route path="/attendance" element={<Attendance addToast={addToast} />} />
            <Route path="/reports"    element={<Reports    addToast={addToast} />} />
            <Route path="/settings"   element={<SettingsPage addToast={addToast} />} />
          </Routes>
        </main>
      </div>

      {/* Toast notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}
