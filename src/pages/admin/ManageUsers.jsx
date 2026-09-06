import { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, AlertTriangle, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import { ErrorMessage, Badge } from '../../components/UI';
import { adminService } from '../../services/index';

const UserManagement = ({ role }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [classes, setClasses] = useState([]);
  const [deleteModalUser, setDeleteModalUser] = useState(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Edit state
  const [editUser, setEditUser] = useState(null); // the user currently being edited, or null
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);

  // Faculty form state
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', password: '', role: 'faculty' });

  // Student form state (extended)
  const [studentForm, setStudentForm] = useState({
    name: '', email: '', password: '', registrationNumber: '',
    mobileNumber: '', class: '', section: '', academicYear: '',
  });

  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  // Bulk Import state (Faculty and Student)
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);

  // Derived dropdown options for student form (create)
  const departments = [...new Set(classes.map((c) => c.department))].sort();
  const sectionsForDept = studentForm.class
    ? classes.filter((c) => c.department === studentForm.class)
    : [];
  const yearsForDeptSection = (studentForm.class && studentForm.section)
    ? classes.filter((c) => c.department === studentForm.class && c.section === studentForm.section)
    : [];

  // Derived dropdown options for edit form (student)
  const editSectionsForDept = editForm.class
    ? classes.filter((c) => c.department === editForm.class)
    : [];
  const editYearsForDeptSection = (editForm.class && editForm.section)
    ? classes.filter((c) => c.department === editForm.class && c.section === editForm.section)
    : [];

  const fetchUsers = () => {
    setLoading(true);
    adminService.getUsers({ role, search: search || undefined })
      .then((res) => {
        setUsers(res.data.data.users || []);
        setSelectedIds(new Set()); // clear stale selection whenever the list refreshes
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [role]);

  useEffect(() => {
    if (role === 'student') {
      adminService.getClasses()
        .then((res) => setClasses(res.data.data.classes || []))
        .catch(() => { });
    }
  }, [role]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!facultyForm.email || !facultyForm.password) {
      setFormError('Email and password are required.');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      await adminService.createUser(facultyForm);
      setShowCreate(false);
      setFacultyForm({ name: '', email: '', password: '', role: 'faculty' });
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create faculty.');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.email || !studentForm.password) {
      setFormError('Name, email, and password are required.');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      await adminService.createStudent(studentForm);
      setShowCreate(false);
      setStudentForm({ name: '', email: '', password: '', registrationNumber: '', mobileNumber: '', class: '', section: '', academicYear: '' });
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create student.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await adminService.updateUser(user._id, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed.');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    try {
      await adminService.deleteUser(deleteModalUser._id);
      setDeleteModalUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  // --- Edit handlers ---
  const openEditModal = (user) => {
    setEditError('');
    setEditUser(user);
    if (role === 'faculty') {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
      });
    } else {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        registrationNumber: user.registrationNumber || '',
        mobileNumber: user.mobileNumber || '',
        class: user.class || '',
        section: user.section || '',
        academicYear: user.academicYear || '',
      });
    }
  };

  const handleEditFieldChange = (field) => (e) => {
    const val = e.target.value;
    setEditForm((p) => ({ ...p, [field]: val }));
    if (field === 'class') setEditForm((p) => ({ ...p, class: val, section: '', academicYear: '' }));
    if (field === 'section') setEditForm((p) => ({ ...p, section: val, academicYear: '' }));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    if (!editForm.name || !editForm.email) {
      setEditError('Name and email are required.');
      return;
    }
    setSaving(true);
    setEditError('');
    try {
      await adminService.updateUser(editUser._id, editForm);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  // --- Bulk selection handlers ---
  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = users.length > 0 && selectedIds.size === users.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u._id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(ids.map((id) => adminService.deleteUser(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkDeleting(false);
    setShowBulkDeleteModal(false);
    if (failed > 0) {
      alert(`${ids.length - failed} deleted successfully. ${failed} failed to delete.`);
    }
    fetchUsers();
  };

  const handleStudentFieldChange = (field) => (e) => {
    const val = e.target.value;
    setStudentForm((p) => ({ ...p, [field]: val }));
    if (field === 'class') setStudentForm((p) => ({ ...p, class: val, section: '', academicYear: '' }));
    if (field === 'section') setStudentForm((p) => ({ ...p, section: val, academicYear: '' }));
  };

  // --- Bulk Import (Faculty) Actions ---
  const handleParseFaculty = async (e) => {
    e.preventDefault();
    if (!importFile) return setFormError('Please select a file');
    setCreating(true);
    setFormError('');
    const fd = new FormData();
    fd.append('file', importFile);
    try {
      const res = await adminService.parseFaculty(fd);
      setImportPreview(res.data.data.preview);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Parsing failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleBulkFaculty = async () => {
    setCreating(true);
    try {
      await adminService.bulkFaculty({ preview: importPreview });
      setImportPreview(null);
      setImportFile(null);
      setShowImport(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Import failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadFacultyTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Temporary Password,Department\nDr. Smith,smith@example.com,temp123,CSE";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "faculty_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Bulk Import (Student, flat / cross-class) Actions ---
  // Unlike ManageClasses.jsx's per-class import, this page isn't scoped to one class, so
  // each row must carry its own Department, Section, and Academic Year, and the target
  // class must already exist (this does NOT create new departments/classes).
  const handleParseStudentsFlat = async (e) => {
    e.preventDefault();
    if (!importFile) return setFormError('Please select a file');
    setCreating(true);
    setFormError('');
    const fd = new FormData();
    fd.append('file', importFile);
    try {
      const res = await adminService.parseStudents(fd);
      setImportPreview(res.data.data.preview);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Parsing failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleBulkStudentsFlat = async () => {
    setCreating(true);
    try {
      // No classId here — each row supplies its own Department/Section/Academic Year,
      // and the backend should resolve/validate against existing classes for each row.
      await adminService.bulkStudents({ preview: importPreview });
      setImportPreview(null);
      setImportFile(null);
      setShowImport(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Import failed.');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadStudentFlatTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Registration Number,Mobile Number,Temporary Password,Department,Section,Academic Year\nJohn Doe,john@example.com,12345678,9876543210,temp123,CSE,A,2026-2027";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const title = role === 'faculty' ? 'Manage Faculty' : 'Manage Students';

  return (
    <Layout title={title}>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{role === 'faculty' ? 'Add and manage faculty accounts' : 'Add and manage student accounts'}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-outline btn-capsule" onClick={() => setShowImport(true)}>
              <Upload size={14} /> Bulk Import
            </button>
            <button className="btn btn-primary btn-capsule" onClick={() => setShowCreate(true)}>
              <UserPlus size={14} /> Add {role === 'faculty' ? 'Faculty' : 'Student'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (single) */}
      {deleteModalUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--space-4)'
        }} onClick={() => setDeleteModalUser(null)}>
          <div className="card" style={{ maxWidth: 400, width: '100%', padding: 'var(--space-8)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--border-radius)', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} color="var(--color-danger)" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--text-lg)' }}>Delete {role === 'faculty' ? 'Faculty' : 'Student'}</h3>
                <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete <strong>{deleteModalUser.name}</strong> ({deleteModalUser.email})? This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteModalUser(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteUser}>Yes, delete account</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--space-4)'
        }} onClick={() => !bulkDeleting && setShowBulkDeleteModal(false)}>
          <div className="card" style={{ maxWidth: 420, width: '100%', padding: 'var(--space-8)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--border-radius)', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} color="var(--color-danger)" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--text-lg)' }}>Delete {selectedIds.size} {role === 'faculty' ? 'faculty' : 'students'}?</h3>
                <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                  This will permanently delete the selected accounts. This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowBulkDeleteModal(false)} disabled={bulkDeleting}>Cancel</button>
              <button className="btn btn-danger" onClick={handleBulkDelete} disabled={bulkDeleting}>
                {bulkDeleting ? 'Deleting...' : 'Yes, delete selected'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--space-4)'
        }} onClick={() => !saving && setEditUser(null)}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 'var(--space-8)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-title" style={{ marginBottom: 'var(--space-6)' }}>
              Edit {role === 'faculty' ? 'Faculty' : 'Student'}
            </div>

            <ErrorMessage message={editError} />

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={editForm.name || ''} onChange={handleEditFieldChange('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={editForm.email || ''} onChange={handleEditFieldChange('email')} required />
              </div>

              {role === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Registration Number</label>
                    <input type="text" className="form-input" value={editForm.registrationNumber || ''} onChange={handleEditFieldChange('registrationNumber')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input type="text" className="form-input" value={editForm.mobileNumber || ''} onChange={handleEditFieldChange('mobileNumber')} />
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select className="form-input" value={editForm.class || ''} onChange={handleEditFieldChange('class')}>
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Section</label>
                      <select className="form-input" value={editForm.section || ''} onChange={handleEditFieldChange('section')} disabled={!editForm.class}>
                        <option value="">Select Section</option>
                        {[...new Set(editSectionsForDept.map((c) => c.section))].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Academic Year</label>
                      <select className="form-input" value={editForm.academicYear || ''} onChange={handleEditFieldChange('academicYear')} disabled={!editForm.section}>
                        <option value="">Select Year</option>
                        {[...new Set(editYearsForDeptSection.map((c) => c.academicYear))].map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditUser(null)} disabled={saving}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Creation Form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-6)' }}>
            New {role === 'faculty' ? 'Faculty' : 'Student'} Account
          </div>

          <ErrorMessage message={formError} />

          {role === 'faculty' ? (
            <form onSubmit={handleCreateFaculty} style={{ maxWidth: 500 }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={facultyForm.name} onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={facultyForm.email} onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input type="text" className="form-input" value={facultyForm.password} onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateStudent}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-input" value={studentForm.name} onChange={handleStudentFieldChange('name')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={studentForm.email} onChange={handleStudentFieldChange('email')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input type="text" className="form-input" value={studentForm.password} onChange={handleStudentFieldChange('password')} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Registration Number (Optional)</label>
                  <input type="text" className="form-input" value={studentForm.registrationNumber} onChange={handleStudentFieldChange('registrationNumber')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number (Optional)</label>
                  <input type="text" className="form-input" value={studentForm.mobileNumber} onChange={handleStudentFieldChange('mobileNumber')} />
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" value={studentForm.class} onChange={handleStudentFieldChange('class')} required>
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Section</label>
                  <select className="form-input" value={studentForm.section} onChange={handleStudentFieldChange('section')} disabled={!studentForm.class} required>
                    <option value="">Select Section</option>
                    {[...new Set(sectionsForDept.map((c) => c.section))].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Year</label>
                  <select className="form-input" value={studentForm.academicYear} onChange={handleStudentFieldChange('academicYear')} disabled={!studentForm.section} required>
                    <option value="">Select Year</option>
                    {[...new Set(yearsForDeptSection.map((c) => c.academicYear))].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Account'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Bulk Import Form (Faculty or Student) */}
      {showImport && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            Bulk Import {role === 'faculty' ? 'Faculty' : 'Students'}
          </div>
          <ErrorMessage message={formError} />

          {!importPreview ? (
            <div>
              <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-4)' }}>
                {role === 'faculty'
                  ? 'Upload a CSV or Excel file containing columns: Name, Email, Temporary Password, Department.'
                  : 'Upload a CSV or Excel file containing columns: Name, Email, Registration Number, Mobile Number, Temporary Password, Department, Section, Academic Year. Each student\'s Department/Section/Academic Year must already exist under Manage Classes.'}
              </p>
              <button
                type="button"
                className="btn btn-outline btn-capsule"
                style={{ marginBottom: 'var(--space-6)' }}
                onClick={role === 'faculty' ? handleDownloadFacultyTemplate : handleDownloadStudentFlatTemplate}
              >
                <Download size={16} /> Download Template
              </button>
              <form onSubmit={role === 'faculty' ? handleParseFaculty : handleParseStudentsFlat} style={{ maxWidth: 500 }}>
                <div className="form-group">
                  <input type="file" className="form-input" accept=".csv,.xlsx,.xls" onChange={e => setImportFile(e.target.files[0])} required />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button type="submit" className="btn btn-primary btn-capsule" disabled={creating}>
                    <Upload size={16} /> {creating ? 'Parsing...' : 'Upload & Preview'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowImport(false); setImportFile(null); }}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: 0 }}>Preview {role === 'faculty' ? 'Faculty' : 'Students'}</h3>
                <div>
                  <Badge color="green">{importPreview.filter(s => s.isValid).length} Valid</Badge>
                  <span style={{ margin: '0 8px' }}></span>
                  <Badge color="red">{importPreview.filter(s => !s.isValid).length} Errors</Badge>
                </div>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 1 }}>
                    <tr>
                      <th>Status</th>
                      <th>Name</th>
                      <th>Email</th>
                      {role === 'student' && <th>Reg No</th>}
                      <th>{role === 'faculty' ? 'Dept' : 'Dept/Sec/Year'}</th>
                      <th>Password</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((s, i) => (
                      <tr key={i} style={{ background: s.isValid ? 'transparent' : 'var(--color-danger-light)' }}>
                        <td>{s.isValid ? <CheckCircle size={16} color="var(--color-success)" /> : <AlertCircle size={16} color="var(--color-danger)" />}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        {role === 'student' && <td>{s.registrationNumber}</td>}
                        <td>{role === 'faculty' ? s.class : `${s.department || s.class || ''} / ${s.section || ''} / ${s.academicYear || ''}`}</td>
                        <td>{s.password}</td>
                        <td style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{s.errors.join(', ')}</td>
                      </tr>
                    ))}
                    {importPreview.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No {role === 'faculty' ? 'faculty' : 'students'} found in file.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button
                  className="btn btn-primary"
                  onClick={role === 'faculty' ? handleBulkFaculty : handleBulkStudentsFlat}
                  disabled={creating || importPreview.filter(s => s.isValid).length === 0}
                >
                  {creating ? 'Saving...' : 'Confirm & Save'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setImportPreview(null); setImportFile(null); }} disabled={creating}>Back</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', maxWidth: 400, flex: 1 }}>
            <input type="text" className="form-input" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="submit" className="btn btn-secondary">Search</button>
          </form>

          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>{selectedIds.size} selected</span>
              <button className="btn btn-sm btn-danger" onClick={() => setShowBulkDeleteModal(true)}>
                <Trash2 size={14} /> Delete Selected
              </button>
            </div>
          )}
        </div>

        {loading ? <div style={{ minHeight: 160 }} /> : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => { if (el) el.indeterminate = someSelected; }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  {role === 'faculty' && <th>Department</th>}
                  {role === 'student' && <th>Dept / Class</th>}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} style={{ opacity: user.isActive ? 1 : 0.5 }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user._id)}
                        onChange={() => toggleSelectOne(user._id)}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{user.name}</div>
                      {role === 'student' && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>{user.registrationNumber || 'No Reg No'}</div>}
                    </td>
                    <td>{user.email}</td>
                    {role === 'faculty' && (
                      <td>{user.class || '-'}</td>
                    )}
                    {role === 'student' && (
                      <td>
                        {user.class ? `${user.class} - ${user.section} (${user.academicYear})` : '-'}
                      </td>
                    )}
                    <td>
                      <Badge color={user.isActive ? 'green' : 'red'}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="btn btn-sm btn-outline btn-icon" onClick={() => openEditModal(user)} title="Edit details">
                          <Edit2 size={16} />
                        </button>
                        <button className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleActive(user)}>
                          {user.isActive ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteModalUser(user)} title="Delete completely">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={role === 'student' ? 6 : (role === 'faculty' ? 6 : 5)} style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-muted)' }}>
                      No {role === 'faculty' ? 'faculty' : 'students'} found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export const ManageFaculty = () => <UserManagement role="faculty" />;
export const ManageStudents = () => <UserManagement role="student" />;
export default UserManagement;