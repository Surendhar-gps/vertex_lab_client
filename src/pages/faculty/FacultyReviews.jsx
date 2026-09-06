import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, Search, Filter } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner, EmptyState, Avatar } from '../../components/UI';
import { facultyService } from '../../services/index';

const FacultyReviews = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ class: '', section: '', academicYear: '', registrationNumber: '' });
  const [filterOptions, setFilterOptions] = useState({ classes: [], sections: [], academicYears: [], regNumbers: [], studentsList: [] });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    facultyService.getStudentFilters()
      .then(res => setFilterOptions(res.data.data))
      .catch(console.error);
  }, []);

  const handleSearch = async () => {
    if (!filters.class && !filters.section && !filters.academicYear && !filters.registrationNumber) {
      setError('Please enter at least one filter (class, section, year of study, or registration number).');
      return;
    }
    setError('');
    setLoading(true);
    setSearched(false);
    setStudents([]);
    try {
      const params = {};
      if (filters.class) params.class = filters.class;
      if (filters.section) params.section = filters.section;
      if (filters.academicYear) params.academicYear = filters.academicYear;
      if (filters.registrationNumber) params.registrationNumber = filters.registrationNumber;

      const res = await facultyService.getStudents(params);
      setStudents(res.data.data.students || []);
      setSearched(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <Layout title="Reviews">
      <div className="page-header">
        <h1 className="page-title">Reviews</h1>
        <p className="page-subtitle">Select a student to review their experiment submissions.</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <div className="card-title"><Filter size={16} /> Filter Students</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Class</label>
            <select
              className="form-input"
              value={filters.class}
              onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))}
            >
              <option value="">All Classes</option>
              {filterOptions.classes?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Section</label>
            <select
              className="form-input"
              value={filters.section}
              onChange={(e) => setFilters((f) => ({ ...f, section: e.target.value }))}
            >
              <option value="">All Sections</option>
              {filterOptions.sections?.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Year of Study</label>
            <select
              className="form-input"
              value={filters.academicYear}
              onChange={(e) => setFilters((f) => ({ ...f, academicYear: e.target.value }))}
            >
              <option value="">All Years</option>
              {filterOptions.academicYears?.map(y => <option key={y} value={y}>{y} Year</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Registration Number</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. CSE025"
              value={filters.registrationNumber}
              onChange={(e) => setFilters((f) => ({ ...f, registrationNumber: e.target.value }))}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-3)' }}>
            <span>{error}</span>
          </div>
        )}
        <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} />Searching...</> : <><Search size={14} />Search Students</>}
        </button>
      </div>

      {/* Results */}
      {loading && <LoadingSpinner />}

      {searched && !loading && (
        <>
          <div className="section-title">
            Students ({students.length})
          </div>

          {students.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No students found"
                text="No students match the selected filters."
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {students.map((student) => (
                <div
                  key={student._id}
                  className="card card-sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/faculty/reviews/${student._id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <Avatar user={student} size={36} />
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                          {student.name || '—'}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                          {student.registrationNumber || student.email}
                          {student.class && ` · ${student.class}${student.section ? `-${student.section}` : ''}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <ChevronRight size={16} color="var(--color-muted)" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default FacultyReviews;