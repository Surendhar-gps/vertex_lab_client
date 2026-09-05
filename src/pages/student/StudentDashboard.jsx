import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FlaskConical, CheckSquare, TrendingUp } from 'lucide-react';
import Layout from '../../components/Layout';
import ProgressBar from '../../components/ProgressBar';
import ProgressCircle from '../../components/ProgressCircle';
import { LoadingSpinner, Avatar } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { labService, submissionService } from '../../services/index';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [labsRes, subRes] = await Promise.all([
          labService.getLabs(),
          submissionService.getStudentSubmissions(),
        ]);
        setLabs(labsRes.data.data.labs || []);
        setSubmissions(subRes.data.data.submissions || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const evaluated = submissions.filter((s) => s.status !== 'pending').length;
  const totalScore = submissions.reduce((acc, s) => acc + (s.finalScore || s.autoScore || 0), 0);
  const maxScore = submissions.reduce((acc, s) => acc + (s.maxScore || 10), 0);
  const overallScorePct = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const submissionPct = submissions.length > 0
    ? Math.round((evaluated / submissions.length) * 100) : 0;

  const stats = [
    { label: 'Assigned Labs', value: labs.length, icon: BookOpen, color: 'var(--color-primary)' },
    { label: 'Submissions', value: submissions.length, icon: FlaskConical, color: '#7c3aed' },
    { label: 'Evaluated', value: evaluated, icon: CheckSquare, color: 'var(--color-success)' },
    { label: 'Overall Score', value: `${totalScore.toFixed(1)} / ${maxScore}`, icon: TrendingUp, color: 'var(--color-warning)' },
  ];

  if (loading) return <Layout title="Dashboard"><LoadingSpinner /></Layout>;

  return (
    <Layout title="Student Dashboard">
      {/* Welcome */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Avatar user={user} size={64} />
        <div>
          <h1 className="page-title">
            Welcome, {user?.name || user?.email?.split('@')[0]} 👋
          </h1>
          <p className="page-subtitle">
            {user?.registrationNumber && `Reg No: ${user.registrationNumber} · `}
            {user?.class && `${user.class}`}
            {user?.section && ` Section ${user.section}`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="stat-card-label">{label}</div>
                <div className="stat-card-value">{value}</div>
              </div>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 'var(--border-radius)',
                  background: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon size={18} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Progress Widget — square box, replaces the old Assigned Labs + Progress page */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header">
          <div className="card-title">My Progress</div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
            {totalScore.toFixed(1)} / {maxScore} pts
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4) 0' }}>
          {(() => {
            const totalExp = labs.reduce((acc, lab) => acc + (lab.totalExperiments || 0), 0);
            const compExp = labs.reduce((acc, lab) => acc + (lab.completedExperiments || 0), 0);
            const safeComp = Math.min(compExp, totalExp);
            const pct = totalExp > 0 ? Math.round((safeComp / totalExp) * 100) : 0;
            return (
              <>
                <ProgressCircle percent={pct} size={120} strokeWidth={10} />
                <div style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                  {safeComp} of {totalExp} weeks completed
                </div>
              </>
            );
          })()}
        </div>

        {submissions.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-6)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Total Submissions</div>
              <div style={{ fontWeight: 600 }}>{submissions.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Evaluated</div>
              <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{evaluated}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Reviewed</div>
              <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                {submissions.filter((s) => s.status === 'reviewed').length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick lab access via My Labs nav */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Quick Access</div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/student/labs')}>
            View All Labs
          </button>
        </div>
        {labs.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
            No labs assigned yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {labs.slice(0, 3).map((lab) => (
              <div
                key={lab._id}
                onClick={() => navigate(`/student/labs/${lab._id}`)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-3) var(--space-4)',
                  border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  transition: 'background var(--transition)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{lab.title}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                    {lab.topic} · {lab.totalExperiments || 0} weeks
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>
                    {lab.completedExperiments || 0}/{lab.totalExperiments || 0} completed
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 500 }}>Open →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StudentDashboard;
