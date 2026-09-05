import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, BookOpen, ChevronLeft } from 'lucide-react';
import Layout from '../../components/Layout';
import ProgressCircle from '../../components/ProgressCircle';
import { LoadingSpinner, Avatar, BackLink } from '../../components/UI';
import { facultyService } from '../../services/index';

const FacultyStudentDetail = () => {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await facultyService.getStudentProgress(studentId);
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load student progress.');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [studentId]);

  if (loading) return <Layout title="Student Progress"><LoadingSpinner /></Layout>;

  if (error || !data) {
    return (
      <Layout title="Student Progress">
        <div className="alert alert-error"><span>{error || 'Student not found.'}</span></div>
      </Layout>
    );
  }

  const { student, labs } = data;

  return (
    <Layout title="Student Progress">
      {/* BackLink */}
      <BackLink to="/faculty/student-progress" label="Back to Student Progress" />

      {/* Student info */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Avatar user={student} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: 2 }}>
              {student?.name || '—'}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <span>{student?.email}</span>
              {student?.registrationNumber && <span>Reg: {student.registrationNumber}</span>}
              {student?.class && <span>{student.class}{student?.section ? `-${student.section}` : ''}</span>}
              {student?.academicYear && <span>{student.academicYear}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Labs and experiments */}
      {labs.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
            No labs assigned to this student.
          </p>
        </div>
      ) : (
        labs.map((lab) => (
          <div key={lab._id} style={{ marginBottom: 'var(--space-6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <BookOpen size={16} color="var(--color-primary)" />
                <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{lab.title}</div>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>{lab.topic}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <ProgressCircle percent={lab.progressPercentage || 0} size={64} strokeWidth={6} />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500 }}>
                    {Math.min(lab.completedExperiments || 0, lab.totalExperiments || 0)}/{lab.totalExperiments || 0} completed
                  </span>
                </div>
              </div>
            </div>

            {lab.experiments.length === 0 ? (
              <div className="card card-sm">
                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>No experiments in this lab.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {lab.experiments.map((exp) => (
                  <div key={exp._id} className="card card-sm">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-1)' }}>
                          <span style={{
                            fontSize: 'var(--text-xs)', fontWeight: 700,
                            background: 'var(--color-primary)', color: 'white',
                            padding: '1px var(--space-2)', borderRadius: 'var(--border-radius-full)',
                          }}>
                            WEEK {exp.weekNumber}
                          </span>
                          <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{exp.title}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                          <span>{exp.completedQuestions}/{exp.totalQuestions} Questions</span>
                          {exp.totalScore > 0 && (
                            <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                              Score: {exp.totalScore}/{exp.maxScore}
                            </span>
                          )}
                          {exp.finalSubmission && (
                            <span style={{
                              color: exp.finalSubmission.status === 'evaluated' ? 'var(--color-success)' : 'var(--color-warning)',
                              fontWeight: 500,
                            }}>
                              {exp.finalSubmission.status === 'evaluated' ? '✓ Evaluated' :
                               exp.finalSubmission.status === 'evaluating' ? '⟳ Evaluating' : '✓ Submitted'}
                            </span>
                          )}
                        </div>
                      </div>
                      <ProgressCircle percent={exp.percent} size={72} strokeWidth={7} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </Layout>
  );
};

export default FacultyStudentDetail;
