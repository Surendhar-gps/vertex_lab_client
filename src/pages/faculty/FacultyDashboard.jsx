import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, Users, BookOpen, Clock, CheckSquare } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner } from '../../components/UI';
import { labService, facultyService } from '../../services/index';

const FacultyDashboard = () => {
  const [labs, setLabs] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({ totalLabs: 0, studentsSubmitted: 0, studentsCompleted: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      labService.getLabs(),
      facultyService.getDashboardStats(),
    ])
      .then(([labsRes, statsRes]) => {
        setLabs(labsRes.data.data.labs || []);
        setDashboardStats(statsRes.data.data || { totalLabs: 0, studentsSubmitted: 0, studentsCompleted: 0 });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Labs', value: dashboardStats.totalLabs, icon: FlaskConical, color: 'var(--color-primary)' },
  ];

  if (loading) return <Layout title="Faculty Dashboard"><LoadingSpinner /></Layout>;

  return (
    <Layout title="Faculty Dashboard">
      <div className="page-header">
        <h1 className="page-title">Faculty Dashboard</h1>
        <p className="page-subtitle">Overview of your labs, experiments, and student submissions</p>
      </div>

      <div className="stat-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-card-label">{label}</div>
                <div className="stat-card-value">{value}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--border-radius)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Labs — read-only summary, no Create Lab button */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <div className="card-title">My Labs</div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/faculty/labs')}>
            Go to Labs
          </button>
        </div>
        {labs.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 'var(--space-6) 0' }}>
            No labs created yet. Go to <button className="btn btn-ghost btn-sm" onClick={() => navigate('/faculty/labs')}>Labs</button> to create one.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Lab Title</th>
                  <th>Topic</th>
                  <th>Class</th>
                  <th>Assigned</th>
                  <th>Submitted</th>
                  <th>Completed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {labs.map((lab) => (
                  <tr key={lab._id}>
                    <td style={{ fontWeight: 500 }}>{lab.title}</td>
                    <td>{lab.topic}</td>
                    <td>{lab.class} — {lab.section}</td>
                    <td>{lab.assignedStudents ?? 0}</td>
                    <td>{lab.studentsSubmitted ?? 0}</td>
                    <td>{lab.studentsCompleted ?? 0}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/faculty/labs/${lab._id}`)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </Layout>
  );
};

export default FacultyDashboard;
