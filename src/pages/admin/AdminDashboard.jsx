import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, FileText, FlaskConical } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner } from '../../components/UI';
import { adminService } from '../../services/index';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminService.getStats()
      .then((res) => setStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
      { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'var(--color-primary)', href: '/admin/students' },
      { label: 'Total Faculty', value: stats.totalFaculty, icon: FileText, color: '#7c3aed', href: '/admin/faculty' },
      { label: 'Total Classes', value: stats.totalClasses, icon: BookOpen, color: 'var(--color-warning)', href: '/admin/classes' },
    ]
    : [];

  if (loading) return <Layout title="Admin Dashboard"><LoadingSpinner /></Layout>;

  return (
    <Layout title="Admin Dashboard">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Platform overview and user management</p>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {cards.map(({ label, value, icon: Icon, color, href }) => (
          <div
            key={label}
            className="stat-card"
            style={{ cursor: href !== '#' ? 'pointer' : 'default' }}
            onClick={() => href !== '#' && navigate(href)}
          >
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

      {/* System Info */}
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-header">
          <div className="card-title">System Info</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted)' }}>Platform</span>
            <span>VERTEX LAB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted)' }}>Evaluation Mode</span>
            <span className="badge badge-yellow">Mock (Development)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--color-muted)' }}>Version</span>
            <span>1.0.0</span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
