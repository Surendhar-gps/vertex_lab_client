import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, Edit2, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import Layout from '../../components/Layout';
import FileUpload from '../../components/FileUpload';
import { LoadingSpinner, ErrorMessage, Badge } from '../../components/UI';
import { experimentService, problemService } from '../../services/index';

const emptyQForm = {
  title: '', description: '', instructions: '', marks: 1, type: 'mcq',
  mcqOptions: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  mcqCorrectAnswer: 0
};

const FacultyExperimentDetail = () => {
  const { experimentId } = useParams();
  const navigate = useNavigate();
  const [experiment, setExperiment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single Question Add/Edit Form
  const [showAddQ, setShowAddQ] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null); // the question being edited, or null when adding
  const [qForm, setQForm] = useState(emptyQForm);
  const [answerKeyFile, setAnswerKeyFile] = useState(null);
  const [qError, setQError] = useState('');
  const [qLoading, setQLoading] = useState(false);

  // Bulk Import Questions
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreview, setBulkPreview] = useState(null);

  const fetchData = async () => {
    try {
      const res = await experimentService.getById(experimentId);
      setExperiment(res.data.data.experiment);
      setQuestions(res.data.data.questions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [experimentId]);

  const closeQuestionForm = () => {
    setShowAddQ(false);
    setEditingQuestion(null);
    setQForm(emptyQForm);
    setAnswerKeyFile(null);
    setQError('');
  };

  const handleOpenAddForm = (sectionType) => {
    setEditingQuestion(null);
    setQForm({ ...emptyQForm, type: sectionType || 'mcq' });
    setAnswerKeyFile(null);
    setQError('');
    setShowAddQ(true);
  };

  const handleOpenEditForm = (q) => {
    setEditingQuestion(q);
    setQForm({
      title: q.title || '',
      description: q.description || '',
      instructions: q.instructions || '',
      marks: q.marks || 1,
      type: q.type || 'mcq',
      mcqOptions: (q.type === 'mcq' && Array.isArray(q.mcqOptions) && q.mcqOptions.length === 4)
        ? q.mcqOptions.map((o) => ({ text: o.text || '' }))
        : [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
      mcqCorrectAnswer: typeof q.mcqCorrectAnswer === 'number' ? q.mcqCorrectAnswer : 0
    });
    setAnswerKeyFile(null);
    setQError('');
    setShowAddQ(true);
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!qForm.title) { setQError('Question title is required.'); return; }

    setQLoading(true);
    setQError('');

    const formData = new FormData();
    if (!editingQuestion) {
      formData.append('weeklyExperiment', experimentId);
      formData.append('lab', experiment.lab?._id || experiment.lab);
      formData.append('questionNumber', questions.length + 1);
    }
    formData.append('title', qForm.title);
    formData.append('description', qForm.description);
    formData.append('instructions', qForm.instructions);
    formData.append('marks', qForm.marks);
    formData.append('type', qForm.type);
    const derivedFormat = qForm.type === 'mcq' ? 'mcq' : 'cad';
    formData.append('format', derivedFormat);
    if (derivedFormat === 'mcq') {
      formData.append('mcqOptions', JSON.stringify(qForm.mcqOptions));
      formData.append('mcqCorrectAnswer', qForm.mcqCorrectAnswer);
    }
    if (derivedFormat === 'cad' && answerKeyFile) formData.append('answerKeyFile', answerKeyFile);

    try {
      if (editingQuestion) {
        await problemService.update(editingQuestion._id, formData);
      } else {
        await problemService.create(formData);
      }
      closeQuestionForm();
      fetchData();
    } catch (err) {
      setQError(err.response?.data?.message || `Failed to ${editingQuestion ? 'update' : 'add'} question.`);
    } finally {
      setQLoading(false);
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    try {
      await problemService.delete(qId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const handleParseQuestions = async (e) => {
    e.preventDefault();
    if (!bulkFile) return setQError('Please select a file');
    setQLoading(true);
    setQError('');
    const fd = new FormData();
    fd.append('file', bulkFile);
    try {
      const res = await problemService.parseQuestions(fd);
      setBulkPreview(res.data.data.preview);
    } catch (err) {
      setQError(err.response?.data?.message || 'Parsing failed.');
    } finally {
      setQLoading(false);
    }
  };

  const handleBulkQuestions = async () => {
    setQLoading(true);
    try {
      await problemService.bulkQuestions({
        preview: bulkPreview,
        weeklyExperimentId: experimentId,
        labId: experiment.lab?._id || experiment.lab
      });
      setBulkPreview(null);
      setBulkFile(null);
      setShowBulkImport(false);
      fetchData();
    } catch (err) {
      setQError(err.response?.data?.message || 'Import failed.');
    } finally {
      setQLoading(false);
    }
  };

  const handleDownloadQuestionTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Section Type,Title,Description,Instructions,Marks,Option 1,Option 2,Option 3,Option 4,Correct Option Index\nMCQ,What is AutoCAD?,Basic question,,2,Software,Hardware,Both,None,1\nSkill Enhancer,Draw a line,Draw a 50mm line,Save as DXF,5,,,,,\nPractice by Yourself,Draw a hexagon,Draw a regular hexagon inscribed in a circle of radius 50mm,Save as DXF,10,,,,,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "questions_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderQuestionCard = (q) => (
    <div key={q._id} className="card card-sm">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, background: 'var(--color-bg-tertiary)', color: 'var(--color-muted)', padding: '1px 8px', borderRadius: 'var(--border-radius-full)' }}>
              Q{q.questionNumber}
            </span>
            <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{q.title}</span>
            <span className={`badge badge-${q.type === 'mcq' ? 'blue' : q.type === 'skill_enhancer' ? 'green' : 'yellow'}`}>
              {q.type === 'mcq' ? 'MCQ' : q.type === 'skill_enhancer' ? 'Skill Enhancer' : 'Practice by Yourself'}
            </span>
            <span className="badge badge-gray">{q.type === 'mcq' ? 'MCQ' : 'CAD'}</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
              {q.marks} marks
            </span>
          </div>
          {q.description && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginLeft: 40 }}>
              {q.description}
            </p>
          )}
          {q.answerKeyFileUrl && (
            <a href={q.answerKeyFileUrl} target="_blank" rel="noreferrer"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', marginLeft: 40, display: 'block', marginTop: 4 }}>
              View Answer Key
            </a>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="btn btn-outline btn-sm btn-icon"
            onClick={() => handleOpenEditForm(q)}
            title="Edit question"
          >
            <Edit2 size={16} />
          </button>
          <button
            className="btn btn-danger btn-sm btn-icon"
            onClick={() => handleDeleteQuestion(q._id)}
            title="Delete question"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <Layout title="Experiment"><LoadingSpinner /></Layout>;

  return (
    <Layout title={experiment?.title || 'Experiment'}>
      <div className="breadcrumb">
        <Link to="/faculty/labs">Labs</Link>
        <span className="breadcrumb-sep">›</span>
        {experiment?.lab && (
          <>
            <Link to={`/faculty/labs/${experiment.lab._id || experiment.lab}`}>
              {experiment.lab?.title || 'Lab'}
            </Link>
            <span className="breadcrumb-sep">›</span>
          </>
        )}
        <span>Week {experiment?.weekNumber}</span>
      </div>

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">{experiment?.title}</h1>
            <p className="page-subtitle">Week {experiment?.weekNumber}</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-outline btn-capsule" onClick={() => setShowBulkImport(true)}>
              <Upload size={14} /> Bulk Import Questions
            </button>
            <button className="btn btn-primary btn-capsule" onClick={() => handleOpenAddForm('mcq')}>
              <Plus size={14} /> Add Question
            </button>
          </div>
        </div>
      </div>

      {showBulkImport && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>Bulk Import Questions</div>
          <ErrorMessage message={qError} />

          {!bulkPreview ? (
            <div>
              <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-4)' }}>
                Upload a CSV or Excel file containing questions. MCQ options should be placed in Option 1-4 columns with the correct index (1-4).
              </p>
              <button type="button" className="btn btn-outline btn-capsule" style={{ marginBottom: 'var(--space-6)' }} onClick={handleDownloadQuestionTemplate}>
                <Download size={16} /> Download Template
              </button>
              <form onSubmit={handleParseQuestions} style={{ maxWidth: 500 }}>
                <div className="form-group">
                  <input type="file" className="form-input" accept=".csv,.xlsx,.xls" onChange={e => setBulkFile(e.target.files[0])} required />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button type="submit" className="btn btn-primary btn-capsule" disabled={qLoading}>
                    <Upload size={16} /> {qLoading ? 'Parsing...' : 'Upload & Preview'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowBulkImport(false); setBulkFile(null); }}>Cancel</button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h3 style={{ margin: 0 }}>Preview Questions</h3>
                <div>
                  <Badge color="green">{bulkPreview.filter(s => s.isValid).length} Valid</Badge>
                  <span style={{ margin: '0 8px' }}></span>
                  <Badge color="red">{bulkPreview.filter(s => !s.isValid).length} Errors</Badge>
                </div>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)' }}>
                <table className="table" style={{ margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg)', zIndex: 1 }}>
                    <tr>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Marks</th>
                      <th>Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkPreview.map((q, i) => (
                      <tr key={i} style={{ background: q.isValid ? 'transparent' : 'var(--color-danger-light)' }}>
                        <td>{q.isValid ? <CheckCircle size={16} color="var(--color-success)" /> : <AlertCircle size={16} color="var(--color-danger)" />}</td>
                        <td><Badge color={q.type === 'mcq' ? 'blue' : 'green'}>{q.type}</Badge></td>
                        <td>{q.title}</td>
                        <td>{q.marks}</td>
                        <td style={{ color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>{q.errors.join(', ')}</td>
                      </tr>
                    ))}
                    {bulkPreview.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-4)' }}>No questions found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn btn-primary btn-capsule" onClick={handleBulkQuestions} disabled={qLoading || bulkPreview.filter(s => s.isValid).length === 0}>
                  {qLoading ? <LoadingSpinner size={16} /> : 'Confirm & Save'}
                </button>
                <button className="btn btn-ghost" onClick={() => { setBulkPreview(null); setBulkFile(null); }}>Back</button>
              </div>
            </div>
          )}
        </div>
      )}

      {showAddQ && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            {editingQuestion ? 'Edit Question' : 'New Question'}
          </div>
          <ErrorMessage message={qError} />

          <form onSubmit={handleSubmitQuestion}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input" value={qForm.type} onChange={e => setQForm({ ...qForm, type: e.target.value })}>
                  <option value="mcq">MCQ</option>
                  <option value="skill_enhancer">Skill Enhancer (CAD)</option>
                  <option value="practice_by_yourself">Practice by Yourself (CAD)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Marks</label>
                <input type="number" min="1" className="form-input" value={qForm.marks} onChange={e => setQForm({ ...qForm, marks: e.target.value })} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Title <span className="form-required">*</span></label>
              <input type="text" className="form-input" value={qForm.title} onChange={e => setQForm({ ...qForm, title: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea className="form-input" rows="2" value={qForm.description} onChange={e => setQForm({ ...qForm, description: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Instructions (Optional)</label>
              <textarea className="form-input" rows="2" value={qForm.instructions} onChange={e => setQForm({ ...qForm, instructions: e.target.value })} />
            </div>

            {qForm.type === 'mcq' && (
              <div style={{ background: 'var(--color-bg-tertiary)', padding: 'var(--space-4)', borderRadius: 'var(--border-radius)', marginBottom: 'var(--space-4)' }}>
                <label className="form-label">MCQ Options</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  {qForm.mcqOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input type="radio" name="mcqCorrect" checked={qForm.mcqCorrectAnswer === i} onChange={() => setQForm({ ...qForm, mcqCorrectAnswer: i })} />
                      <input type="text" className="form-input" placeholder={`Option ${i + 1}`} value={opt.text} onChange={e => {
                        const newOpts = [...qForm.mcqOptions];
                        newOpts[i].text = e.target.value;
                        setQForm({ ...qForm, mcqOptions: newOpts });
                      }} required />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {qForm.type !== 'mcq' && (
              <div className="form-group">
                <label className="form-label">Reference Answer File (DXF) - Optional</label>
                <FileUpload accept=".dxf" onChange={setAnswerKeyFile} />
                {editingQuestion?.answerKeyFileUrl && !answerKeyFile && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: 4 }}>
                    Leave blank to keep the existing answer key file.
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <button type="submit" className="btn btn-primary" disabled={qLoading}>
                {qLoading ? <LoadingSpinner size={16} /> : (editingQuestion ? 'Save Changes' : 'Save Question')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={closeQuestionForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      {['mcq', 'skill_enhancer', 'practice_by_yourself'].map(sectionType => {
        const sectionQs = questions.filter(q => q.type === sectionType);
        const sectionTitle = sectionType === 'mcq' ? 'MCQs' : sectionType === 'skill_enhancer' ? 'Skill Enhancer' : 'Practice by Yourself';

        return (
          <div key={sectionType} style={{ marginBottom: 'var(--space-8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{sectionTitle}</h3>
              <button className="btn btn-outline btn-sm btn-capsule" onClick={() => handleOpenAddForm(sectionType)}>
                <Plus size={14} /> Add {sectionType === 'mcq' ? 'MCQ' : 'Question'}
              </button>
            </div>

            {sectionQs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--color-muted)', padding: 'var(--space-6)' }}>
                No questions in this section yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {sectionQs.map(renderQuestionCard)}
              </div>
            )}
          </div>
        );
      })}

    </Layout>
  );
};

export default FacultyExperimentDetail;