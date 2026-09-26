import { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Save, RotateCcw, Search, CheckCircle, XCircle, Clock, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getClasses, getSubjects, getStudentsByClass,
  getAttendance, saveAttendance, generateId, addNotification
} from '../db.js';

const STATUS_CONFIG = {
  present: { label: 'Present', color: '#16a34a', badge: 'badge-success', emoji: '🟢' },
  absent:  { label: 'Absent',  color: '#dc2626', badge: 'badge-danger',  emoji: '🔴' },
  late:    { label: 'Late',    color: '#d97706', badge: 'badge-warning', emoji: '🟡' },
  excused: { label: 'Excused', color: '#7c3aed', badge: 'badge-purple',  emoji: '🟣' },
};

function getAvatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#dc2626','#db2777'];
  return colors[(name || '').charCodeAt(0) % colors.length];
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function changeDate(current, delta) {
  const d = new Date(current + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

export default function Attendance({ addToast }) {
  const [classes,  setClasses]  = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [date,     setDate]     = useState(todayStr());
  const [classId,  setClassId]  = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [records,  setRecords]  = useState({}); // studentId -> { status, time, notes }
  const [search,   setSearch]   = useState('');
  const [saved,    setSaved]    = useState(false);
  const [tab,      setTab]      = useState('mark'); // 'mark' | 'history'

  // History view
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    const cls = getClasses();
    setClasses(cls);
    setSubjects(getSubjects());
    if (cls.length > 0 && !classId) {
      setClassId(cls[0].id);
    }
  }, []);

  useEffect(() => {
    if (!classId) return;
    const stud = getStudentsByClass(classId);
    setStudents(stud);

    // Load existing records for this date+class
    const existing = getAttendance().filter(a => a.date === date && a.classId === classId);
    const map = {};
    existing.forEach(r => {
      map[r.studentId] = { status: r.status, time: r.time || '', notes: r.notes || '', id: r.id };
    });
    setRecords(map);
    setSaved(false);
  }, [classId, date]);

  // Load history
  useEffect(() => {
    if (tab !== 'history' || !classId) return;
    const all = getAttendance().filter(a => a.classId === classId);
    // Group by date
    const byDate = {};
    all.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = [];
      byDate[r.date].push(r);
    });
    const rows = Object.keys(byDate)
      .sort((a,b) => b.localeCompare(a))
      .slice(0, 14)
      .map(date => {
        const rs = byDate[date];
        return {
          date,
          present: rs.filter(r=>r.status==='present').length,
          absent:  rs.filter(r=>r.status==='absent').length,
          late:    rs.filter(r=>r.status==='late').length,
          excused: rs.filter(r=>r.status==='excused').length,
          total:   rs.length,
        };
      });
    setHistoryData(rows);
  }, [tab, classId]);

  function setStudentStatus(studentId, status) {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        time: status === 'absent' ? '' : (prev[studentId]?.time || timeStr),
      }
    }));
  }

  function setAllStatus(status) {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const map = {};
    students.forEach(s => {
      map[s.id] = { status, time: status === 'absent' ? '' : timeStr, notes: '' };
    });
    setRecords(map);
  }

  function handleSave() {
    if (!classId) { addToast('Please select a class', 'error'); return; }
    const all = getAttendance().filter(a => !(a.date === date && a.classId === classId));
    const newRecords = students.map(s => ({
      id: records[s.id]?.id || generateId(),
      studentId: s.id,
      classId,
      subjectId: subjectId || null,
      date,
      status: records[s.id]?.status || 'absent',
      time: records[s.id]?.time || null,
      notes: records[s.id]?.notes || '',
      recordedBy: 'Admin',
      recordedAt: new Date().toISOString(),
    }));

    saveAttendance([...all, ...newRecords]);
    setSaved(true);

    const presentCount = newRecords.filter(r => r.status === 'present').length;
    const absentCount  = newRecords.filter(r => r.status === 'absent').length;
    const cls = classes.find(c => c.id === classId);
    addNotification('success', 'Attendance Saved',
      `${cls?.name} · ${date} · ${presentCount} present, ${absentCount} absent`);
    addToast(`Attendance saved for ${cls?.name}`, 'success');
  }

  // Summary counts
  const summary = {
    present:  Object.values(records).filter(r => r.status === 'present').length,
    absent:   Object.values(records).filter(r => r.status === 'absent').length,
    late:     Object.values(records).filter(r => r.status === 'late').length,
    excused:  Object.values(records).filter(r => r.status === 'excused').length,
    unmarked: students.length - Object.keys(records).filter(id => records[id]?.status).length,
  };
  const total = students.length;
  const markedCount = Object.keys(records).filter(id => records[id]?.status).length;
  const rate = total > 0 ? Math.round(((summary.present + summary.excused) / total) * 100) : 0;

  const filtered = students.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.studentId.toLowerCase().includes(search.toLowerCase()));

  const cls = classes.find(c => c.id === classId);
  const isToday = date === todayStr();
  const isFuture = date > todayStr();

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Attendance Management</h1>
          <p>Record and track student attendance</p>
        </div>
        {tab === 'mark' && (
          <button className="btn btn-primary" onClick={handleSave} disabled={!classId || isFuture}>
            <Save size={15} /> Save Attendance
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab${tab==='mark' ? ' active' : ''}`} onClick={() => setTab('mark')}>
          <ClipboardCheck size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          Mark Attendance
        </button>
        <button className={`tab${tab==='history' ? ' active' : ''}`} onClick={() => setTab('history')}>
          <FileText size={13} style={{ marginRight: 5, verticalAlign: 'middle' }} />
          History
        </button>
      </div>

      {/* Controls */}
      <div className="card mb-4">
        <div className="card-body" style={{ paddingTop: 16, paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {/* Date Picker */}
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setDate(d => changeDate(d, -1))}>
                  <ChevronLeft size={14} />
                </button>
                <input
                  type="date"
                  className="form-control"
                  style={{ width: 160 }}
                  value={date}
                  max={todayStr()}
                  onChange={e => setDate(e.target.value)}
                />
                <button className="btn btn-secondary btn-icon btn-sm" onClick={() => setDate(d => changeDate(d, 1))} disabled={isToday}>
                  <ChevronRight size={14} />
                </button>
                {!isToday && <button className="btn btn-ghost btn-sm" onClick={() => setDate(todayStr())}>Today</button>}
              </div>
            </div>

            {/* Class */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class</div>
              <select className="form-control" value={classId} onChange={e => setClassId(e.target.value)}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Subject */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject (optional)</div>
              <select className="form-control" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Search */}
            {tab === 'mark' && (
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search</div>
                <div className="search-bar">
                  <Search size={14} className="search-icon" />
                  <input className="form-control" placeholder="Name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Date label */}
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{formatDate(date)}</span>
            {isToday && <span className="badge badge-blue" style={{ fontSize: 11 }}>Today</span>}
            {saved && <span className="badge badge-success" style={{ fontSize: 11 }}>✓ Saved</span>}
          </div>
        </div>
      </div>

      {tab === 'mark' && (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { key: 'present', label: 'Present', icon: '🟢', color: '#16a34a', bg: '#dcfce7' },
              { key: 'absent',  label: 'Absent',  icon: '🔴', color: '#dc2626', bg: '#fee2e2' },
              { key: 'late',    label: 'Late',    icon: '🟡', color: '#d97706', bg: '#fef9c3' },
              { key: 'excused', label: 'Excused', icon: '🟣', color: '#7c3aed', bg: '#ede9fe' },
              { key: 'unmarked',label: 'Not Marked', icon: '⚪', color: '#6b7280', bg: '#f3f4f6' },
            ].map(item => (
              <div key={item.key} className="stat-card" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 20, marginRight: 10 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: item.color }}>
                    {item.key === 'unmarked' ? summary.unmarked : summary[item.key]}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--gray-500)', fontWeight: 500 }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="card mb-4">
            <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>{cls?.name} Attendance — {markedCount}/{total} marked</span>
                <span style={{ color: rate >= 80 ? '#16a34a' : rate >= 60 ? '#d97706' : '#dc2626', fontWeight: 700 }}>
                  {rate}% Rate
                </span>
              </div>
              <div className="progress-bar" style={{ height: 10 }}>
                <div className="progress-fill" style={{
                  width: `${total > 0 ? (markedCount/total)*100 : 0}%`,
                  background: '#2563eb'
                }} />
              </div>

              {/* Bulk actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)', alignSelf: 'center' }}>Mark all as:</span>
                {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
                  <button key={status} className="btn btn-sm" style={{
                    border: `1.5px solid ${cfg.color}`,
                    color: cfg.color,
                    background: 'transparent',
                    fontWeight: 700,
                  }} onClick={() => setAllStatus(status)}>
                    {cfg.emoji} {cfg.label}
                  </button>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => setRecords({})}>
                  <RotateCcw size={12} /> Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Student Table */}
          <div className="card">
            {isFuture ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <h3>Cannot mark future attendance</h3>
                <p>Please select today or a past date</p>
              </div>
            ) : students.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>No students in this class</h3>
                <p>Add students to this class first</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Student</th>
                      <th>Student ID</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, idx) => {
                      const rec = records[s.id] || {};
                      const st  = rec.status;
                      return (
                        <tr key={s.id} style={{ background: st ? 'transparent' : '#fffbeb10' }}>
                          <td style={{ color: 'var(--gray-400)', fontSize: 12 }}>{idx + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar" style={{ background: getAvatarColor(s.name) }}>{s.avatar}</div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.gender}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="badge badge-blue">{s.studentId}</span></td>
                          <td>
                            {st ? (
                              <span className={`badge ${STATUS_CONFIG[st].badge}`}>
                                {STATUS_CONFIG[st].emoji} {STATUS_CONFIG[st].label}
                              </span>
                            ) : (
                              <span className="badge badge-gray">⚪ Not Marked</span>
                            )}
                          </td>
                          <td>
                            <input
                              type="time"
                              className="form-control"
                              style={{ width: 100, padding: '4px 8px', fontSize: 12 }}
                              value={rec.time || ''}
                              disabled={st === 'absent' || !st}
                              onChange={e => setRecords(prev => ({ ...prev, [s.id]: { ...prev[s.id], time: e.target.value } }))}
                            />
                          </td>
                          <td>
                            <input
                              className="form-control"
                              style={{ width: 120, padding: '4px 8px', fontSize: 12 }}
                              placeholder="Optional…"
                              value={rec.notes || ''}
                              onChange={e => setRecords(prev => ({ ...prev, [s.id]: { ...prev[s.id], notes: e.target.value } }))}
                            />
                          </td>
                          <td>
                            <div className="attendance-btn-group">
                              {Object.keys(STATUS_CONFIG).map(status => (
                                <button
                                  key={status}
                                  className={`att-btn ${status}${st === status ? ' active' : ''}`}
                                  onClick={() => setStudentStatus(s.id, status)}
                                  title={STATUS_CONFIG[status].label}
                                >
                                  {STATUS_CONFIG[status].emoji}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            {students.length > 0 && !isFuture && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  {filtered.length} students shown
                </span>
                <button className="btn btn-primary" onClick={handleSave}>
                  <Save size={14} /> Save Attendance
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="card">
          <div className="card-header">
            <FileText size={16} color="#7c3aed" />
            <span className="card-title">Attendance History — {cls?.name}</span>
          </div>
          {historyData.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No attendance records</h3>
              <p>Start recording attendance to see history here</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>🟢 Present</th>
                    <th>🔴 Absent</th>
                    <th>🟡 Late</th>
                    <th>🟣 Excused</th>
                    <th>Total</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map(row => {
                    const r = row.total > 0 ? Math.round(((row.present + row.excused)/row.total)*100) : 0;
                    return (
                      <tr key={row.date}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{new Date(row.date+'T00:00:00').toLocaleDateString('en',{weekday:'short',month:'short',day:'numeric'})}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{row.date}</div>
                        </td>
                        <td><span style={{ fontWeight: 700, color: '#16a34a' }}>{row.present}</span></td>
                        <td><span style={{ fontWeight: 700, color: '#dc2626' }}>{row.absent}</span></td>
                        <td><span style={{ fontWeight: 700, color: '#d97706' }}>{row.late}</span></td>
                        <td><span style={{ fontWeight: 700, color: '#7c3aed' }}>{row.excused}</span></td>
                        <td><span style={{ fontWeight: 700 }}>{row.total}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 60 }}>
                              <div className="progress-fill" style={{ width: `${r}%`, background: r>=80?'#16a34a':r>=60?'#d97706':'#dc2626' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: r>=80?'#16a34a':r>=60?'#d97706':'#dc2626' }}>{r}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
