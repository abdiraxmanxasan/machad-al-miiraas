import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Eye, X, Phone, Mail, User, BookOpen, UserCheck } from 'lucide-react';
import {
  getStudents, saveStudents, getClasses, generateId, addNotification
} from '../db.js';

const GENDERS  = ['male', 'female'];
const STATUSES = ['active', 'inactive'];
const RELATIONS = ['Father', 'Mother', 'Guardian'];

function getAvatarColor(name) {
  const colors = ['#2563eb','#7c3aed','#0891b2','#16a34a','#d97706','#dc2626','#db2777'];
  return colors[(name || '').charCodeAt(0) % colors.length];
}

function initForm(classes) {
  return {
    name: '', gender: 'male', dateOfBirth: '', classId: classes[0]?.id || '',
    phone: '', parentName: '', parentPhone: '', parentRelation: 'Father',
    address: '', enrollmentDate: new Date().toISOString().slice(0,10),
    status: 'active',
  };
}

export default function Students({ addToast }) {
  const [students, setStudents] = useState([]);
  const [classes,  setClasses]  = useState([]);
  const [search,   setSearch]   = useState('');
  const [filterClass,  setFilterClass]  = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modal,  setModal]  = useState(null); // 'add' | 'edit' | 'view'
  const [form,   setForm]   = useState({});
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);

  useEffect(() => {
    setStudents(getStudents());
    setClasses(getClasses());
  }, []);

  function refresh() { setStudents(getStudents()); }

  // Filter
  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q) || (s.parentName || '').toLowerCase().includes(q);
    const matchClass  = !filterClass  || s.classId === filterClass;
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchClass && matchStatus;
  });

  function openAdd() {
    setForm(initForm(classes));
    setEditing(null);
    setModal('add');
  }

  function openEdit(student) {
    setForm({ ...student });
    setEditing(student);
    setModal('edit');
  }

  function openView(student) {
    setViewStudent(student);
    setModal('view');
  }

  function closeModal() { setModal(null); setEditing(null); }

  function handleSave() {
    if (!form.name || !form.classId) {
      addToast('Name and class are required', 'error');
      return;
    }
    const all = getStudents();
    if (editing) {
      const updated = all.map(s => s.id === editing.id ? { ...s, ...form } : s);
      saveStudents(updated);
      addToast(`Updated ${form.name}`, 'success');
    } else {
      const cls = classes.find(c => c.id === form.classId);
      const grade = cls ? cls.grade : '7';
      const count = all.length + 1;
      const newStudent = {
        ...form,
        id: generateId(),
        studentId: `ST-${String(count).padStart(3, '0')}`,
        grade,
        avatar: form.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase(),
      };
      saveStudents([...all, newStudent]);
      addNotification('info', 'New Enrollment', `${form.name} enrolled in ${cls?.name}`);
      addToast(`Added ${form.name}`, 'success');
    }
    refresh();
    closeModal();
  }

  function handleDelete(student) {
    const all = getStudents().filter(s => s.id !== student.id);
    saveStudents(all);
    addToast(`Removed ${student.name}`, 'info');
    setDeleteConfirm(null);
    refresh();
  }

  function toggleStatus(student) {
    const all = getStudents().map(s =>
      s.id === student.id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
    );
    saveStudents(all);
    addToast(`${student.name} marked ${student.status === 'active' ? 'inactive' : 'active'}`);
    refresh();
  }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Students</h1>
          <p>{students.filter(s=>s.status==='active').length} active · {students.length} total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={15} /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
              <Search size={15} className="search-icon" />
              <input
                className="form-control"
                placeholder="Search name, ID, parent…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="form-control" style={{ width: 160 }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="form-control" style={{ width: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {(search || filterClass || filterStatus) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterClass(''); setFilterStatus(''); }}>
                <X size={13} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>No students found</h3>
              <p>Try adjusting your search or filters</p>
              <button className="btn btn-primary mt-4" onClick={openAdd}><Plus size={14} /> Add Student</button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Class</th>
                  <th>Gender</th>
                  <th>Parent</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const cls = classes.find(c => c.id === s.classId);
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ background: getAvatarColor(s.name) }}>{s.avatar}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{s.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Since {s.enrollmentDate?.slice(0,4)}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-blue">{s.studentId}</span></td>
                      <td><span className="badge badge-gray">{cls?.name || '—'}</span></td>
                      <td><span style={{ textTransform: 'capitalize' }}>{s.gender}</span></td>
                      <td>
                        <div style={{ fontSize: 13 }}>{s.parentName}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.parentRelation}</div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.phone}</td>
                      <td>
                        <span
                          className={`badge badge-${s.status === 'active' ? 'success' : 'gray'}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleStatus(s)}
                          title="Click to toggle"
                        >
                          {s.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-icon btn-sm" title="View" onClick={() => openView(s)}>
                            <Eye size={14} />
                          </button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(s)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-ghost btn-icon btn-sm" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => setDeleteConfirm(s)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--gray-100)', fontSize: 12, color: 'var(--gray-400)' }}>
          Showing {filtered.length} of {students.length} students
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <User size={18} color="#2563eb" />
              <h3>{modal === 'add' ? 'Add New Student' : 'Edit Student'}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={closeModal}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input className="form-control" placeholder="Ahmed Ali" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Class / Grade <span className="required">*</span></label>
                  <select className="form-control" value={form.classId || ''} onChange={e => setForm({...form, classId: e.target.value})}>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-control" value={form.gender || 'male'} onChange={e => setForm({...form, gender: e.target.value})}>
                    {GENDERS.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase()+g.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input type="date" className="form-control" value={form.dateOfBirth || ''} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="+252-61-..." value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Enrollment Date</label>
                  <input type="date" className="form-control" value={form.enrollmentDate || ''} onChange={e => setForm({...form, enrollmentDate: e.target.value})} />
                </div>
              </div>
              <div className="divider" />
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Parent / Guardian</div>
              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">Parent Name</label>
                  <input className="form-control" placeholder="Name" value={form.parentName || ''} onChange={e => setForm({...form, parentName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Phone</label>
                  <input className="form-control" placeholder="+252-61-..." value={form.parentPhone || ''} onChange={e => setForm({...form, parentPhone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Relation</label>
                  <select className="form-control" value={form.parentRelation || 'Father'} onChange={e => setForm({...form, parentRelation: e.target.value})}>
                    {RELATIONS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" placeholder="Mogadishu, Somalia" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
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
                {modal === 'add' ? 'Add Student' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {modal === 'view' && viewStudent && (() => {
        const cls = classes.find(c => c.id === viewStudent.classId);
        return (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <Eye size={18} color="#2563eb" />
                <h3>Student Profile</h3>
                <button className="btn btn-ghost btn-icon btn-sm" style={{ marginLeft: 'auto' }} onClick={closeModal}><X size={16} /></button>
              </div>
              <div className="modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div className="avatar avatar-xl" style={{ background: getAvatarColor(viewStudent.name) }}>
                    {viewStudent.avatar}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800 }}>{viewStudent.name}</h2>
                    <span className="badge badge-blue">{viewStudent.studentId}</span>
                    <span className="badge badge-gray" style={{ marginLeft: 6 }}>{cls?.name}</span>
                    <span className={`badge badge-${viewStudent.status === 'active' ? 'success' : 'gray'}`} style={{ marginLeft: 6 }}>{viewStudent.status}</span>
                  </div>
                </div>
                <div className="divider" />
                <div className="form-row">
                  <InfoRow icon={<User size={13} />} label="Gender" value={viewStudent.gender} />
                  <InfoRow icon={null} label="Date of Birth" value={viewStudent.dateOfBirth} />
                </div>
                <div className="form-row">
                  <InfoRow icon={<Phone size={13} />} label="Phone" value={viewStudent.phone} />
                  <InfoRow icon={null} label="Enrolled" value={viewStudent.enrollmentDate} />
                </div>
                <div className="divider" />
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Parent / Guardian</div>
                <div className="form-row">
                  <InfoRow icon={<User size={13} />} label="Name" value={viewStudent.parentName} />
                  <InfoRow icon={null} label="Relation" value={viewStudent.parentRelation} />
                </div>
                <InfoRow icon={<Phone size={13} />} label="Parent Phone" value={viewStudent.parentPhone} />
                <InfoRow icon={null} label="Address" value={viewStudent.address} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Close</button>
                <button className="btn btn-primary" onClick={() => { openEdit(viewStudent); }}>Edit</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <Trash2 size={18} color="#dc2626" />
              <h3>Remove Student</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to remove <strong>{deleteConfirm.name}</strong>? This action cannot be undone and will also delete all attendance records for this student.</p>
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

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        {icon}{label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--gray-800)', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}
