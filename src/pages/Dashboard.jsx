import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, GraduationCap, BookOpen, UserCheck, UserX, Clock, TrendingUp, Plus, ClipboardCheck, BarChart3, ArrowRight } from 'lucide-react';
import {
  getStudents, getTeachers, getClasses, getAttendance,
  getTodayAttendanceSummary, getNotifications
} from '../db.js';

const COLORS = {
  present: '#16a34a',
  absent:  '#dc2626',
  late:    '#d97706',
  excused: '#7c3aed',
};

function getAvatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#dc2626','#db2777'];
  const idx = (name || '').charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function Dashboard({ addToast }) {
  const navigate = useNavigate();
  const [data, setData] = useState({
    students: [], teachers: [], classes: [], attendance: [], summary: {}
  });

  useEffect(() => {
    const students   = getStudents();
    const teachers   = getTeachers();
    const classes    = getClasses();
    const attendance = getAttendance();
    const summary    = getTodayAttendanceSummary();
    setData({ students, teachers, classes, attendance, summary });
  }, []);

  const { students, teachers, classes, attendance, summary } = data;

  const activeStudents  = students.filter(s => s.status === 'active').length;
  const activeTeachers  = teachers.filter(t => t.status === 'active').length;
  const totalClasses    = classes.length;
  const rate = summary.total > 0 ? Math.round(((summary.present + summary.excused) / summary.total) * 100) : 0;

  // Build weekly bar chart data
  const today = new Date();
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = d.toISOString().slice(0, 10);
    const dayRecords = attendance.filter(a => a.date === dateStr);
    weekDays.push({
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      Present:  dayRecords.filter(r => r.status === 'present').length,
      Absent:   dayRecords.filter(r => r.status === 'absent').length,
      Late:     dayRecords.filter(r => r.status === 'late').length,
    });
  }

  const pieData = [
    { name: 'Present', value: summary.present  || 0, color: COLORS.present },
    { name: 'Absent',  value: summary.absent   || 0, color: COLORS.absent  },
    { name: 'Late',    value: summary.late     || 0, color: COLORS.late    },
    { name: 'Excused', value: summary.excused  || 0, color: COLORS.excused },
  ].filter(d => d.value > 0);

  // Recent activity — last 5 attendance records
  const recent = [...attendance]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
    .map(r => {
      const st  = students.find(s => s.id === r.studentId);
      const cls = classes.find(c => c.id === r.classId);
      return { ...r, studentName: st?.name || '—', className: cls?.name || '—', avatar: st?.avatar || '?' };
    });

  // Class attendance overview
  const classOverview = classes.map(cls => {
    const todayStr = today.toISOString().slice(0, 10);
    const todayRecs = attendance.filter(a => a.classId === cls.id && a.date === todayStr);
    const presentCount = todayRecs.filter(r => r.status === 'present').length;
    const totalInClass = students.filter(s => s.classId === cls.id && s.status === 'active').length;
    const pct = totalInClass > 0 ? Math.round((presentCount / totalInClass) * 100) : 0;
    return { ...cls, presentCount, totalInClass, pct };
  });

  return (
    <div>
      {/* Stat Cards */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={22} color="#2563eb" /></div>
          <div className="stat-info">
            <div className="stat-value">{activeStudents}</div>
            <div className="stat-label">Total Students</div>
            <div className="stat-change up">↑ Active enrollments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><GraduationCap size={22} color="#7c3aed" /></div>
          <div className="stat-info">
            <div className="stat-value">{activeTeachers}</div>
            <div className="stat-label">Total Teachers</div>
            <div className="stat-change up">↑ {teachers.length - activeTeachers} inactive</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><BookOpen size={22} color="#0891b2" /></div>
          <div className="stat-info">
            <div className="stat-value">{totalClasses}</div>
            <div className="stat-label">Total Classes</div>
            <div className="stat-change up">↑ Grades 7–9</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><UserCheck size={22} color="#16a34a" /></div>
          <div className="stat-info">
            <div className="stat-value">{summary.present || 0}</div>
            <div className="stat-label">Present Today</div>
            <div className="stat-change up">↑ {rate}% rate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><UserX size={22} color="#dc2626" /></div>
          <div className="stat-info">
            <div className="stat-value">{summary.absent || 0}</div>
            <div className="stat-label">Absent Today</div>
            <div className="stat-change down">↓ Need follow-up</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Clock size={22} color="#d97706" /></div>
          <div className="stat-info">
            <div className="stat-value">{summary.late || 0}</div>
            <div className="stat-label">Late Today</div>
            <div className="stat-change down">↓ Arrived late</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Weekly bar chart */}
        <div className="card">
          <div className="card-header">
            <BarChart3 size={16} color="#2563eb" />
            <span className="card-title">Weekly Attendance Overview</span>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekDays} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Present" fill="#16a34a" radius={[3,3,0,0]} />
                  <Bar dataKey="Absent"  fill="#dc2626" radius={[3,3,0,0]} />
                  <Bar dataKey="Late"    fill="#d97706" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Today's pie chart */}
        <div className="card">
          <div className="card-header">
            <ClipboardCheck size={16} color="#7c3aed" />
            <span className="card-title">Today's Attendance</span>
            <span className="badge badge-blue" style={{ marginLeft: 'auto' }}>
              {new Date().toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <div className="card-body">
            {pieData.length > 0 ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No attendance recorded yet</h3>
                <p>Mark attendance for today to see the chart</p>
                <button className="btn btn-primary mt-4" onClick={() => navigate('/attendance')}>
                  <ClipboardCheck size={14} /> Go to Attendance
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid-2">
        {/* Class Overview */}
        <div className="card">
          <div className="card-header">
            <BookOpen size={16} color="#0891b2" />
            <span className="card-title">Class Attendance Today</span>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/attendance')}>
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            {classOverview.map(cls => (
              <div key={cls.id} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{cls.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                    {cls.presentCount}/{cls.totalInClass} — {cls.pct}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${cls.pct}%`,
                      background: cls.pct >= 80 ? '#16a34a' : cls.pct >= 60 ? '#d97706' : '#dc2626'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <TrendingUp size={16} color="#7c3aed" />
            <span className="card-title">Recent Activity</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recent.length === 0 ? (
              <div className="empty-state">No recent activity</div>
            ) : recent.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--gray-50)' }}>
                <div className="avatar avatar-sm" style={{ background: getAvatarColor(r.studentName) }}>
                  {r.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--gray-800)' }}>{r.studentName}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{r.className} · {r.date}</div>
                </div>
                <span className={`badge badge-${r.status === 'present' ? 'success' : r.status === 'absent' ? 'danger' : r.status === 'late' ? 'warning' : 'purple'}`}>
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-6">
        <div className="card-header">
          <Plus size={16} color="#2563eb" />
          <span className="card-title">Quick Actions</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Record Attendance', icon: '📋', path: '/attendance', color: '#2563eb' },
              { label: 'Add Student',       icon: '👤', path: '/students',   color: '#7c3aed' },
              { label: 'Add Teacher',       icon: '🎓', path: '/teachers',   color: '#0891b2' },
              { label: 'Create Class',      icon: '📚', path: '/classes',    color: '#16a34a' },
              { label: 'Generate Report',   icon: '📊', path: '/reports',    color: '#d97706' },
            ].map(a => (
              <button
                key={a.label}
                className="btn btn-secondary"
                style={{ border: `1.5px solid ${a.color}20`, background: `${a.color}08` }}
                onClick={() => navigate(a.path)}
              >
                <span>{a.icon}</span>
                <span style={{ color: a.color, fontWeight: 700 }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
