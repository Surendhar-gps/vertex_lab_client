import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Upload, CheckCircle, ExternalLink } from 'lucide-react';
import Layout from '../../components/Layout';
import FileUpload from '../../components/FileUpload';
import { LoadingSpinner, ErrorMessage, getStatusBadge, BackLink } from '../../components/UI';
import { problemService, submissionService } from '../../services/index';

const ProblemView = () => {
  const { problemId } = useParams();
  const [problem, setProblem] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [file, setFile] = useState(null);
  const [mcqAnswer, setMcqAnswer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      // Reset any leftover state from the previous question before loading the new one
      setFile(null);
      setError('');
      setSuccess('');
      try {
        const probRes = await problemService.getById(problemId);
        const prob = probRes.data.data.problem;
        setProblem(prob);

        const expId = prob.weeklyExperiment?._id || prob.weeklyExperiment;

        // Fetch all questions for sidebar and all submissions
        const [expRes, subRes] = await Promise.all([
          import('../../services/index').then(m => m.experimentService.getById(expId)),
          submissionService.getStudentSubmissions({ experimentId: expId }),
        ]);

        const allQs = expRes.data.data.questions || [];
        setQuestions(allQs);

        const subs = subRes.data.data.submissions || [];
        setSubmissions(subs);

        const existing = subs.find((s) => s.problem?._id === problemId || s.problem === problemId);
        setSubmission(existing || null);
        if (existing && existing.mcqAnswer !== undefined) {
          setMcqAnswer(existing.mcqAnswer);
        } else {
          setMcqAnswer(null);
        }
      } catch (err) {
        console.error('ProblemView error:', err);
        setError('Failed to load question. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [problemId]);

  const handleUpload = async () => {
    if (problem.type === 'mcq') {
      if (mcqAnswer === null) {
        setError('Please select an answer.');
        return;
      }
    } else {
      if (!file) {
        setError('Please select a .dxf or .dwg file to upload.');
        return;
      }
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      let newSub;
      if (problem.type === 'mcq') {
        const payload = {
          problem: problem._id,
          weeklyExperiment: problem.weeklyExperiment?._id || problem.weeklyExperiment,
          lab: problem.lab?._id || problem.lab,
          mcqAnswer: mcqAnswer
        };
        const res = await submissionService.submitMcq(payload);
        newSub = res.data.data.submission;
        setSuccess('✓ Answer submitted successfully.');
      } else {
        const formData = new FormData();
        formData.append('cadFile', file);
        formData.append('problem', problem._id);
        formData.append('weeklyExperiment', problem.weeklyExperiment?._id || problem.weeklyExperiment);
        formData.append('lab', problem.lab?._id || problem.lab);

        const res = await submissionService.upload(formData);
        newSub = res.data.data.submission;
        setFile(null);
        setSuccess('✓ CAD file uploaded. Return to the experiment and submit all questions when ready.');
      }
      setSubmission(newSub);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Layout title="Question"><LoadingSpinner /></Layout>;

  const hasSubmission = !!submission;
  const isEvaluated = submission && submission.status !== 'pending';

  const labId = problem?.lab?._id || problem?.lab;
  const experimentId = problem?.weeklyExperiment?._id || problem?.weeklyExperiment;

  return (
    <Layout title={problem?.title || 'Question'}>
      <BackLink to={`/student/labs/${labId}/experiments/${experimentId}`} label="Back to Weekly Experiment" />
      <div style={{ display: 'grid', gridTemplateColumns: problem?.type === 'mcq' ? '240px 1fr' : '1fr 340px', gap: 'var(--space-6)', alignItems: 'start' }}>

        {/* MCQ LEFT PANEL: Navigator */}
        {problem?.type === 'mcq' && (
          <div className="card">
            <div className="section-title" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>Question Navigator</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {questions.filter(q => q.type === 'mcq').map((q, idx) => {
                const isCurrent = q._id === problemId;
                const hasSub = submissions.find(s => s.problem?._id === q._id || s.problem === q._id);
                return (
                  <Link
                    key={q._id}
                    to={`/student/problems/${q._id}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--border-radius)',
                      background: isCurrent ? 'var(--color-primary)' : hasSub ? 'var(--color-success-light)' : 'var(--color-bg-secondary)',
                      color: isCurrent ? 'white' : hasSub ? 'var(--color-success)' : 'var(--color-text)',
                      textDecoration: 'none',
                      fontWeight: isCurrent ? 600 : 500,
                      border: isCurrent ? 'none' : '1px solid var(--color-border)'
                    }}
                  >
                    <span>Question {idx + 1}</span>
                    {hasSub && !isCurrent && <CheckCircle size={14} />}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* LEFT / CENTER: Problem details */}
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                  <span className={`badge badge-${problem?.type === 'mcq' ? 'blue' : problem?.type === 'skill_enhancer' ? 'green' : 'yellow'}`}>
                    {problem?.type === 'mcq' ? 'MCQ' : problem?.type === 'skill_enhancer' ? 'Skill Enhancer' : 'Practice by Yourself'}
                  </span>
                  <span className="badge badge-gray">{problem?.type === 'mcq' ? 'MCQ' : 'CAD'}</span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                    Marks: {problem?.marks}
                  </span>
                </div>
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-text)' }}>
                  Q{problem?.questionNumber}: {problem?.title}
                </h1>
              </div>
              {submission && getStatusBadge(submission.status)}
            </div>

            {problem?.description && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div className="section-title" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)', paddingBottom: 'var(--space-1)' }}>Description</div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  {problem.description}
                </p>
              </div>
            )}

            {problem?.instructions && (
              <div>
                <div className="section-title" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)', paddingBottom: 'var(--space-1)' }}>Instructions</div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                  {problem.instructions}
                </p>
              </div>
            )}
          </div>

          {/* Evaluation results */}
          {isEvaluated && (
            <div className="card" style={{ borderColor: 'var(--color-success)', background: 'var(--color-success-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <CheckCircle size={20} color="var(--color-success)" />
                <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Evaluation Result</span>
              </div>
              <div className="grid-2">
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Auto Score</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-text)' }}>
                    {submission.autoScore ?? '—'}/{submission.maxScore}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Final Score</div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-xl)', color: 'var(--color-success)' }}>
                    {submission.finalScore ?? submission.autoScore ?? '—'}/{submission.maxScore}
                  </div>
                </div>
              </div>
              {submission.facultyComment && (
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'white', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginBottom: 4 }}>Faculty Comment</div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>{submission.facultyComment}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Upload / MCQ Options panel */}
        {problem?.type === 'mcq' ? (
          <div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Select Answer</div>
              <ErrorMessage message={error} />
              {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}><span>{success}</span></div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {problem.mcqOptions && problem.mcqOptions.map((opt, idx) => (
                  <label key={idx} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                    padding: 'var(--space-3)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--border-radius)', cursor: isEvaluated ? 'default' : 'pointer',
                    background: mcqAnswer === idx ? 'var(--color-primary-light)' : 'transparent',
                    borderColor: mcqAnswer === idx ? 'var(--color-primary)' : 'var(--color-border)',
                    opacity: isEvaluated && mcqAnswer !== idx ? 0.6 : 1
                  }}>
                    <input
                      type="radio"
                      name="mcqAnswer"
                      checked={mcqAnswer === idx}
                      onChange={() => setMcqAnswer(idx)}
                      disabled={isEvaluated}
                      style={{ transform: 'scale(1.2)', marginTop: 4, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, lineHeight: 1.5 }}>
                      {opt.text}
                    </span>
                  </label>
                ))}
              </div>

              {!isEvaluated && (
                <button
                  className="btn btn-primary w-full"
                  onClick={handleUpload}
                  disabled={mcqAnswer === null || uploading}
                  style={{ marginTop: 'var(--space-4)' }}
                >
                  {uploading ? (
                    <><span className="spinner" style={{ width: 14, height: 14 }} />Submitting...</>
                  ) : (
                    <><Upload size={14} />{hasSubmission ? 'Update Answer' : 'Save Answer'}</>
                  )}
                </button>
              )}
              {hasSubmission && !isEvaluated && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center', marginTop: 'var(--space-3)' }}>
                  Your answer is saved. Finalize it by submitting the MCQ section on the Weekly Experiment page.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Submit CAD File</div>

              <ErrorMessage message={error} />
              {success && <div className="alert alert-success"><span>{success}</span></div>}

              {/* Current submission */}
              {hasSubmission && (
                <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginBottom: 4 }}>Current Submission</div>
                  <a
                    href={submission.cadFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}
                  >
                    <ExternalLink size={12} />
                    View uploaded file
                  </a>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: 4 }}>
                    Uploaded: {new Date(submission.uploadedAt).toLocaleString()}
                  </div>
                </div>
              )}

              <FileUpload
                key={problemId}
                onFileSelect={setFile}
                disabled={uploading}
              />

              <button
                className="btn btn-primary w-full"
                onClick={handleUpload}
                disabled={!file || uploading}
                style={{ marginTop: 'var(--space-4)' }}
              >
                {uploading ? (
                  <><span className="spinner" style={{ width: 14, height: 14 }} />Submitting...</>
                ) : (
                  <><Upload size={14} />{hasSubmission ? 'Resubmit' : 'Submit'}</>
                )}
              </button>

              {hasSubmission && (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center', marginTop: 'var(--space-3)' }}>
                  Resubmitting will replace your previous upload and trigger re-evaluation.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProblemView;