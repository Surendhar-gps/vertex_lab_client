import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users, ChevronRight, ArrowLeft, Upload, Download, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner, ErrorMessage, Badge } from '../../components/UI';
import { adminService } from '../../services/index';

const ManageClasses = () => {
  // Navigation State
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  // Data State
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Level 1: Department Tabs
  const [deptTab, setDeptTab] = useState('list'); // 'list', 'create', 'import'
  const [deptForm, setDeptForm] = useState({ name: '' });
  const [combinedFile, setCombinedFile] = useState(null);
  const [combinedPreview, setCombinedPreview] = useState(null);

  // Level 2: Class Creation
  const YEAR_LEVELS = ['I', 'II', 'III', 'IV'];
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [classForm, setClassForm] = useState({ section: '', academicYear: '' });

  // Level 2: Department sub-tab (Classes vs Faculty) and Faculty data
  const [deptSectionTab, setDeptSectionTab] = useState('classes'); // 'classes' | 'faculty'
  const [faculty, setFaculty] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [deleteFacultyModal, setDeleteFacultyModal] = useState(null);
  const [editFaculty, setEditFaculty] = useState(null); // faculty member currently being edited, or null
  const [facultyEditForm, setFacultyEditForm] = useState({});
  const [facultyEditError, setFacultyEditError] = useState('');
  const [savingFacultyEdit, setSavingFacultyEdit] = useState(false);

  // Level 3: Student Tabs
  const [studentTab, setStudentTab] = useState('list'); // 'list', 'quick', 'import'
  const [addStudentForm, setAddStudentForm] = useState({ name: '', registrationNumber: '', email: '', password: '' });
  const [studentImportFile, setStudentImportFile] = useState(null);
  const [studentImportPreview, setStudentImportPreview] = useState(null);
  const [deleteStudentModal, setDeleteStudentModal] = useState(null);

  // Level 3: Student Edit
  const [editStudent, setEditStudent] = useState(null); // student currently being edited, or null
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- Fetchers ---
  const fetchDepartments = () => {
    setLoading(true);
    adminService.getDepartments()
      .then(res => setDepartments(res.data.data.departments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchClasses = () => {
    adminService.getClasses()
      .then(res => setClasses(res.data.data.classes || []))
      .catch(console.error);
  };

  const fetchStudentsForClass = (cls) => {
    setLoading(true);
    adminService.getUsers({ role: 'student', class: cls.department, section: cls.section })
      .then(res => setStudents(res.data.data.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchFacultyForDept = (dept) => {
    setFacultyLoading(true);
    adminService.getUsers({ role: 'faculty', class: dept.name })
      .then(res => setFaculty(res.data.data.users || []))
      .catch(console.error)
      .finally(() => setFacultyLoading(false));
  };

  useEffect(() => {
    fetchDepartments();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsForClass(selectedClass);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedDepartment) {
      setDeptSectionTab('classes');
      fetchFacultyForDept(selectedDepartment);
    }
  }, [selectedDepartment]);

  // --- Level 1 Actions (Departments) ---
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!deptForm.name) return setFormError('Department name is required');
    setSubmitting(true);
    setFormError('');
    try {
      await adminService.createDepartment(deptForm);
      setDeptForm({ name: '' });
      setDeptTab('list');
      fetchDepartments();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create department.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? All associated classes will also be deleted!')) return;
    try {
      await adminService.deleteDepartment(id);
      fetchDepartments();
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department.');
    }
  };

  const handleParseCombined = async (e) => {
    e.preventDefault();
    if (!combinedFile) return setFormError('Please select a file');
    setSubmitting(true);
    setFormError('');
    const fd = new FormData();
    fd.append('file', combinedFile);
    try {
      const res = await adminService.parseCombined(fd);
      setCombinedPreview(res.data.data);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Parsing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkCombined = async () => {
    setSubmitting(true);
    try {
      await adminService.bulkCombined(combinedPreview);
      setCombinedPreview(null);
      setCombinedFile(null);
      setDeptTab('list');
      fetchDepartments();
      fetchClasses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Import failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadCombinedTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Department,Section,Year of Study (I/II/III/IV),Name,Email,Registration Number,Mobile Number,Temporary Password\nCSE,A,I,John Doe,john@example.com,12345678,9876543210,temp123";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "combined_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Level 2 Actions (Classes) ---
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!classForm.section || !classForm.academicYear) {
      return setFormError('Section and Year of Study are required.');
    }
    if (!YEAR_LEVELS.includes(classForm.academicYear)) {
      return setFormError('Year of Study must be one of I, II, III, IV.');
    }
    setSubmitting(true);
    setFormError('');
    try {
      await adminService.createClass({
        department: selectedDepartment.name,
        ...classForm
      });
      setShowCreateClass(false);
      setClassForm({ section: '', academicYear: '' });
      fetchClasses();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create class.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm('Delete this class/section? Students will not be affected.')) return;
    try {
      await adminService.deleteClass(id);
      fetchClasses();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  // --- Level 2 Actions (Faculty in this department) ---
  const handleToggleFaculty = async (member) => {
    try {
      await adminService.updateUser(member._id, { isActive: !member.isActive });
      fetchFacultyForDept(selectedDepartment);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed.');
    }
  };

  const handleDeleteFaculty = async () => {
    if (!deleteFacultyModal) return;
    try {
      await adminService.deleteUser(deleteFacultyModal._id);
      setDeleteFacultyModal(null);
      fetchFacultyForDept(selectedDepartment);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const openEditFacultyModal = (member) => {
    setFacultyEditError('');
    setEditFaculty(member);
    setFacultyEditForm({
      name: member.name || '',
      email: member.email || '',
    });
  };

  const handleFacultyEditFieldChange = (field) => (e) => {
    const val = e.target.value;
    setFacultyEditForm((p) => ({ ...p, [field]: val }));
  };

  const handleSaveFacultyEdit = async (e) => {
    e.preventDefault();
    if (!editFaculty) return;
    if (!facultyEditForm.name || !facultyEditForm.email) {
      setFacultyEditError('Name and email are required.');
      return;
    }
    setSavingFacultyEdit(true);
    setFacultyEditError('');
    try {
      await adminService.updateUser(editFaculty._id, facultyEditForm);
      setEditFaculty(null);
      fetchFacultyForDept(selectedDepartment);
    } catch (err) {
      setFacultyEditError(err.response?.data?.message || 'Failed to update.');
    } finally {
      setSavingFacultyEdit(false);
    }
  };

  // --- Level 3 Actions (Students) ---
  const handleQuickAddStudent = async (e) => {
    e.preventDefault();
    if (!addStudentForm.name) {
      setFormError('Name is required.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await adminService.addStudentToClass(selectedClass._id, addStudentForm);
      setAddStudentForm({ name: '', registrationNumber: '', email: '', password: '' });
      setStudentTab('list');
      fetchStudentsForClass(selectedClass);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStudent = async (user) => {
    try {
      await adminService.updateUser(user._id, { isActive: !user.isActive });
      fetchStudentsForClass(selectedClass);
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed.');
    }
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudentModal) return;
    try {
      await adminService.deleteUser(deleteStudentModal._id);
      setDeleteStudentModal(null);
      fetchStudentsForClass(selectedClass);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  // --- Level 3 Actions (Student Edit) ---
  const openEditStudentModal = (student) => {
    setEditError('');
    setEditStudent(student);
    setEditForm({
      name: student.name || '',
      email: student.email || '',
      registrationNumber: student.registrationNumber || '',
      mobileNumber: student.mobileNumber || '',
    });
  };

  const handleEditFieldChange = (field) => (e) => {
    const val = e.target.value;
    setEditForm((p) => ({ ...p, [field]: val }));
  };

  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!editStudent) return;
    if (!editForm.name || !editForm.email) {
      setEditError('Name and email are required.');
      return;
    }
    setSavingEdit(true);
    setEditError('');
    try {
      await adminService.updateUser(editStudent._id, editForm);
      setEditStudent(null);
      fetchStudentsForClass(selectedClass);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update.');
    } finally {
      setSavingEdit(false);
    }
  };

  // Class-level bulk import
  const handleParseStudents = async (e) => {
    e.preventDefault();
    if (!studentImportFile) return setFormError('Please select a file');
    setSubmitting(true);
    setFormError('');
    const fd = new FormData();
    fd.append('file', studentImportFile);
    try {
      const res = await adminService.parseStudents(fd);
      setStudentImportPreview(res.data.data.preview);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Parsing failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkStudents = async () => {
    setSubmitting(true);
    try {
      await adminService.bulkStudents({ preview: studentImportPreview, classId: selectedClass._id });
      setStudentImportPreview(null);
      setStudentImportFile(null);
      setStudentTab('list');
      fetchStudentsForClass(selectedClass);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Import failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadStudentTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email,Registration Number,Mobile Number,Temporary Password\nJohn Doe,john@example.com,12345678,9876543210,temp123";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_class_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // --- RENDERERS ---

  if (loading && !selectedClass && !selectedDepartment) {
    return <Layout><div className="flex-center" style={{ minHeight: '50vh' }}><LoadingSpinner /></div></Layout>;
  }

  return (
    <Layout>
      {/* Delete Confirmation Modal for Student */}
      {deleteStudentModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--space-4)'
        }} onClick={() => setDeleteStudentModal(null)}>
          <div className="card" style={{ maxWidth: 400, width: '100%', padding: 'var(--space-8)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--border-radius)', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} color="var(--color-danger)" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--text-lg)' }}>Delete Student</h3>
                <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete <strong>{deleteStudentModal.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteStudentModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteStudent}>Yes, delete account</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal for Student */}
      {editStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--space-4)'
        }} onClick={() => !savingEdit && setEditStudent(null)}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 'var(--space-8)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-title" style={{ marginBottom: 'var(--space-6)' }}>
              Edit Student
            </div>

            <ErrorMessage message={editError} />

            <form onSubmit={handleSaveStudentEdit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={editForm.name || ''} onChange={handleEditFieldChange('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={editForm.email || ''} onChange={handleEditFieldChange('email')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input type="text" className="form-input" value={editForm.registrationNumber || ''} onChange={handleEditFieldChange('registrationNumber')} />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <input type="text" className="form-input" value={editForm.mobileNumber || ''} onChange={handleEditFieldChange('mobileNumber')} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditStudent(null)} disabled={savingEdit}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Delete Confirmation Modal for Faculty */}
      {deleteFacultyModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--space-4)'
        }} onClick={() => setDeleteFacultyModal(null)}>
          <div className="card" style={{ maxWidth: 400, width: '100%', padding: 'var(--space-8)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--border-radius)', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} color="var(--color-danger)" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 var(--space-1) 0', fontSize: 'var(--text-lg)' }}>Delete Faculty</h3>
                <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete <strong>{deleteFacultyModal.name}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteFacultyModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteFaculty}>Yes, delete account</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal for Faculty */}
      {editFaculty && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--space-4)'
        }} onClick={() => !savingFacultyEdit && setEditFaculty(null)}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 'var(--space-8)', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="card-title" style={{ marginBottom: 'var(--space-6)' }}>
              Edit Faculty
            </div>

            <ErrorMessage message={facultyEditError} />

            <form onSubmit={handleSaveFacultyEdit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" value={facultyEditForm.name || ''} onChange={handleFacultyEditFieldChange('name')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={facultyEditForm.email || ''} onChange={handleFacultyEditFieldChange('email')} required />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" disabled={savingFacultyEdit}>
                  {savingFacultyEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditFaculty(null)} disabled={savingFacultyEdit}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        <h1 className="page-title" style={{ margin: 0, cursor: 'pointer', color: (!selectedDepartment ? 'var(--color-text)' : 'var(--color-primary)') }} onClick={() => { setSelectedDepartment(null); setSelectedClass(null); }}>
          Manage Classes
        </h1>
        {selectedDepartment && (
          <>
            <ChevronRight size={20} color="var(--color-muted)" />
            <h2 className="page-title" style={{ margin: 0, fontSize: 'var(--text-lg)', cursor: 'pointer', color: (!selectedClass ? 'var(--color-text)' : 'var(--color-primary)') }} onClick={() => setSelectedClass(null)}>
              {selectedDepartment.name}
            </h2>
          </>
        )}
        {selectedClass && (
          <>
            <ChevronRight size={20} color="var(--color-muted)" />
            <h2 className="page-title" style={{ margin: 0, fontSize: 'var(--text-lg)' }}>
              {selectedClass.section} (Year of Study: {selectedClass.academicYear})
            </h2>
          </>
        )}
      </div>

      {/* --- LEVEL 1: DEPARTMENTS --- */}
      {!selectedDepartment && (
        <div className="card">
          <div className="tabs" style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
            <button className={`btn btn-ghost ${deptTab === 'list' ? 'active' : ''}`} onClick={() => setDeptTab('list')} style={{ borderBottom: deptTab === 'list' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}>Departments</button>
            <button className={`btn btn-ghost ${deptTab === 'create' ? 'active' : ''}`} onClick={() => setDeptTab('create')} style={{ borderBottom: deptTab === 'create' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}>Create Department</button>
            <button className={`btn btn-ghost ${deptTab === 'import' ? 'active' : ''}`} onClick={() => setDeptTab('import')} style={{ borderBottom: deptTab === 'import' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}>Bulk Import</button>
          </div>

          <ErrorMessage message={formError} />

          {deptTab === 'list' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
              {departments.map(dept => {
                const deptClasses = classes.filter(c => c.department === dept.name);
                return (
                  <div key={dept._id} className="card card-sm" style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderRadius: 'var(--border-radius)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--color-border)',
                    padding: 'var(--space-5)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }} onClick={() => setSelectedDepartment(dept)} onMouseOver={e => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  }} onMouseOut={e => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>{dept.name}</div>
                        <div style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
                          <Users size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
                          {deptClasses.length} Classes/Sections
                        </div>
                      </div>
                      <button className="btn btn-sm btn-danger btn-icon" style={{ zIndex: 2 }} onClick={(e) => { e.stopPropagation(); handleDeleteDepartment(dept._id); }} title="Delete Department">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {departments.length === 0 && <div style={{ color: 'var(--color-muted)' }}>No departments found.</div>}
            </div>
          )}

          {deptTab === 'create' && (
            <form onSubmit={handleCreateDepartment} style={{ maxWidth: 400 }}>
              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input type="text" className="form-input" placeholder="e.g. CSE" value={deptForm.name} onChange={e => setDeptForm({ name: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <LoadingSpinner size={16} /> : 'Create Department'}
              </button>
            </form>
          )}

          {deptTab === 'import' && !combinedPreview && (
            <div>
              <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-4)' }}>
                Upload a CSV or Excel file containing students. Departments and Classes will be created automatically if they don't exist.
              </p>
              <button type="button" className="btn btn-outline btn-capsule" style={{ marginBottom: 'var(--space-6)' }} onClick={handleDownloadCombinedTemplate}>
                <Download size={16} /> Download Template
              </button>
              <form onSubmit={handleParseCombined} style={{ maxWidth: 500 }}>
                <div className="form-group">
                  <input type="file" className="form-input" accept=".csv,.xlsx,.xls" onChange={e => setCombinedFile(e.target.files[0])} required />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button type="submit" className="btn btn-primary btn-capsule" disabled={submitting}>
                    <Upload size={16} /> {submitting ? 'Parsing...' : 'Upload & Preview'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {deptTab === 'import' && combinedPreview && (
            <div>
              <h3 style={{ marginBottom: 'var(--space-4)' }}>Preview Import</h3>

              {/* Departments & Classes Summary */}
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <h4>Departments & Classes to Create</h4>
                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <div className="card card-sm">
                    <strong>New Departments: </strong>
                    <Badge color="green">{combinedPreview.previewDepartments.filter(d => d.isNew).length}</Badge>
                  </div>
                  <div className="card card-sm">
                    <strong>New Classes: </strong>
                    <Badge color="green">{combinedPreview.previewClasses.filter(c => c.isNew).length}</Badge>
                  </div>
                </div>
              </div>

              {/* Students Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h4 style={{ margin: 0 }}>Students</h4>
                <div>
                  <Badge color="green">{combinedPreview.previewStudents.filter(s => s.isValid).length} Valid</Badge>
                  <span style={{ margin: '0 8px' }}></span>
                  <Badge color="red">{combinedPreview.previewStudents.filter(s => !s.isValid).length} Errors</Badge>
                </div>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 1 }}>
                    <tr>
                      <th>Status</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Reg No</th>
                      <th>Dept/Sec/Year of Study</th>
                      <th>Password</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {combinedPreview.previewStudents.map((s, i) => (
                      <tr key={i} style={{ background: s.isValid ? 'transparent' : 'var(--color-danger-light)' }}>
                        <td>{s.isValid ? <CheckCircle size={16} color="var(--color-success)" /> : <AlertCircle size={16} color="var(--color-danger)" />}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.registrationNumber}</td>
                        <td>{s.department} / {s.section} / {s.academicYear}</td>
                        <td>{s.password}</td>
                        <td style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{s.errors.join(', ')}</td>
                      </tr>
                    ))}
                    {combinedPreview.previewStudents.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No students found in file.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary" onClick={handleBulkCombined} disabled={submitting}>
                  {submitting ? <LoadingSpinner size={16} /> : 'Confirm & Save All'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setCombinedPreview(null); setCombinedFile(null); }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- LEVEL 2: CLASSES / FACULTY --- */}
      {selectedDepartment && !selectedClass && (
        <div>
          <div className="tabs" style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
            <button className={`btn btn-ghost ${deptSectionTab === 'classes' ? 'active' : ''}`} onClick={() => setDeptSectionTab('classes')} style={{ borderBottom: deptSectionTab === 'classes' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}>Classes</button>
            <button className={`btn btn-ghost ${deptSectionTab === 'faculty' ? 'active' : ''}`} onClick={() => setDeptSectionTab('faculty')} style={{ borderBottom: deptSectionTab === 'faculty' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}>Faculty ({faculty.length})</button>
          </div>

          {deptSectionTab === 'classes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: 0 }}>Classes in {selectedDepartment.name}</h3>
                <button className="btn btn-primary btn-capsule" onClick={() => setShowCreateClass(!showCreateClass)}>
                  <Plus size={16} /> Create Class
                </button>
              </div>

              {showCreateClass && (
                <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
                  <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>New Class</div>
                  <ErrorMessage message={formError} />
                  <form onSubmit={handleCreateClass}>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Section</label>
                        <input type="text" className="form-input" placeholder="e.g. A" value={classForm.section} onChange={e => setClassForm({ ...classForm, section: e.target.value })} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Year of Study <span className="form-required">*</span></label>
                        <select className="form-input" value={classForm.academicYear} onChange={e => setClassForm({ ...classForm, academicYear: e.target.value })} required>
                          <option value="">Select Year of Study</option>
                          {YEAR_LEVELS.map((y) => (
                            <option key={y} value={y}>{y} Year</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? <LoadingSpinner size={16} /> : 'Save Class'}
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => setShowCreateClass(false)}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 'var(--space-4)' }}>
                {classes.filter(c => c.department === selectedDepartment.name).map(cls => (
                  <div key={cls._id} className="card card-sm" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setSelectedClass(cls)}>
                    <div>
                      <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>{cls.section}</div>
                      <div style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>Year of Study: {cls.academicYear}</div>
                    </div>
                    <button className="btn btn-sm btn-danger btn-icon" onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls._id); }} title="Delete Class">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {classes.filter(c => c.department === selectedDepartment.name).length === 0 && (
                  <div style={{ color: 'var(--color-muted)' }}>No classes found in this department.</div>
                )}
              </div>
            </div>
          )}

          {deptSectionTab === 'faculty' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Faculty in {selectedDepartment.name}</div>
              {facultyLoading ? <LoadingSpinner /> : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculty.map(member => (
                      <tr key={member._id} style={{ opacity: member.isActive ? 1 : 0.5 }}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{member.name}</div>
                        </td>
                        <td>{member.email}</td>
                        <td>
                          <Badge color={member.isActive ? 'green' : 'red'}>
                            {member.isActive ? 'Active' : 'Disabled'}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-outline btn-icon" onClick={() => openEditFacultyModal(member)} title="Edit details">
                              <Edit2 size={16} />
                            </button>
                            <button className={`btn btn-sm ${member.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleFaculty(member)}>
                              {member.isActive ? 'Disable' : 'Enable'}
                            </button>
                            <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteFacultyModal(member)} title="Delete Faculty">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {faculty.length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-muted)' }}>
                          No faculty assigned to this department yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- LEVEL 3: STUDENTS --- */}
      {selectedClass && (
        <div className="card">
          <div className="tabs" style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
            <button className={`btn btn-ghost ${studentTab === 'list' ? 'active' : ''}`} onClick={() => setStudentTab('list')} style={{ borderBottom: studentTab === 'list' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}>Students ({students.length})</button>
            <button className={`btn btn-ghost ${studentTab === 'quick' ? 'active' : ''}`} onClick={() => setStudentTab('quick')} style={{ borderBottom: studentTab === 'quick' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}>Quick Add Student</button>
            <button className={`btn btn-ghost ${studentTab === 'import' ? 'active' : ''}`} onClick={() => setStudentTab('import')} style={{ borderBottom: studentTab === 'import' ? '2px solid var(--color-primary)' : 'none', borderRadius: 0 }}>Import from Excel/CSV</button>
          </div>

          <ErrorMessage message={formError} />

          {studentTab === 'list' && (
            loading ? <LoadingSpinner /> : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Reg No</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id} style={{ opacity: student.isActive ? 1 : 0.5 }}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{student.name}</div>
                      </td>
                      <td>{student.email}</td>
                      <td>{student.registrationNumber || '-'}</td>
                      <td>
                        <Badge color={student.isActive ? 'green' : 'red'}>
                          {student.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                          <button className="btn btn-sm btn-outline btn-icon" onClick={() => openEditStudentModal(student)} title="Edit details">
                            <Edit2 size={16} />
                          </button>
                          <button className={`btn btn-sm ${student.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleStudent(student)}>
                            {student.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteStudentModal(student)} title="Delete Student">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-6)', color: 'var(--color-muted)' }}>
                        No students in this class yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )
          )}

          {studentTab === 'quick' && (
            <form onSubmit={handleQuickAddStudent} style={{ maxWidth: 500 }}>
              <div className="form-group">
                <label className="form-label">Name <span className="form-required">*</span></label>
                <input type="text" className="form-input" value={addStudentForm.name} onChange={e => setAddStudentForm({ ...addStudentForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email <span className="form-required">*</span></label>
                <input type="email" className="form-input" value={addStudentForm.email} onChange={e => setAddStudentForm({ ...addStudentForm, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Registration Number <span className="form-required">*</span></label>
                <input type="text" className="form-input" value={addStudentForm.registrationNumber} onChange={e => setAddStudentForm({ ...addStudentForm, registrationNumber: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary Password <span className="form-required">*</span></label>
                <input type="text" className="form-input" value={addStudentForm.password} onChange={e => setAddStudentForm({ ...addStudentForm, password: e.target.value })} required />
              </div>
              <button type="submit" className="btn btn-primary btn-capsule" disabled={submitting}>
                <Plus size={16} /> {submitting ? <LoadingSpinner size={16} /> : 'Add Student'}
              </button>
            </form>
          )}

          {studentTab === 'import' && !studentImportPreview && (
            <div>
              <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-4)' }}>
                Upload a CSV or Excel file to add students strictly to <strong>{selectedDepartment.name} - {selectedClass.section} (Year of Study: {selectedClass.academicYear})</strong>.
              </p>
              <button type="button" className="btn btn-outline btn-capsule" style={{ marginBottom: 'var(--space-6)' }} onClick={handleDownloadStudentTemplate}>
                <Download size={16} /> Download Template
              </button>
              <form onSubmit={handleParseStudents} style={{ maxWidth: 500 }}>
                <div className="form-group">
                  <input type="file" className="form-input" accept=".csv,.xlsx,.xls" onChange={e => setStudentImportFile(e.target.files[0])} required />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button type="submit" className="btn btn-primary btn-capsule" disabled={submitting}>
                    <Upload size={16} /> {submitting ? 'Parsing...' : 'Upload & Preview'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {studentTab === 'import' && studentImportPreview && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: 0 }}>Preview Students</h3>
                <div>
                  <Badge color="green">{studentImportPreview.filter(s => s.isValid).length} Valid</Badge>
                  <span style={{ margin: '0 8px' }}></span>
                  <Badge color="red">{studentImportPreview.filter(s => !s.isValid).length} Errors</Badge>
                </div>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 1 }}>
                    <tr>
                      <th>Status</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Reg No</th>
                      <th>Mobile</th>
                      <th>Password</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentImportPreview.map((s, i) => (
                      <tr key={i} style={{ background: s.isValid ? 'transparent' : 'var(--color-danger-light)' }}>
                        <td>{s.isValid ? <CheckCircle size={16} color="var(--color-success)" /> : <AlertCircle size={16} color="var(--color-danger)" />}</td>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.registrationNumber}</td>
                        <td>{s.mobileNumber}</td>
                        <td>{s.password}</td>
                        <td style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{s.errors.join(', ')}</td>
                      </tr>
                    ))}
                    {studentImportPreview.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No students found in file.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary" onClick={handleBulkStudents} disabled={submitting || studentImportPreview.filter(s => s.isValid).length === 0}>
                  {submitting ? <LoadingSpinner size={16} /> : 'Add Students to This Class'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setStudentImportPreview(null); setStudentImportFile(null); }}>Cancel</button>
              </div>
            </div>
          )}

        </div>
      )}

    </Layout>
  );
};

export default ManageClasses;