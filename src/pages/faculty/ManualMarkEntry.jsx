import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Save, User, BookOpen } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner, ErrorMessage } from '../../components/UI';
import { adminService, labService, experimentService, submissionService } from '../../services/index';

const ExperimentGrader = ({ student, experiment, lab }) => {
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch questions for this experiment
        const expRes = await experimentService.getById(experiment._id);
        const fetchedQs = expRes.data.data.questions || [];
        setQuestions(fetchedQs);

        // Fetch student submissions for this experiment
        const subRes = await submissionService.getFacultyProgress({
          studentId: student._id,
          experimentId: experiment._id,
        });
        const fetchedSubs = subRes.data.data.submissions || [];
        setSubmissions(fetchedSubs);

        // Map existing scores to local state
        const initialScores = {};
        fetchedQs.forEach(q => {
          const sub = fetchedSubs.find(s => s.problem?._id === q._id);
          if (sub && sub.finalScore !== undefined) {
            initialScores[q._id] = sub.finalScore;
          }
        });
        setScores(initialScores);
      } catch (err) {
        setError('Failed to load questions or submissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [student._id, experiment._id]);

  const handleScoreChange = (qId, val) => {
    setScores(prev => ({ ...prev, [qId]: val }));
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const scoresPayload = questions.map(q => {
      const val = scores[q._id];
      return {
        problemId: q._id,
        score: val !== undefined && val !== '' ? Number(val) : null,
        comment: '', // Optional: could add a comment field per question if needed
      };
    }).filter(s => s.score !== null);

    if (scoresPayload.length === 0) {
      setError('No scores entered.');
      setSaving(false);
      return;
    }

    try {
      await submissionService.manualReviewBulk({
        studentId: student._id,
        experimentId: experiment._id,
        scores: scoresPayload,
      });
      setSuccess('Marks saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save marks.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-4)' }}><LoadingSpinner /></div>;

  return (
    <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--border-radius)', marginTop: 'var(--space-3)' }}>
      <div style={{ fontWeight: 600, marginBottom: 'var(--space-4)' }}>Questions for {experiment.title}</div>
      <ErrorMessage message={error} />
      {success && <div style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{success}</div>}
      
      {questions.length === 0 ? (
        <div style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>No questions found in this experiment.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {questions.map((q, idx) => (
            <div key={q._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: 'var(--space-3)', borderRadius: 'var(--border-radius)', border: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontWeight: 500, marginRight: 'var(--space-2)' }}>Q{q.questionNumber || idx + 1}.</span>
                <span style={{ fontSize: 'var(--text-sm)' }}>{q.title}</span>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: 2 }}>Max Marks: {q.marks}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: 80, padding: '4px 8px' }}
                  placeholder={`/ ${q.marks}`}
                  min={0}
                  max={q.marks}
                  value={scores[q._id] !== undefined ? scores[q._id] : ''}
                  onChange={(e) => handleScoreChange(q._id, e.target.value)}
                />
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : <><Save size={14} /> Save Marks</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const LabAccordion = ({ student, lab }) => {
  const [expanded, setExpanded] = useState(false);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedExpId, setExpandedExpId] = useState(null);

  const toggleExpand = async () => {
    const nextState = !expanded;
    setExpanded(nextState);
    if (nextState && experiments.length === 0) {
      setLoading(true);
      try {
        const res = await labService.getLabById(lab._id);
        setExperiments(res.data.data.experiments || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleExp = (expId) => {
    setExpandedExpId(prev => prev === expId ? null : expId);
  };

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-3)', overflow: 'hidden' }}>
      <div 
        onClick={toggleExpand}
        style={{ background: 'var(--color-bg-secondary)', padding: 'var(--space-3) var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <BookOpen size={16} color="var(--color-primary)" />
          <span style={{ fontWeight: 500 }}>{lab.title}</span>
        </div>
        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>
      
      {expanded && (
        <div style={{ padding: 'var(--space-4)', background: 'white' }}>
          {loading ? <LoadingSpinner /> : (
            experiments.length === 0 ? (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>No experiments found in this lab.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {experiments.map(exp => (
                  <div key={exp._id}>
                    <div 
                      onClick={() => toggleExp(exp._id)}
                      style={{ padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expandedExpId === exp._id ? 'var(--color-bg-secondary)' : 'white' }}
                    >
                      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Week {exp.weekNumber}: {exp.title}</span>
                      {expandedExpId === exp._id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </div>
                    {expandedExpId === exp._id && (
                      <ExperimentGrader student={student} experiment={exp} lab={lab} />
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

const StudentAccordion = ({ student, labs }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card" style={{ marginBottom: 'var(--space-4)', padding: 0, overflow: 'hidden' }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expanded ? 'var(--color-bg-secondary)' : 'white' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--text-md)' }}>{student.name}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
              {student.registrationNumber || 'No Reg No'} · {student.email}
            </div>
          </div>
        </div>
        {expanded ? <ChevronDown size={20} color="var(--color-muted)" /> : <ChevronRight size={20} color="var(--color-muted)" />}
      </div>
      
      {expanded && (
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-muted)', marginBottom: 'var(--space-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Assigned Labs
          </div>
          {labs.length === 0 ? (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>No labs assigned to this class/section.</div>
          ) : (
            labs.map(lab => (
              <LabAccordion key={lab._id} student={student} lab={lab} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ManualMarkEntry = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [students, setStudents] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  useEffect(() => {
    const initFetch = async () => {
      try {
        const [clsRes, labRes] = await Promise.all([
          adminService.getClasses(),
          labService.getLabs()
        ]);
        setClasses(clsRes.data.data.classes || []);
        setLabs(labRes.data.data.labs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initFetch();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      setStudentsLoading(true);
      // Fetch students for this class and section
      adminService.getUsers({ role: 'student', class: selectedClass, section: selectedSection })
        .then(res => {
          setStudents(res.data.data.users || []);
        })
        .catch(console.error)
        .finally(() => setStudentsLoading(false));
    } else {
      setStudents([]);
    }
  }, [selectedClass, selectedSection]);

  const departments = [...new Set(classes.map((c) => c.department))].sort();
  const sectionsForDept = selectedClass
    ? classes.filter((c) => c.department === selectedClass)
    : [];

  // Filter labs that belong to the selected class/section
  const assignedLabs = labs.filter(l => l.class === selectedClass && l.section === selectedSection);

  if (loading) return <Layout title="Manual Mark Entry"><LoadingSpinner /></Layout>;

  return (
    <Layout title="Manual Mark Entry">
      <div className="page-header">
        <h1 className="page-title">Manual Mark Entry</h1>
        <p className="page-subtitle">Select a class to bulk-enter marks for students</p>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="grid-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Class / Department</label>
            <select
              className="form-select"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedSection('');
              }}
            >
              <option value="">Select class...</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Section</label>
            <select
              className="form-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select section...</option>
              {sectionsForDept.map((c) => <option key={c._id} value={c.section}>{c.section}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selectedClass && selectedSection && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <div className="section-title">Students ({students.length})</div>
          
          {studentsLoading ? (
            <LoadingSpinner />
          ) : students.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8) 0', color: 'var(--color-muted)' }}>
              No students found in this class and section.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {students.map(student => (
                <StudentAccordion key={student._id} student={student} labs={assignedLabs} />
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default ManualMarkEntry;
