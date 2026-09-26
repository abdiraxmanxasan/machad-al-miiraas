import { useState, useEffect } from 'react';
import { Settings, School, Bell, Database, Palette, Shield, Save, RotateCcw, Trash2 } from 'lucide-react';

const DEFAULTS = {
  schoolName: 'Machad Al-Miiraas',
  schoolCode: 'MAM-2026',
  address: 'Mogadishu, Somalia',
  phone: '+252-61-0000000',
  email: 'admin@machad-almiiraas.so',
  academicYear: '2026-2027',
  timezone: 'Africa/Mogadishu',
  language: 'en',
  lateThreshold: '08:00',
  attendanceNotifications: true,
  lowAttendanceAlert: 75,
  theme: 'light',
};

export default function SettingsPage({ addToast }) {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('sms_settings') || '{}') }; }
    catch { return DEFAULTS; }
  });
  const [tab, setTab] = useState('school');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  function save() {
    localStorage.setItem('sms_settings', JSON.stringify(settings));
    addToast('Settings saved', 'success');
  }

  function resetData() {
    // Clear all data keys
    ['sms_students','sms_teachers','sms_classes','sms_subjects','sms_attendance','sms_notifications','sms_settings'].forEach(k => localStorage.removeItem(k));
    addToast('All data reset. Refresh the page to reload seed data.', 'info');
    setShowResetConfirm(false);
    setTimeout(() => window.location.reload(), 1500);
  }

  const TABS = [
    { key: 'school',   icon: <School size={14} />,   label: 'School Info' },
    { key: 'attendance', icon: <Settings size={14} />, label: 'Attendance' },
    { key: 'notifications', icon: <Bell size={14} />, label: 'Notifications' },
    { key: 'data',     icon: <Database size={14} />,  label: 'Data & Reset' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Configure your school management system</p>
        </div>
        <button className="btn btn-primary" onClick={save}>
          <Save size={14} /> Save Settings
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Sidebar */}
        <div className="card" style={{ padding: '8px 0', height: 'fit-content' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={`nav-item${tab === t.key ? ' active' : ''}`}
              style={{ margin: '1px 8px', color: tab === t.key ? '#fff' : 'var(--gray-600)', background: tab === t.key ? 'var(--primary)' : 'transparent', width: 'calc(100% - 16px)' }}
              onClick={() => setTab(t.key)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          {tab === 'school' && (
            <>
              <div className="card-header"><School size={16} color="#2563eb" /><span className="card-title">School Information</span></div>
              <div className="card-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">School Name</label>
                    <input className="form-control" value={settings.schoolName} onChange={e => setSettings({...settings, schoolName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">School Code</label>
                    <input className="form-control" value={settings.schoolCode} onChange={e => setSettings({...settings, schoolCode: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-control" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input className="form-control" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Academic Year</label>
                    <input className="form-control" value={settings.academicYear} onChange={e => setSettings({...settings, academicYear: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <select className="form-control" value={settings.timezone} onChange={e => setSettings({...settings, timezone: e.target.value})}>
                      <option value="Africa/Mogadishu">Africa/Mogadishu (EAT +3)</option>
                      <option value="Africa/Nairobi">Africa/Nairobi (EAT +3)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'attendance' && (
            <>
              <div className="card-header"><Settings size={16} color="#7c3aed" /><span className="card-title">Attendance Settings</span></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Late Arrival Threshold</label>
                  <input type="time" className="form-control" style={{ width: 140 }} value={settings.lateThreshold} onChange={e => setSettings({...settings, lateThreshold: e.target.value})} />
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 5 }}>Students arriving after this time are automatically marked Late</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Low Attendance Alert Threshold (%)</label>
                  <input type="number" className="form-control" style={{ width: 100 }} min={0} max={100} value={settings.lowAttendanceAlert} onChange={e => setSettings({...settings, lowAttendanceAlert: parseInt(e.target.value)})} />
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 5 }}>Alert when student attendance falls below this percentage</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Status for Unmarked Students</label>
                  <select className="form-control" style={{ width: 200 }}>
                    <option>Absent</option>
                    <option>Not Marked</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {tab === 'notifications' && (
            <>
              <div className="card-header"><Bell size={16} color="#d97706" /><span className="card-title">Notification Settings</span></div>
              <div className="card-body">
                {[
                  { key: 'attendanceNotifications', label: 'Attendance Notifications', desc: 'Get notified when attendance is recorded' },
                  { key: 'absentAlerts',             label: 'Absent Student Alerts',   desc: 'Alert when a student is marked absent' },
                  { key: 'reportReady',              label: 'Report Ready Alerts',     desc: 'Notify when reports are generated' },
                  { key: 'lowAttendanceAlert',       label: 'Low Attendance Warning',  desc: 'Warn when attendance rate drops below threshold', isNum: true },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--gray-100)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{item.desc}</div>
                    </div>
                    {item.isNum ? (
                      <input type="number" className="form-control" style={{ width: 80 }} value={settings[item.key] || 75} onChange={e => setSettings({...settings, [item.key]: parseInt(e.target.value)})} />
                    ) : (
                      <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={{ opacity: 0, width: 0, height: 0 }}
                          checked={!!settings[item.key]}
                          onChange={e => setSettings({...settings, [item.key]: e.target.checked})}
                        />
                        <span style={{
                          position: 'absolute', inset: 0, borderRadius: 24,
                          background: settings[item.key] ? '#2563eb' : '#d1d5db',
                          transition: '0.2s',
                        }}>
                          <span style={{
                            position: 'absolute', left: settings[item.key] ? 20 : 2, top: 2,
                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: '0.2s',
                          }} />
                        </span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'data' && (
            <>
              <div className="card-header"><Database size={16} color="#dc2626" /><span className="card-title">Data Management</span></div>
              <div className="card-body">
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Shield size={18} color="#dc2626" />
                    <span style={{ fontWeight: 700, color: '#dc2626' }}>Danger Zone</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 14 }}>
                    The actions below are irreversible. All data is stored locally in your browser. Resetting will remove all students, teachers, attendance records, and reload the demo data.
                  </p>
                  <button className="btn btn-danger" onClick={() => setShowResetConfirm(true)}>
                    <RotateCcw size={14} /> Reset to Demo Data
                  </button>
                </div>

                <div style={{ background: 'var(--gray-50)', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Storage Info</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                    All data is stored in your browser's localStorage. No data is sent to any server.
                    To backup, use your browser's developer tools to export localStorage.
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                    <span className="badge badge-blue">localStorage</span>
                    <span className="badge badge-success">Offline capable</span>
                    <span className="badge badge-gray">No server required</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reset Confirm */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><Trash2 size={18} color="#dc2626" /><h3>Reset All Data</h3></div>
            <div className="modal-body">
              <p>This will <strong>permanently delete all data</strong> and reload the demo dataset. Are you sure?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={resetData}>Yes, Reset Everything</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
