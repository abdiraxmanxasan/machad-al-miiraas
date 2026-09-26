import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileDown, BarChart3, TrendingUp, Users, Calendar, ChevronDown } from 'lucide-react';
import {
  getStudents, getClasses, getSubjects, getAttendance, getStudentAttendanceSummary
} from '../db.js';

const today = new Date().toISOString().slice(0, 10);
const monthStart = today.slice(0, 7) + '-01';

export default function Reports({ addToast }) {
  const [reportType, setReportType] = useState('class'); // 'class'|'student'|'daily'
  const [classes,    setClasses]    = useState([]);
  const [students,   setStudents]   = useState([]);
  const [classId,    setClassId]    = useState('');
  const [studentId,  setStudentId]  = useState('');
  const [startDate,  setStartDate]  = useState(monthStart);
  const [endDate,    setEndDate]    = useState(today);
  const [reportData, setReportData] = useState(null);
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    const cls = getClasses();
    const stu = getStudents().filter(s => s.status === 'active');
    setClasses(cls);
    setStudents(stu);
    if (cls.length > 0) setClassId(cls[0].id);
    if (stu.length > 0) setStudentId(stu[0].id);
  }, []);

  function generateReport() {
    setLoading(true);
    setTimeout(() => {
      const attendance = getAttendance();

      if (reportType === 'class') {
        // Class report: per-day stats
        const classStudents = students.filter(s => s.classId === classId);
        const filtered = attendance.filter(a => a.classId === classId && a.date >= startDate && a.date <= endDate);
        const byDate = {};
        filtered.forEach(r => {
          if (!byDate[r.date]) byDate[r.date] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
          byDate[r.date][r.status]++;
          byDate[r.date].total++;
        });
        const chartData = Object.keys(byDate).sort().map(date => ({
          date: new Date(date+'T00:00:00').toLocaleDateString('en',{month:'short',day:'numeric'}),
          Present: byDate[date].present,
          Absent:  byDate[date].absent,
          Late:    byDate[date].late,
        }));

        // Per-student summary
        const studentSummaries = classStudents.map(s => {
          const sum = getStudentAttendanceSummary(s.id, startDate, endDate);
          return { ...s, ...sum };
        }).sort((a,b) => a.rate - b.rate);

        const total   = filtered.length;
        const present = filtered.filter(r=>r.status==='present').length;
        const absent  = filtered.filter(r=>r.status==='absent').length;
        const late    = filtered.filter(r=>r.status==='late').length;
        const excused = filtered.filter(r=>r.status==='excused').length;
        const overall = total > 0 ? Math.round(((present+excused)/total)*100) : 0;
        const cls     = classes.find(c => c.id === classId);

        setReportData({ type: 'class', cls, chartData, studentSummaries, total, present, absent, late, excused, overall, startDate, endDate });

      } else if (reportType === 'student') {
        const student = students.find(s => s.id === studentId);
        const cls     = classes.find(c => c.id === student?.classId);
        const sum     = getStudentAttendanceSummary(studentId, startDate, endDate);
        const filtered = attendance.filter(a => a.studentId === studentId && a.date >= startDate && a.date <= endDate);
        const chartData = filtered
          .sort((a,b) => a.date.localeCompare(b.date))
          .map(r => ({
            date: new Date(r.date+'T00:00:00').toLocaleDateString('en',{month:'short',day:'numeric'}),
            status: r.status === 'present' ? 1 : r.status === 'excused' ? 0.75 : r.status === 'late' ? 0.5 : 0,
            label: r.status,
          }));
        setReportData({ type: 'student', student, cls, ...sum, chartData, startDate, endDate });

      } else if (reportType === 'daily') {
        // Daily overview across all classes
        const filtered = attendance.filter(a => a.date === startDate);
        const byClass  = {};
        classes.forEach(c => {
          const recs = filtered.filter(r => r.classId === c.id);
          const stuCount = students.filter(s => s.classId === c.id).length;
          byClass[c.id] = {
            name: c.name,
            present: recs.filter(r=>r.status==='present').length,
            absent:  recs.filter(r=>r.status==='absent').length,
            late:    recs.filter(r=>r.status==='late').length,
            excused: recs.filter(r=>r.status==='excused').length,
            total:   stuCount,
          };
        });
        const rows = Object.values(byClass);
        const chartData = rows.map(r => ({ name: r.name, Present: r.present, Absent: r.absent, Late: r.late }));
        setReportData({ type: 'daily', date: startDate, rows, chartData });
      }

      setLoading(false);
    }, 200);
  }

  function exportCSV() {
    if (!reportData) return;
    let csv = '';
    if (reportData.type === 'class') {
      csv = 'Student,ID,Present,Absent,Late,Excused,Total,Rate\n';
      reportData.studentSummaries.forEach(s => {
        csv += `"${s.name}",${s.studentId},${s.present},${s.absent},${s.late},${s.excused},${s.total},${s.rate}%\n`;
      });
    } else if (reportData.type === 'student') {
      csv = `Student: ${reportData.student?.name}\nClass: ${reportData.cls?.name}\nPeriod: ${reportData.startDate} to ${reportData.endDate}\n\n`;
      csv += `Present,Absent,Late,Excused,Total,Rate\n`;
      csv += `${reportData.present},${reportData.absent},${reportData.late},${reportData.excused},${reportData.total},${reportData.rate}%\n`;
    } else if (reportData.type === 'daily') {
      csv = 'Class,Present,Absent,Late,Excused,Total,Rate\n';
      reportData.rows.forEach(r => {
        const rate = r.total > 0 ? Math.round(((r.present+r.excused)/r.total)*100) : 0;
        csv += `"${r.name}",${r.present},${r.absent},${r.late},${r.excused},${r.total},${rate}%\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    addToast('Report exported as CSV', 'success');
  }

  const REPORT_TYPES = [
    { key: 'class',   icon: '🏫', label: 'Class Report',   desc: 'Full class attendance over a date range' },
    { key: 'student', icon: '👤', label: 'Student Report',  desc: 'Individual student attendance summary' },
    { key: 'daily',   icon: '📅', label: 'Daily Overview',  desc: 'All classes for a specific day' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports</h1>
          <p>Generate attendance reports and export data</p>
        </div>
        {reportData && (
          <button className="btn btn-success" onClick={exportCSV}>
            <FileDown size={14} /> Export CSV
          </button>
        )}
      </div>

      {/* Report Type Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        {REPORT_TYPES.map(rt => (
          <div
            key={rt.key}
            className="report-card"
            style={{
              border: reportType === rt.key ? '2px solid #2563eb' : undefined,
              background: reportType === rt.key ? '#eff6ff' : undefined,
            }}
            onClick={() => { setReportType(rt.key); setReportData(null); }}
          >
            <div style={{ fontSize: 28 }}>{rt.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: reportType === rt.key ? '#2563eb' : 'var(--gray-800)' }}>{rt.label}</div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{rt.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <BarChart3 size={15} color="#2563eb" />
          <span className="card-title">Report Parameters</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {reportType === 'class' && (
              <div style={{ flex: 1, minWidth: 160 }}>
                <label className="form-label">Class</label>
                <select className="form-control" value={classId} onChange={e => setClassId(e.target.value)}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {reportType === 'student' && (
              <div style={{ flex: 1, minWidth: 200 }}>
                <label className="form-label">Student</label>
                <select className="form-control" value={studentId} onChange={e => setStudentId(e.target.value)}>
                  {students.map(s => {
                    const cls = classes.find(c => c.id === s.classId);
                    return <option key={s.id} value={s.id}>{s.name} ({cls?.name})</option>;
                  })}
                </select>
              </div>
            )}
            {reportType === 'daily' ? (
              <div>
                <label className="form-label">Date</label>
                <input type="date" className="form-control" value={startDate} max={today} onChange={e => setStartDate(e.target.value)} />
              </div>
            ) : (
              <>
                <div>
                  <label className="form-label">From</label>
                  <input type="date" className="form-control" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">To</label>
                  <input type="date" className="form-control" value={endDate} min={startDate} max={today} onChange={e => setEndDate(e.target.value)} />
                </div>
              </>
            )}
            <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
              {loading ? 'Generating…' : '📊 Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* ── CLASS REPORT ── */}
      {reportData?.type === 'class' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Class', value: reportData.cls?.name, color: '#2563eb', bg: '#dbeafe' },
              { label: 'Present', value: reportData.present, color: '#16a34a', bg: '#dcfce7' },
              { label: 'Absent',  value: reportData.absent,  color: '#dc2626', bg: '#fee2e2' },
              { label: 'Late',    value: reportData.late,    color: '#d97706', bg: '#fef9c3' },
              { label: 'Rate',    value: `${reportData.overall}%`, color: reportData.overall>=80?'#16a34a':reportData.overall>=60?'#d97706':'#dc2626', bg: '#f9fafb' },
            ].map(item => (
              <div key={item.label} className="stat-card" style={{ padding: '14px 16px', borderLeft: `3px solid ${item.color}` }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--gray-400)', fontWeight: 500 }}>{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          {reportData.chartData.length > 0 && (
            <div className="card mb-4">
              <div className="card-header"><TrendingUp size={15} color="#2563eb" /><span className="card-title">Daily Trend</span></div>
              <div className="card-body">
                <div className="chart-container" style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="Present" fill="#16a34a" radius={[3,3,0,0]} />
                      <Bar dataKey="Absent"  fill="#dc2626" radius={[3,3,0,0]} />
                      <Bar dataKey="Late"    fill="#d97706" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header"><Users size={15} color="#7c3aed" /><span className="card-title">Student Breakdown</span></div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>ID</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Excused</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.studentSummaries.map(s => (
                    <tr key={s.id}>
                      <td><span style={{ fontWeight: 600 }}>{s.name}</span></td>
                      <td><span className="badge badge-blue">{s.studentId}</span></td>
                      <td><span style={{ color: '#16a34a', fontWeight: 700 }}>{s.present}</span></td>
                      <td><span style={{ color: '#dc2626', fontWeight: 700 }}>{s.absent}</span></td>
                      <td><span style={{ color: '#d97706', fontWeight: 700 }}>{s.late}</span></td>
                      <td><span style={{ color: '#7c3aed', fontWeight: 700 }}>{s.excused}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar" style={{ width: 60 }}>
                            <div className="progress-fill" style={{
                              width: `${s.rate}%`,
                              background: s.rate >= 80 ? '#16a34a' : s.rate >= 60 ? '#d97706' : '#dc2626'
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.rate>=80?'#16a34a':s.rate>=60?'#d97706':'#dc2626' }}>
                            {s.rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── STUDENT REPORT ── */}
      {reportData?.type === 'student' && (
        <>
          <div className="card mb-4">
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="avatar avatar-xl" style={{ background: '#2563eb' }}>
                  {reportData.student?.avatar}
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800 }}>{reportData.student?.name}</h2>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <span className="badge badge-blue">{reportData.student?.studentId}</span>
                    <span className="badge badge-gray">{reportData.cls?.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 6 }}>
                    Period: {reportData.startDate} to {reportData.endDate}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: reportData.rate>=80?'#16a34a':reportData.rate>=60?'#d97706':'#dc2626' }}>
                    {reportData.rate}%
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>Attendance Rate</div>
                </div>
              </div>

              <div className="divider" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                {[
                  { label: 'Present', value: reportData.present, color: '#16a34a' },
                  { label: 'Absent',  value: reportData.absent,  color: '#dc2626' },
                  { label: 'Late',    value: reportData.late,    color: '#d97706' },
                  { label: 'Excused', value: reportData.excused, color: '#7c3aed' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', padding: '14px', background: 'var(--gray-50)', borderRadius: 10 }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: item.color }}>{item.value}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 500 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── DAILY REPORT ── */}
      {reportData?.type === 'daily' && (
        <>
          <div className="card mb-4">
            <div className="card-header">
              <Calendar size={15} color="#2563eb" />
              <span className="card-title">
                Daily Report — {new Date(reportData.date+'T00:00:00').toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
              </span>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="Present" fill="#16a34a" radius={[0,3,3,0]} />
                    <Bar dataKey="Absent"  fill="#dc2626" radius={[0,3,3,0]} />
                    <Bar dataKey="Late"    fill="#d97706" radius={[0,3,3,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>🟢 Present</th>
                    <th>🔴 Absent</th>
                    <th>🟡 Late</th>
                    <th>🟣 Excused</th>
                    <th>Total</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows.map(row => {
                    const rate = row.total > 0 ? Math.round(((row.present+row.excused)/row.total)*100) : 0;
                    return (
                      <tr key={row.name}>
                        <td><span style={{ fontWeight: 700 }}>{row.name}</span></td>
                        <td><span style={{ color: '#16a34a', fontWeight: 700 }}>{row.present}</span></td>
                        <td><span style={{ color: '#dc2626', fontWeight: 700 }}>{row.absent}</span></td>
                        <td><span style={{ color: '#d97706', fontWeight: 700 }}>{row.late}</span></td>
                        <td><span style={{ color: '#7c3aed', fontWeight: 700 }}>{row.excused}</span></td>
                        <td><span style={{ fontWeight: 700 }}>{row.total}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 70 }}>
                              <div className="progress-fill" style={{ width: `${rate}%`, background: rate>=80?'#16a34a':rate>=60?'#d97706':'#dc2626' }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: rate>=80?'#16a34a':rate>=60?'#d97706':'#dc2626' }}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
