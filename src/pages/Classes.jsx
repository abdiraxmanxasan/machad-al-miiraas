import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, BookOpen, Users, GraduationCap, UserPlus, UserMinus } from 'lucide-react';
import {
  getClasses, saveClasses, getTeachers, getStudents, saveStudents,
  getSubjects, generateId
} from '../db.js';

function getAvatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#dc2626','#db2777'];
  return colors[(name || '').charCodeAt(0) % colors.length];
}

const ROOMS = ['101','102','103','201','202','203','301','302','303','Library','Lab-A','Lab-B'];
const GRADES = ['7','8','9','10','11','12'];
const SECTIONS = ['A','B','C','D','E'];

export default function Classes({ addToast }) {
  const [classes,  setClasses]  = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal,    setModal]    = useState(null); // 'add'|'edit'|'manage-students'
  const [form,     setForm]     = useState({});
  const [editing,  setEditing]  = useState(null);
  const [manageClass, setManageClass] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    setClasses(getClasses());
    setTeachers(getTeachers());
    setStudents(getStudents());
    setSubjects(getSubjects());
  }, []);

  function refresh() {
    setClasses(getClasses());
    setStudents(getStudents());
  }

  function initForm() {
    return { name: '', grade: '7', section: 'A', teacherId: '', subjects: [], room: '', capacity: 35, academicYear: '2026-2027' };
  }

  function openAdd() { setForm(initForm()); setEditing(null); setModal('add'); }
  function openEdit(cls) { setForm({ ...cls }); setEditing(cls); setModal('edit'); }
  function openManage(cls) { setManageClass(cls); setModal('manage-students'); }
  function closeModal() { setModal(null); setEditing(null); setManageClass(null); }

  function toggleSubject(id) {
    setForm(prev => ({
      ...prev,
      subjects: (prev.subjects || []).includes(id)
        ? prev.subjects.filter(s => s !== id)
        : [...(prev.subjects || []), id]
    }));
  }

  // Auto-generate name from grade+section
  function updateGradeSection(field, val) {
    const newForm = { ...form, [field]: val };
    const g = field === 'grade' ? val : form.grade;
    const s = field === 'section' ? val : form.section;
    newForm.name = `Grade ${g}-${s}`;
    setForm(newForm);
  }

  function handleSave() {
    if (!form.grade || !form.section) { addToast('Grade and section required', 'error'); return; }
    const all = getClasses();
    if (editing) {
      saveClasses(all.map(c => c.id === editing.id ? { ...c, ...form } : c));
      addToast(`Updated ${form.name}`);
    } else {
      saveClasses([...all, { ...form, id: generateId(), name: form.name || `Grade ${form.grade}-${form.section}` }]);
      addToast(`Created ${form.name || `Grade ${form.grade}-${form.section}`}`);
    }
    refresh();
    closeModal();
  }

  function handleDelete(cls) {
    saveClasses(getClasses().filter(c => c.id !== cls.id));
    // Move students to unassigned
    const updated = getStudents().map(s => s.classId === cls.id ? { ...s, classId: '' } : s);
    saveStudents(updated);
    addToast(`Removed ${cls.name}`, 'info');
    setDeleteConfirm(null);
    refresh();
  }

  function moveStudent(student, targetClassId) {
    const updated = getStudents().map(s => s.id === student.id ? { ...s, classId: targetClassId } : s);
    saveStudents(updated);
    addToast(`Moved ${student.name} to ${targetClassId ? classes.find(c=>c.id===targetClassId)?.name : 'unassigned'}`);
    refresh();
    setManageClass(cls => cls); // re-render
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Classes</h1>
          <p>{classes.length} classes · {students.filter(s=>s.status==='active').length} active students</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Create Class
        </button>
      </div>

      {/* Class Cards */}
      <div className="grid-auto">
        {classes.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No classes yet</h3>
              <button className="btn btn-primary mt-4" onClick={openAdd}><Plus size={14} /> Create Class</button>
            </div>
          </div>
        ) : classes.map(cls => {
          const teacher       = teachers.find(t => t.id === cls.teacherId);
          const classStudents = students.filter(s => s.classId === cls.id && s.status === 'active');
          const classSubjects = subjects.filter(s => (cls.subjects || []).includes(s.id));
          const occupancy     = Math.round((classStudents.length / (cls.capacity || 35)) * 100);

          return (
            <div key={cls.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Color header */}
              <div style={{
                height: 8,
                background: `linear-gradient(90deg, #2563eb, #7c3aed)`,
              }} />
              <div style={{ padding: '16px 20px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: 18, color: 'var(--gray-900)' }}>{cls.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>
                      Room {cls.room} · AY {cls.academicYear}
                    </div>
                  </div>
                  <span className="badge badge-blue">Grade {cls.grade}</span>
                </div>

                {/* Teacher */}
                {teacher && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0', padding: '10px', background: 'var(--gray-50)', borderRadius: 8 }}>
                    <div className="avatar avatar-sm" style={{ background: getAvatarColor(teacher.name) }}>
                      {teacher.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{teacher.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Class Teacher</div>
                    </div>
                  </div>
                )}

                {/* Subjects */}
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                  {classSubjects.slice(0, 3).map(s => (
                    <span key={s.id} className="badge" style={{ background: `${s.color}15`, color: s.color, fontSize: 10.5 }}>{s.code}</span>
                  ))}
                  {classSubjects.length > 3 && <span className="badge badge-gray" style={{ fontSize: 10.5 }}>+{classSubjects.length-3}</span>}
                </div>

                {/* Occupancy */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                    <span style={{ color: 'var(--gray-600)', fontWeight: 500 }}>Students</span>
                    <span style={{ fontWeight: 700 }}>{classStudents.length} / {cls.capacity}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${occupancy}%`, background: occupancy > 90 ? '#dc2626' : '#2563eb' }} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openManage(cls)}>
                    <Users size={12} /> Students
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => openEdit(cls)}>
                    <Edit2 size={12} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(cls)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <BookOpen size={18} color="#2563eb" />
              <h3>{modal === 'add' ? 'Create Class' : 'Edit Class'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={closeModal}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Grade</label>
                  <select className="form-control" value={form.grade || '7'} onChange={e => updateGradeSection('grade', e.target.value)}>
                    {GRADES.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-control" value={form.section || 'A'} onChange={e => updateGradeSection('section', e.target.value)}>
                    {SECTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Class Name</label>
                <input className="form-control" value={form.name || `Grade ${form.grade || '7'}-${form.section || 'A'}`} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Room</label>
                  <select className="form-control" value={form.room || ''} onChange={e => setForm({...form, room: e.target.value})}>
                    <option value="">Select room</option>
                    {ROOMS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input type="number" className="form-control" value={form.capacity || 35} onChange={e => setForm({...form, capacity: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Class Teacher</label>
                <select className="form-control" value={form.teacherId || ''} onChange={e => setForm({...form, teacherId: e.target.value})}>
                  <option value="">— No teacher assigned —</option>
                  {teachers.filter(t=>t.status==='active').map(t => <option key={t.id} value={t.id}>{t.name} ({t.employeeId})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subjects</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {subjects.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: (form.subjects || []).includes(s.id) ? `${s.color}15` : '#f9fafb',
                        border: `1.5px solid ${(form.subjects || []).includes(s.id) ? s.color : 'var(--gray-200)'}`,
                        color: (form.subjects || []).includes(s.id) ? s.color : 'var(--gray-500)',
                        fontWeight: 600,
                      }}
                      onClick={() => toggleSubject(s.id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{modal === 'add' ? 'Create Class' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Students Modal */}
      {modal === 'manage-students' && manageClass && (() => {
        const classStudents   = students.filter(s => s.classId === manageClass.id && s.status === 'active');
        const otherStudents   = students.filter(s => s.classId !== manageClass.id && s.status === 'active');
        const unassigned      = students.filter(s => (!s.classId || s.classId === '') && s.status === 'active');
        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <Users size={18} color="#2563eb" />
                <h3>Manage Students — {manageClass.name}</h3>
                <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={closeModal}><X size={16} /></button>
              </div>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Current students */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10, color: 'var(--gray-700)' }}>
                    In {manageClass.name} ({classStudents.length})
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--gray-100)', borderRadius: 8 }}>
                    {classStudents.length === 0 ? (
                      <div className="empty-state" style={{ padding: '30px 20px' }}><p>No students</p></div>
                    ) : classStudents.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--gray-50)' }}>
                        <div className="avatar avatar-sm" style={{ background: getAvatarColor(s.name) }}>{s.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 12.5 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.studentId}</div>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: 11 }}
                          title="Remove from class"
                          onClick={() => { moveStudent(s, ''); refresh(); }}>
                          <UserMinus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Available students */}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 10, color: 'var(--gray-700)' }}>
                    Available Students ({unassigned.length + otherStudents.length})
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--gray-100)', borderRadius: 8 }}>
                    {[...unassigned, ...otherStudents].length === 0 ? (
                      <div className="empty-state" style={{ padding: '30px 20px' }}><p>All students assigned</p></div>
                    ) : [...unassigned, ...otherStudents].map(s => {
                      const fromCls = s.classId ? classes.find(c => c.id === s.classId)?.name : 'Unassigned';
                      return (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid var(--gray-50)' }}>
                          <div className="avatar avatar-sm" style={{ background: getAvatarColor(s.name) }}>{s.avatar}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 12.5 }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{fromCls}</div>
                          </div>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--success)', fontSize: 11 }}
                            title="Add to this class"
                            onClick={() => { moveStudent(s, manageClass.id); refresh(); }}>
                            <UserPlus size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={closeModal}>Done</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><Trash2 size={18} color="#dc2626" /><h3>Delete Class</h3></div>
            <div className="modal-body">
              <p>Delete <strong>{deleteConfirm.name}</strong>? All students will be unassigned. Attendance history is kept.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
