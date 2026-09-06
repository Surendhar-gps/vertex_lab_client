import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronLeft } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner, Avatar, BackLink } from '../../components/UI';
import { facultyService } from '../../services/index';

const FacultyReviewDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await facultyService.getStudentProgress(studentId);
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load student data.');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [studentId]);

  if (loading) return <Layout title="Review Student"><LoadingSpinner /></Layout>;

  if (error || !data) {
    return (
      <Layout title="Review Student">
        <div className="alert alert-error"><span>{error || 'Student not found.'}</span></div>
      </Layout>
    );
  }

  const { student, labs } = data;

  return (
    <Layout title="Review Student">
      <BackLink to="/faculty/reviews" label="Back to Reviews Hub" />

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <BookOpen size={16} color="var(--color-primary)" />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{lab.title}</div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>{lab.topic}</span>
            </div>

            {lab.experiments.length === 0 ? (
              <div className="card card-sm">
                <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>No experiments in this lab.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {lab.experiments.map((exp) => (
                  <div key={exp._id} className="card card-sm">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                          <span>{exp.completedQuestions}/{exp.totalQuestions} Questions Submitted</span>
                          {exp.finalSubmission && (
                            <span style={{
                              color: exp.finalSubmission.status === 'evaluated' ? 'var(--color-success)' :
                                exp.finalSubmission.status === 'reviewed' ? 'var(--color-success)' : 'var(--color-warning)',
                              fontWeight: 500,
                            }}>
                              {exp.finalSubmission.status === 'reviewed' ? '✓ Reviewed' :
                                exp.finalSubmission.status === 'evaluated' ? '⟳ Needs Review' :
                                  exp.finalSubmission.status === 'evaluating' ? '⟳ Evaluating' : '✓ Submitted'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Per-question review buttons — each links to that question's own
                          Submission._id, which is what the backend's GET /submissions/:id
                          actually looks up. (Previously this linked to exp.finalSubmission._id,
                          which is an ExperimentSubmission._id from a different collection,
                          so the review page always showed "Submission not found".) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', alignItems: 'flex-end' }}>
                        {exp.submissions && exp.submissions.length > 0 ? (
                          exp.submissions.map((sub) => (
                            <button
                              key={sub._id}
                              className="btn btn-outline btn-sm"
                              onClick={() => navigate(`/faculty/review/${sub._id}`)}
                            >
                              Review {sub.problem?.questionNumber ? `Q${sub.problem.questionNumber}` : ''}
                            </button>
                          ))
                        ) : (
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                            No question submissions yet.
                          </span>
                        )}
                      </div>
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

export default FacultyReviewDetail;