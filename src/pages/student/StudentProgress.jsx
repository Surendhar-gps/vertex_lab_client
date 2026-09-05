import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import ProgressBar from '../../components/ProgressBar';
import { LoadingSpinner, getStatusBadge } from '../../components/UI';
import { labService, submissionService } from '../../services/index';

const StudentProgress = () => {
  const [labs, setLabs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([labService.getLabs(), submissionService.getStudentSubmissions({})])
      .then(([labsRes, subRes]) => {
        setLabs(labsRes.data.data.labs || []);
        setSubmissions(subRes.data.data.submissions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="My Progress"><LoadingSpinner /></Layout>;

  const totalScore = submissions.reduce((acc, s) => acc + (s.finalScore || s.autoScore || 0), 0);
  const maxScore = submissions.reduce((acc, s) => acc + (s.maxScore || 10), 0);
  const overallPercent = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  return (
    <Layout title="My Progress">
      <div className="page-header">
        <h1 className="page-title">My Progress</h1>
        <p className="page-subtitle">Track your submissions and scores across all labs</p>
      </div>

      {/* Overall progress bar */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-1)' }}>
            {totalScore.toFixed(1)} / {maxScore}
          </div>
          <div style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>Total Score Across All Labs</div>
          <ProgressBar percent={overallPercent} label="Overall Score" height={14} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-5)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Submissions</div>
              <div style={{ fontWeight: 600 }}>{submissions.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Evaluated</div>
              <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                {submissions.filter((s) => s.status !== 'pending').length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Reviewed</div>
              <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                {submissions.filter((s) => s.status === 'reviewed').length}
              </div>
            </div>
        </div>
      </div>

      {/* Per-submission table */}
      <div className="section-title">Submission History</div>
      {submissions.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
            No submissions yet. Start by opening a lab and uploading CAD files.
          </p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Experiment</th>
                <th>Auto Score</th>
                <th>Final Score</th>
                <th>Status</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>Q{sub.problem?.questionNumber}: {sub.problem?.title}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 'var(--text-xs)' }}>
                      Week {sub.weeklyExperiment?.weekNumber}: {sub.weeklyExperiment?.title}
                    </div>
                  </td>
                  <td>{sub.autoScore != null ? `${sub.autoScore}/${sub.maxScore}` : '—'}</td>
                  <td style={{ color: 'var(--color-success)', fontWeight: sub.status === 'reviewed' ? 600 : 400 }}>
                    {sub.finalScore != null ? `${sub.finalScore}/${sub.maxScore}` : '—'}
                  </td>
                  <td>{getStatusBadge(sub.status)}</td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                    {new Date(sub.uploadedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default StudentProgress;
