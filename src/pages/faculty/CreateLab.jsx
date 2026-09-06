import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import { ErrorMessage, LoadingSpinner } from '../../components/UI';
import { labService, adminService } from '../../services/index';

const CreateLab = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    topic: '',
    class: '',
    section: '',
    academicYear: '', // NOTE: kept as-is for backend compatibility.
    // Represents "Year of Study" (I/II/III/IV),
    // matches admin's ManageClasses.jsx naming.
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminService.getClasses()
      .then((res) => {
        const data = res.data.data.classes || [];
        console.log('[DEBUG] CreateLab fetched classes:', data);
        setClasses(data);
      })
      .catch(() => { })
      .finally(() => setClassesLoading(false));
  }, []);

  // Derived dropdown options
  const departments = [...new Set(classes.map((c) => c.department))].sort();
  const sectionsForDept = form.class
    ? classes.filter((c) => c.department === form.class)
    : [];
  const yearsForDeptSection = (form.class && form.section)
    ? classes.filter((c) => c.department === form.class && c.section === form.section)
    : [];

  // When class changes, reset section/year
  const handleClassChange = (dept) => {
    setForm((p) => ({
      ...p,
      class: dept,
      section: '',
      academicYear: '',
    }));
  };

  // When section changes, reset year
  const handleSectionChange = (sec) => {
    setForm((p) => ({ ...p, section: sec, academicYear: '' }));
  };

  // When year changes, just store the selected value
  const handleYearChange = (year) => {
    setForm((p) => ({
      ...p,
      academicYear: year,
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Lab title is required.';
    if (!form.topic.trim()) e.topic = 'Topic is required.';
    if (!form.class.trim()) e.class = 'Class is required.';
    if (!form.section.trim()) e.section = 'Section is required.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setApiError('');

    try {
      const res = await labService.createLab(form);
      const lab = res.data.data.lab;
      navigate(`/faculty/labs/${lab._id}`);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create lab.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <Layout title="Create Lab">
      <div className="page-header">
        <h1 className="page-title">Create New Lab</h1>
        <p className="page-subtitle">Set up a lab and assign it to a class section</p>
      </div>

      {/* Centered form */}
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="card">
          <ErrorMessage message={apiError} />

          {classesLoading ? (
            <LoadingSpinner />
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Lab Title <span className="form-required">*</span></label>
                <input
                  type="text"
                  className={`form-input${errors.title ? ' error' : ''}`}
                  placeholder="e.g., Engineering Graphics Lab"
                  value={form.title}
                  onChange={handleChange('title')}
                />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Topic <span className="form-required">*</span></label>
                <input
                  type="text"
                  className={`form-input${errors.topic ? ' error' : ''}`}
                  placeholder="e.g., CAD & Engineering Drawing"
                  value={form.topic}
                  onChange={handleChange('topic')}
                />
                {errors.topic && <span className="form-error">{errors.topic}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Brief description of this lab..."
                  value={form.description}
                  onChange={handleChange('description')}
                  rows={3}
                />
              </div>

              <div className="divider" />
              <div className="section-title" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>Class Assignment</div>

              {classes.length === 0 ? (
                <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
                  <span>No classes have been created by admin yet. Ask your administrator to set up class/section records first.</span>
                </div>
              ) : (
                <>
                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label">Class / Department <span className="form-required">*</span></label>
                      <select
                        className={`form-select${errors.class ? ' error' : ''}`}
                        value={form.class}
                        onChange={(e) => handleClassChange(e.target.value)}
                      >
                        <option value="">Select class...</option>
                        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {errors.class && <span className="form-error">{errors.class}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Section <span className="form-required">*</span></label>
                      <select
                        className={`form-select${errors.section ? ' error' : ''}`}
                        value={form.section}
                        onChange={(e) => handleSectionChange(e.target.value)}
                        disabled={!form.class}
                      >
                        <option value="">Select section...</option>
                        {sectionsForDept.map((c) => <option key={c._id} value={c.section}>{c.section}</option>)}
                      </select>
                      {errors.section && <span className="form-error">{errors.section}</span>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Year of Study</label>
                    <select
                      className="form-select"
                      value={form.academicYear}
                      onChange={(e) => handleYearChange(e.target.value)}
                      disabled={!form.section}
                    >
                      <option value="">Select year of study...</option>
                      {yearsForDeptSection.map((c) => <option key={c._id} value={c.academicYear}>{c.academicYear} Year</option>)}
                    </select>
                  </div>

                </>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Create Lab'}
                </button>
                <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate('/faculty/labs')}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CreateLab;