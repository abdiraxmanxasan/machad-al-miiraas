import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, X, Phone, Mail, GraduationCap, BookOpen } from 'lucide-react';
import {
  getTeachers, saveTeachers, getClasses, getSubjects, generateId
} from '../db.js';

const GENDERS = ['male', 'female'];
const STATUSES = ['active', 'inactive'];
const QUALS = [
  'BSc Mathematics', 'BA Arabic', 'BA English Literature', 'BSc Biology',
  'BA History', 'BSc Physics', 'BSc Chemistry', 'BA Islamic Studies',
  'MSc Education', 'MEd Curriculum', 'PhD Education'
];

function getAvatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#dc2626','#db2777'];
  return colors[(name || '').charCodeAt(0) % colors.length];
}

function initForm() {
  return {
    name: '', gender: 'male', phone: '', email: '',
    subjects: [], classes: [],
    qualification: '', joinDate: new Date().toISOString().slice(0,10),
    status: 'active',
  };
}

export default function Teachers({ addToast }) {
  const [teachers, setTeachers] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search,   setSearch]   = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState({});
  const [editing,  setEditing]  = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewTeacher, setViewTeacher] = useState(null);

  useEffect(() => {
    setTeachers(getTeachers());
    setClasses(getClasses());
    setSubjects(getSubjects());
  }, []);

  function refresh() { setTeachers(getTeachers()); }

  const filtered = teachers.filter(t => {
    const q = search.toLowerCase();
    const matchSearch  = !q || t.name.toLowerCase().includes(q) || t.employeeId?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
    const matchStatus  = !filterStatus || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  function openAdd() { setForm(initForm()); setEditing(null); setModal('add'); }
  function openEdit(t) { setForm({ ...t }); setEditing(t); setModal('edit'); }
  function openView(t) { setViewTeacher(t); setModal('view'); }
  function closeModal() { setModal(null); setEditing(null); }

  function toggleSubject(id) {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(id)
        ? prev.subjects.filter(s => s !== id)
        : [...prev.subjects, id]
    }));
  }

  function toggleClass(id) {
    setForm(prev => ({
      ...prev,
      classes: (prev.classes || []).includes(id)
        ? (prev.classes || []).filter(c => c !== id)
        : [...(prev.classes || []), id]
    }));
  }

  function handleSave() {
    if (!form.name) { addToast('Name is required', 'error'); return; }
    const all = getTeachers();
    if (editing) {
      const updated = all.map(t => t.id === editing.id ? { ...t, ...form } : t);
      saveTeachers(updated);
      addToast(`Updated ${form.name}`);
    } else {
      const count = all.length + 1;
      const newT = {
        ...form,
        id: generateId(),
        employeeId: `TCH-${String(count).padStart(3,'0')}`,
        avatar: form.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase(),
      };
      saveTeachers([...all, newT]);
      addToast(`Added ${form.name}`);
    }
    refresh();
    closeModal();
  }

  function handleDelete(teacher) {
    saveTeachers(getTeachers().filter(t => t.id !== teacher.id));
    addToast(`Removed ${teacher.name}`, 'info');
    setDeleteConfirm(null);
    refresh();
  }

  function toggleStatus(teacher) {
    const all = getTeachers().map(t =>
      t.id === teacher.id ? { ...t, status: t.status === 'active' ? 'inactive' : 'active' } : t
    );
    saveTeachers(all);
    addToast(`${teacher.name} marked ${teacher.status === 'active' ? 'inactive' : 'active'}`);
    refresh();
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Teachers</h1>
          <p>{teachers.filter(t=>t.status==='active').length} active · {teachers.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Teacher
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <Search size={15} className="search-icon" />
              <input className="form-control" placeholder="Search name, ID, email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ width: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teacher Cards Grid */}
      <div className="grid-auto">
        {filtered.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state">
              <div className="empty-icon">🎓</div>
              <h3>No teachers found</h3>
              <button className="btn btn-primary mt-4" onClick={openAdd}><Plus size={14} /> Add Teacher</button>
            </div>
          </div>
        ) : filtered.map(t => {
          const teacherSubjects = subjects.filter(s => (t.subjects || []).includes(s.id));
          const teacherClasses  = classes.filter(c  => (t.classes  || []).includes(c.id));
          return (
            <div key={t.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Card Header */}
              <div style={{ background: 'linear-gradient(135deg, var(--gray-800), var(--gray-700))', padding: '20px 20px 40px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <span className={`badge badge-${t.status === 'active' ? 'success' : 'gray'}`} style={{ cursor: 'pointer' }} onClick={() => toggleStatus(t)}>
                    {t.status}
                  </span>
                </div>
              </div>
              {/* Avatar */}
              <div style={{ padding: '0 20px', marginTop: -28 }}>
                <div className="avatar avatar-xl" style={{ background: getAvatarColor(t.name), border: '3px solid #fff', boxShadow: 'var(--shadow-md)' }}>
                  {t.avatar || t.name?.slice(0,2)}
                </div>
              </div>
              <div style={{ padding: '12px 20px 20px' }}>
                <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--gray-900)' }}>{t.name}</h3>
                <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{t.employeeId} · {t.qualification}</div>

                <div style={{ margin: '10px 0', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {teacherSubjects.map(s => (
                    <span key={s.id} className="badge badge-blue" style={{ background: `${s.color}15`, color: s.color }}>
                      {s.name}
                    </span>
                  ))}
                </div>

                {teacherClasses.length > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 6 }}>
                    <BookOpen size={11} style={{ display: 'inline', marginRight: 4 }} />
                    {teacherClasses.map(c=>c.name).join(', ')}
                  </div>
                )}

                {t.phone && (
                  <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 4 }}>
                    <Phone size={11} style={{ display: 'inline', marginRight: 4 }} />
                    {t.phone}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openView(t)}>
                    <Eye size={12} /> View
                  </button>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(t)}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(t)}>
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
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <GraduationCap size={18} color="#7c3aed" />
              <h3>{modal === 'add' ? 'Add New Teacher' : 'Edit Teacher'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={closeModal}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input className="form-control" placeholder="Abdi Warsame" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={form.gender || 'male'} onChange={e => setForm({...form, gender: e.target.value})}>
                    {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="+252-61-..." value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-control" placeholder="name@school.so" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Qualification</label>
                  <select className="form-control" value={form.qualification || ''} onChange={e => setForm({...form, qualification: e.target.value})}>
                    <option value="">Select…</option>
                    {QUALS.map(q => <option key={q}>{q}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date</label>
                  <input type="date" className="form-control" value={form.joinDate || ''} onChange={e => setForm({...form, joinDate: e.target.value})} />
                </div>
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
                        background: (form.subjects || []).includes(s.id) ? `${s.color}20` : '#f9fafb',
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

              <div className="form-group">
                <label className="form-label">Assigned Classes</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {classes.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className="btn btn-sm"
                      style={{
                        background: (form.classes || []).includes(c.id) ? '#dbeafe' : '#f9fafb',
                        border: `1.5px solid ${(form.classes || []).includes(c.id) ? '#2563eb' : 'var(--gray-200)'}`,
                        color: (form.classes || []).includes(c.id) ? '#2563eb' : 'var(--gray-500)',
                        fontWeight: 600,
                      }}
                      onClick={() => toggleClass(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status || 'active'} onChange={e => setForm({...form, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {modal === 'add' ? 'Add Teacher' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><Trash2 size={18} color="#dc2626" /><h3>Remove Teacher</h3></div>
            <div className="modal-body">
              <p>Remove <strong>{deleteConfirm.name}</strong>? This cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
