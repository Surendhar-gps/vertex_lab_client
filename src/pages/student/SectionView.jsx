import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, CheckCircle2, Send, UploadCloud, Info } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner, BackLink } from '../../components/UI';
import { experimentService, submissionService } from '../../services/index';
import FileUpload from '../../components/FileUpload';

const categoryTitles = {
  'mcq': 'MCQ',
  'skill_enhancer': 'Skill Enhancer',
  'practice_by_yourself': 'Practice by Yourself'
};

const getStatusField = (type) => {
  if (type === 'mcq') return 'mcqStatus';
  if (type === 'skill_enhancer') return 'skillEnhancerStatus';
  return 'practiceStatus';
};

const SectionView = () => {
  const { labId, experimentId, sectionId } = useParams();
  const navigate = useNavigate();

  const [experiment, setExperiment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [finalSubmission, setFinalSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  // States for UI
  const [activeQuestionId, setActiveQuestionId] = useState(null);

  // MCQ specific
  const [mcqStarted, setMcqStarted] = useState(false);
  const [mcqAnswers, setMcqAnswers] = useState({}); // { problemId: optionIdx }

  // Global submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const isMcq = sectionId === 'mcq';

  const fetchData = useCallback(async () => {
    try {
      const [expRes, subRes] = await Promise.all([
        experimentService.getProgress(experimentId),
        submissionService.getStudentSubmissions({ experimentId }),
      ]);
      const data = expRes.data.data;

      const secQs = (data.questions || []).filter(q => q.type === sectionId);
      setQuestions(secQs);

      if (secQs.length > 0 && !activeQuestionId) {
        setActiveQuestionId(secQs[0]._id);
      }

      setFinalSubmission(data.finalSubmission || null);

      const secSubs = (subRes.data.data.submissions || []).filter(s => s.problem?.type === sectionId);
      setSubmissions(secSubs);

      // Get experiment metadata
      const metaRes = await experimentService.getById(experimentId);
      setExperiment(metaRes.data.data.experiment);
    } catch (err) {
      console.error('SectionView error:', err);
    } finally {
      setLoading(false);
    }
  }, [experimentId, sectionId, activeQuestionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Layout title="Section"><LoadingSpinner /></Layout>;

  const sectionStatus = finalSubmission?.[getStatusField(sectionId)] || 'not_submitted';
  const isLocked = sectionStatus === 'submitted' || sectionStatus === 'evaluating' || sectionStatus === 'evaluated';

  // Check if everything is answered
  let allAnswered = false;
  if (isMcq) {
    allAnswered = questions.length > 0 && questions.every(q => mcqAnswers[q._id] !== undefined);
  } else {
    const uploadedIds = new Set(submissions.map(s => s.problem._id || s.problem));
    allAnswered = questions.length > 0 && questions.every(q => uploadedIds.has(q._id));
  }

  // Section-level score summary (only meaningful once evaluated)
  const sectionTotalScored = submissions.reduce((acc, s) => acc + (s.finalScore || 0), 0);
  const sectionTotalMax = questions.reduce((acc, q) => acc + (q.marks || 0), 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      if (isMcq) {
        await experimentService.submitSection(experimentId, sectionId, { answers: mcqAnswers });
      } else {
        await experimentService.submitSection(experimentId, sectionId);
      }
      setShowSubmitConfirm(false);
      await fetchData(); // Refresh statuses
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCadUpload = async (file, qId) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('cadFile', file);
      formData.append('problem', qId);
      formData.append('weeklyExperiment', experimentId);
      formData.append('lab', labId);

      await submissionService.upload(formData);
      await fetchData(); // refresh submission state
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    }
  };

  const activeQuestion = questions.find(q => q._id === activeQuestionId);

  // --- MCQ START SCREEN ---
  if (isMcq && !mcqStarted && !isLocked) {
    return (
      <Layout title={categoryTitles[sectionId]}>
        <BackLink to={`/student/labs/${labId}/experiments/${experimentId}`} label="Back to Weekly Experiment" />
        <div style={{ maxWidth: 600, margin: 'var(--space-8) auto' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ width: 64, height: 64, borderRadius: 'var(--border-radius-full)', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
              <Info size={32} color="var(--color-primary)" />
            </div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{categoryTitles[sectionId]}</h1>
            <p style={{ fontSize: 'var(--text-md)', color: 'var(--color-muted)', marginBottom: 'var(--space-6)' }}>
              {questions.length} Questions • 1 mark per question
            </p>

            <div style={{ textAlign: 'left', background: 'var(--color-bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Instructions:</h3>
              <ul style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', paddingLeft: 'var(--space-4)', margin: 0, lineHeight: 1.6 }}>
                <li>Answer all questions.</li>
                <li>You may move between questions freely.</li>
                <li>Your answers will be evaluated only when you submit the entire section.</li>
                <li>Once submitted, answers cannot be changed.</li>
              </ul>
            </div>

            <button className="btn btn-primary btn-block" onClick={() => setMcqStarted(true)} style={{ padding: 'var(--space-3)' }}>
              Start MCQ
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={categoryTitles[sectionId]}>
      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'var(--space-4)' }} onClick={() => setShowSubmitConfirm(false)}>
          <div className="card" style={{ maxWidth: 420, width: '100%', padding: 'var(--space-8)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', marginBottom: 'var(--space-5)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 'var(--border-radius)', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Send size={18} color="var(--color-primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--text-lg)', color: 'var(--color-text)', marginBottom: 4 }}>
                  Submit {categoryTitles[sectionId]}?
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', lineHeight: 1.6 }}>
                  You have completed all {questions.length} questions. Once submitted, your work will be evaluated and cannot be changed.
                </p>
                {submitError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginTop: 8 }}>{submitError}</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowSubmitConfirm(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BackLink to={`/student/labs/${labId}/experiments/${experimentId}`} label="Back to Weekly Experiment" />

      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <h1 className="page-title">{categoryTitles[sectionId]}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 8 }}>
          <span className="badge badge-gray">{questions.length} Questions</span>
          {sectionStatus === 'evaluated' ? (
            <>
              <span className="badge badge-green">Evaluated</span>
              <span className="badge badge-gray">{sectionTotalScored} / {sectionTotalMax} Marks</span>
            </>
          ) : sectionStatus === 'evaluating' ? (
            <span className="badge badge-yellow">Evaluating...</span>
          ) : sectionStatus === 'submitted' ? (
            <span className="badge badge-blue">Submitted ✓</span>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start' }}>

        {/* LEFT NAVIGATOR */}
        <div className="card" style={{ flex: '0 0 250px', padding: 'var(--space-2)' }}>
          <div style={{ padding: 'var(--space-2) var(--space-3)', fontWeight: 600, fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Questions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {questions.map((q, idx) => {
              const isActive = q._id === activeQuestionId;
              let isAnswered = false;
              if (isMcq) {
                isAnswered = mcqAnswers[q._id] !== undefined || (isLocked && submissions.find(s => s.problem._id === q._id));
              } else {
                isAnswered = submissions.find(s => s.problem._id === q._id);
              }

              return (
                <button
                  key={q._id}
                  onClick={() => setActiveQuestionId(q._id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: 'var(--space-3)', width: '100%', textAlign: 'left',
                    background: isActive ? 'var(--color-bg-secondary)' : 'transparent',
                    border: 'none', borderRadius: 'var(--border-radius)', cursor: 'pointer',
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    fontWeight: isActive ? 600 : 500
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    Question {q.questionNumber}
                  </span>
                  {isAnswered && <CheckCircle2 size={16} color="var(--color-success)" />}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
            {!isLocked ? (
              <button
                className="btn btn-primary btn-block"
                disabled={!allAnswered || submitting}
                onClick={() => setShowSubmitConfirm(true)}
              >
                Submit Section
              </button>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--color-success)', fontSize: 'var(--text-sm)', fontWeight: 500, padding: 'var(--space-2) 0' }}>
                <CheckCircle2 size={16} style={{ display: 'block', margin: '0 auto 4px' }} />
                Submitted
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {activeQuestion ? (
            <>
              {/* Question Context */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 4 }}>
                      QUESTION {activeQuestion.questionNumber}
                    </div>
                    <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, margin: 0 }}>
                      {activeQuestion.title}
                    </h2>
                  </div>
                  <div className="badge badge-gray">{activeQuestion.marks} Marks</div>
                </div>

                {activeQuestion.description && (
                  <div style={{ color: 'var(--color-text)', fontSize: 'var(--text-md)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
                    {activeQuestion.description}
                  </div>
                )}

                {activeQuestion.instructions && (
                  <div style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--border-radius)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Instructions</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{activeQuestion.instructions}</div>
                  </div>
                )}
              </div>

              {/* Interactive Area */}
              <div className="card">
                {isMcq ? (
                  <div>
                    {isLocked && (() => {
                      const sub = submissions.find(s => s.problem._id === activeQuestion._id);
                      if (!sub) return null;
                      return (
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                          <span className={sub.finalScore > 0 ? 'badge badge-green' : 'badge badge-red'}>
                            {sub.finalScore ?? 0} / {sub.maxScore ?? activeQuestion.marks} Marks
                          </span>
                        </div>
                      );
                    })()}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {activeQuestion.mcqOptions?.map((opt, idx) => {
                        // If locked, check submission status. If unlocked, check local state.
                        const sub = submissions.find(s => s.problem._id === activeQuestion._id);
                        const isSelected = isLocked ? sub?.mcqAnswer === idx : mcqAnswers[activeQuestion._id] === idx;

                        let optionStyle = {
                          display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                          padding: 'var(--space-4)',
                          border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--border-radius)',
                          background: isSelected ? 'var(--color-bg-secondary)' : 'transparent',
                          cursor: isLocked ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: isLocked && !isSelected ? 0.6 : 1
                        };

                        return (
                          <label key={idx} style={optionStyle}>
                            <input
                              type="radio"
                              name={`q-${activeQuestion._id}`}
                              checked={isSelected}
                              onChange={() => {
                                if (!isLocked) {
                                  setMcqAnswers(prev => ({ ...prev, [activeQuestion._id]: idx }));
                                }
                              }}
                              disabled={isLocked}
                              style={{ marginTop: 4, cursor: isLocked ? 'default' : 'pointer', flexShrink: 0 }}
                            />
                            <span style={{ fontSize: 'var(--text-md)', lineHeight: 1.5 }}>
                              {opt.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Your Submission</h3>
                    {(() => {
                      const existingSub = submissions.find(s => s.problem._id === activeQuestion._id);
                      if (isLocked) {
                        return (
                          <div style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-4)', borderRadius: 'var(--border-radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                              <CheckCircle2 size={20} color="var(--color-success)" />
                              <div>
                                <div style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>File Uploaded</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>{existingSub?.cadFileName || 'submission.dxf'}</div>
                              </div>
                            </div>
                            <div>
                              {existingSub?.status === 'evaluated' ? (
                                <span className="badge badge-green">{existingSub.finalScore ?? 0} / {existingSub.maxScore ?? activeQuestion.marks} Marks</span>
                              ) : existingSub?.status === 'evaluating' ? (
                                <span className="badge badge-yellow">Evaluating...</span>
                              ) : null}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <FileUpload
                          key={activeQuestion._id}
                          onFileSelect={(file) => handleCadUpload(file, activeQuestion._id)}
                          accept=".pdf,.dxf,.dwg"
                        />
                      );
                    })()}

                    {!isLocked && submissions.find(s => s.problem._id === activeQuestion._id) && (
                      <div style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                        <CheckCircle2 size={16} /> Current file uploaded: {submissions.find(s => s.problem._id === activeQuestion._id)?.cadFileName}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, color: 'var(--color-muted)' }}>
              No questions found for this section.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SectionView;