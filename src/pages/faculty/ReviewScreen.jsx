import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ExternalLink, MessageSquare, ClipboardList } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner, ErrorMessage, getStatusBadge } from '../../components/UI';
import { submissionService, labService, experimentService } from '../../services/index';

// ─── Single-Submission Review (legacy per-submission view) ────────────────────

const SingleReview = ({ submissionId }) => {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalScore, setFinalScore] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    submissionService.getById(submissionId)
      .then((res) => {
        const sub = res.data.data.submission;
        setSubmission(sub);
        setFinalScore(sub.finalScore ?? sub.autoScore ?? '');
        setComment(sub.facultyComment || '');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load submission.'))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const handleAcceptAutoScore = async () => {
    setSaving(true); setError('');
    try {
      const res = await submissionService.review(submissionId, { acceptAutoScore: true, facultyComment: comment });
      setSubmission(res.data.data.submission);
      setSuccess('Auto score accepted. Status set to reviewed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save review.');
    } finally { setSaving(false); }
  };

  const handleOverride = async () => {
    if (finalScore === '' || isNaN(Number(finalScore))) { setError('Please enter a valid score.'); return; }
    setSaving(true); setError('');
    try {
      const res = await submissionService.review(submissionId, { finalScore: Number(finalScore), facultyComment: comment });
      setSubmission(res.data.data.submission);
      setSuccess('Score overridden. Status set to reviewed.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save review.');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <div className="breadcrumb">
        <Link to="/faculty/student-progress">Student Progress</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Review Submission</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Manual Review</h1>
        <p className="page-subtitle">Review the student's submission and optionally override the score</p>
      </div>

      <ErrorMessage message={error} />
      {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}><span>{success}</span></div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Student Information</div>
            <div className="grid-2">
              {[
                { label: 'Name', value: submission?.student?.name },
                { label: 'Reg No.', value: submission?.student?.registrationNumber || '—' },
                { label: 'Email', value: submission?.student?.email },
                { label: 'Section', value: `${submission?.student?.class || ''} ${submission?.student?.section || ''}` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {submission?.problem && (
            <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Question</div>
              <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                Q{submission.problem.questionNumber}: {submission.problem.title}
              </div>
              {submission.problem.description && (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
                  {submission.problem.description}
                </p>
              )}
              {submission.problem.answerKeyFileUrl && (
                <a href={submission.problem.answerKeyFileUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
                  <ExternalLink size={12} /> View Answer Key
                </a>
              )}
            </div>
          )}

          <div className="card">
            <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Student Submission</div>
            <a href={submission?.cadFileUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <ExternalLink size={12} /> View Student CAD File
            </a>
            <div style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
              Uploaded: {submission?.uploadedAt ? new Date(submission.uploadedAt).toLocaleString() : '—'}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Evaluation</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginBottom: 4 }}>Auto Score</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                {submission?.autoScore != null ? submission.autoScore : '—'}/{submission?.maxScore}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', fontStyle: 'italic' }}>[Never changed]</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginBottom: 4 }}>Final Score</div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-success)' }}>
                {submission?.finalScore != null ? submission.finalScore : '—'}/{submission?.maxScore}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>Current Status:</span>
              {submission && getStatusBadge(submission.status)}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Override Final Score</label>
            <input type="number" className="form-input" min={0} max={submission?.maxScore}
              value={finalScore} onChange={(e) => setFinalScore(e.target.value)}
              placeholder={`0 – ${submission?.maxScore}`} />
            <span className="form-hint">Enter a new score to override. Auto score will not be changed.</span>
          </div>

          <div className="form-group">
            <label className="form-label"><MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />Faculty Comment</label>
            <textarea className="form-textarea" rows={3} value={comment}
              onChange={(e) => setComment(e.target.value)} placeholder="Optional feedback for the student..." />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-lg w-full" onClick={handleOverride} disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Override & Mark Reviewed'}
            </button>
            <button className="btn btn-outline btn-lg w-full" onClick={handleAcceptAutoScore} disabled={saving}>
              <CheckCircle size={14} /> Accept Auto Score
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─── Manual Review Hub (cascade: Class → Experiment → Student → Questions) ───

const ManualReviewHub = () => {
  const [labs, setLabs] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [scores, setScores] = useState({}); // { [problemId]: { score, comment } }

  const [selectedLab, setSelectedLab] = useState('');
  const [selectedExp, setSelectedExp] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  const [loadingLabs, setLoadingLabs] = useState(true);
  const [loadingExp, setLoadingExp] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load labs on mount
  useEffect(() => {
    labService.getLabs()
      .then((res) => setLabs(res.data.data.labs || []))
      .catch(console.error)
      .finally(() => setLoadingLabs(false));
  }, []);

  // Load experiments when lab changes
  useEffect(() => {
    if (!selectedLab) { setExperiments([]); setSelectedExp(''); return; }
    setLoadingExp(true);
    labService.getExperiments(selectedLab)
      .then((res) => setExperiments(res.data.data.experiments || []))
      .catch(console.error)
      .finally(() => setLoadingExp(false));
    setSelectedExp('');
    setSelectedStudent('');
    setStudents([]);
    setQuestions([]);
    setScores({});
  }, [selectedLab]);

  // Load students + questions when experiment changes
  useEffect(() => {
    if (!selectedExp) { setStudents([]); setSelectedStudent(''); return; }
    setLoadingStudents(true);
    Promise.all([
      submissionService.getStudentsForExperiment(selectedExp),
      experimentService.getById(selectedExp),
    ])
      .then(([studRes, expRes]) => {
        setStudents(studRes.data.data.students || []);
        setQuestions(expRes.data.data.questions || []);
      })
      .catch(console.error)
      .finally(() => setLoadingStudents(false));
    setSelectedStudent('');
    setScores({});
  }, [selectedExp]);

  // Pre-fill scores when student is selected
  useEffect(() => {
    if (!selectedStudent) { setScores({}); return; }
    const studentData = students.find((s) => s.student._id === selectedStudent);
    if (!studentData) { setScores({}); return; }
    const prefilled = {};
    for (const sub of studentData.submissions) {
      const pid = sub.problem?._id;
      if (pid) {
        prefilled[pid] = {
          score: sub.finalScore ?? sub.autoScore ?? '',
          comment: sub.facultyComment || '',
        };
      }
    }
    setScores(prefilled);
  }, [selectedStudent, students]);

  const handleScoreChange = (problemId, field, value) => {
    setScores((p) => ({ ...p, [problemId]: { ...(p[problemId] || {}), [field]: value } }));
  };

  const handleSave = async () => {
    if (!selectedStudent || !selectedExp) { setError('Please select a student and experiment.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const scoresArr = questions.map((q) => ({
        problemId: q._id,
        score: scores[q._id]?.score ?? '',
        comment: scores[q._id]?.comment || '',
      })).filter((s) => s.score !== '' && s.score !== undefined);

      await submissionService.manualReviewBulk({
        studentId: selectedStudent,
        experimentId: selectedExp,
        scores: scoresArr,
      });
      setSuccess('Marks saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  const selectedStudentData = students.find((s) => s.student._id === selectedStudent);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Manual Review</h1>
        <p className="page-subtitle">Select a lab, experiment, and student to enter or override marks</p>
      </div>

      <ErrorMessage message={error} />
      {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}><span>{success}</span></div>}

      {/* Cascade selectors */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Select Class &amp; Experiment</div>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Lab</label>
            {loadingLabs ? <LoadingSpinner /> : (
              <select className="form-select" value={selectedLab} onChange={(e) => setSelectedLab(e.target.value)}>
                <option value="">Select lab...</option>
                {labs.map((lab) => (
                  <option key={lab._id} value={lab._id}>
                    {lab.title} ({lab.class} – {lab.section})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Experiment (Week)</label>
            {loadingExp ? <LoadingSpinner /> : (
              <select className="form-select" value={selectedExp} onChange={(e) => setSelectedExp(e.target.value)} disabled={!selectedLab}>
                <option value="">Select experiment...</option>
                {experiments.map((exp) => (
                  <option key={exp._id} value={exp._id}>Week {exp.weekNumber}: {exp.title}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {selectedExp && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Student</label>
            {loadingStudents ? <LoadingSpinner /> : (
              students.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
                  No students have submitted for this experiment yet.
                </p>
              ) : (
                <select className="form-select" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                  <option value="">Select student...</option>
                  {students.map(({ student }) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.registrationNumber || student.email})
                    </option>
                  ))}
                </select>
              )
            )}
          </div>
        )}
      </div>

      {/* Per-question marks entry */}
      {selectedStudent && questions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Enter Marks</div>
              {selectedStudentData && (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', marginTop: 2 }}>
                  {selectedStudentData.student.name} · {selectedStudentData.student.registrationNumber || '—'}
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save Marks'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {questions.map((q) => {
              const qScore = scores[q._id] || {};
              const studentSub = selectedStudentData?.submissions?.find(
                (s) => s.problem?._id === q._id || s.problem === q._id
              );

              return (
                <div key={q._id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', background: 'var(--color-bg-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 4 }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, background: 'var(--color-bg-tertiary)', color: 'var(--color-muted)', padding: '1px 8px', borderRadius: 'var(--border-radius-full)' }}>
                          Q{q.questionNumber}
                        </span>
                        <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{q.title}</span>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                        Max marks: {q.marks}
                        {studentSub && ` · Auto score: ${studentSub.autoScore ?? '—'}`}
                        {studentSub?.cadFileUrl && (
                          <> · <a href={studentSub.cadFileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>View submission</a></>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexShrink: 0 }}>
                      <div>
                        <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', display: 'block', marginBottom: 2 }}>Mark</label>
                        <input
                          type="number"
                          className="form-input"
                          style={{ width: 90 }}
                          min={0}
                          max={q.marks}
                          value={qScore.score ?? ''}
                          placeholder={`0–${q.marks}`}
                          onChange={(e) => handleScoreChange(q._id, 'score', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Comment (optional)</label>
                    <textarea
                      className="form-textarea"
                      rows={1}
                      style={{ minHeight: 40 }}
                      value={qScore.comment || ''}
                      onChange={(e) => handleScoreChange(q._id, 'comment', e.target.value)}
                      placeholder="Faculty feedback..."
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Save All Marks'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Router: show hub or single-submission review based on route params ───────

const ReviewScreen = () => {
  const { submissionId } = useParams();

  return (
    <Layout title="Manual Review">
      {submissionId ? (
        <SingleReview submissionId={submissionId} />
      ) : (
        <ManualReviewHub />
      )}
    </Layout>
  );
};

export default ReviewScreen;
