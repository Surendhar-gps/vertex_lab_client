import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, ChevronRight, BookOpen, Calendar, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Layout from '../../components/Layout';
import { LoadingSpinner, ErrorMessage, Badge } from '../../components/UI';
import { labService, experimentService } from '../../services/index';

const FacultyLabDetail = () => {
  const { labId } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateExp, setShowCreateExp] = useState(false);
  const [expForm, setExpForm] = useState({ weekNumber: '', title: '', description: '', instructions: '', dueDate: '' });
  const [expError, setExpError] = useState('');
  const [expLoading, setExpLoading] = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [expPublishLoadingId, setExpPublishLoadingId] = useState(null);

  const fetchData = async () => {
    try {
      const res = await labService.getLabById(labId);
      setLab(res.data.data.lab);
      setExperiments(res.data.data.experiments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [labId]);

  const handleCreateExp = async (e) => {
    e.preventDefault();
    if (!expForm.weekNumber || !expForm.title || !expForm.dueDate) {
      setExpError('Week number, title, and due date are required.');
      return;
    }
    setExpLoading(true);
    setExpError('');
    try {
      if (editingExpId) {
        await experimentService.update(editingExpId, expForm);
      } else {
        await labService.createExperiment(labId, expForm);
      }
      setShowCreateExp(false);
      setEditingExpId(null);
      setExpForm({ weekNumber: '', title: '', description: '', instructions: '', dueDate: '' });
      fetchData();
    } catch (err) {
      setExpError(err.response?.data?.message || 'Failed to save experiment.');
    } finally {
      setExpLoading(false);
    }
  };

  const handleEditExpClick = (exp, e) => {
    e.stopPropagation();
    setEditingExpId(exp._id);
    setExpForm({
      weekNumber: exp.weekNumber,
      title: exp.title,
      description: exp.description || '',
      instructions: exp.instructions || '',
      dueDate: exp.dueDate ? new Date(exp.dueDate).toISOString().split('T')[0] : '',
    });
    setShowCreateExp(true);
  };

  const handleDeleteLab = async () => {
    try {
      setDeleteLoading(true);
      await labService.deleteLab(labId);
      navigate('/faculty/labs');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete lab.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleTogglePublishLab = async () => {
    if (!lab) return;
    const willPublish = !lab.isPublished;
    if (willPublish && experiments.length === 0) {
      alert('Add at least one weekly experiment before publishing this lab.');
      return;
    }
    setPublishLoading(true);
    try {
      await labService.publishLab(labId, { publish: willPublish });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update publish status.');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleToggleExpPublish = async (exp, e) => {
    e.stopPropagation();
    const willPublish = !exp.isPublished;
    if (willPublish && (!exp.questionCount || exp.questionCount === 0)) {
      alert('Add at least one question before publishing this week.');
      return;
    }
    setExpPublishLoadingId(exp._id);
    try {
      await experimentService.publish(exp._id, { publish: willPublish });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update publish status.');
    } finally {
      setExpPublishLoadingId(null);
    }
  };

  if (loading) return <Layout title="Lab"><LoadingSpinner /></Layout>;

  return (
    <Layout title={lab?.title || 'Lab'}>
      <div className="breadcrumb">
        <Link to="/faculty/labs">Labs</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{lab?.title}</span>
      </div>

      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <h1 className="page-title" style={{ margin: 0 }}>{lab?.title}</h1>
              <Badge color={lab?.isPublished ? 'green' : 'yellow'}>
                {lab?.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <p className="page-subtitle">{lab?.topic} · {lab?.class} — Section {lab?.section}</p>
            {lab?.regNoFrom && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: 4 }}>
                Reg Range: {lab.regNoFrom} → {lab.regNoTo}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn btn-outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => setShowDeleteModal(true)}>
              <Trash2 size={14} /> Delete Lab
            </button>
            <button className="btn btn-outline" onClick={() => navigate(`/faculty/labs/${labId}/edit`)}>
              <Edit size={14} /> Edit Lab
            </button>
            <button
              className={`btn btn-capsule ${lab?.isPublished ? 'btn-outline' : 'btn-primary'}`}
              onClick={handleTogglePublishLab}
              disabled={publishLoading}
            >
              {publishLoading ? (
                <LoadingSpinner size={16} />
              ) : lab?.isPublished ? (
                <><EyeOff size={14} /> Unpublish Lab</>
              ) : (
                <><Eye size={14} /> Publish Lab</>
              )}
            </button>
            <button className="btn btn-primary btn-capsule" onClick={() => {
              setEditingExpId(null);
              setExpForm({ weekNumber: experiments.length + 1, title: '', description: '', instructions: '', dueDate: '' });
              setShowCreateExp(true);
            }}>
              <Plus size={14} /> Add Weekly Experiment
            </button>
          </div>
        </div>
        {!lab?.isPublished && (
          <div className="alert alert-info" style={{ marginTop: 'var(--space-4)' }}>
            This lab is a draft and is not visible to students yet. Publish it once you've finished setting up experiments and questions.
          </div>
        )}
      </div>

      {/* Create experiment form */}
      {showCreateExp && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--color-primary)' }}>
          <div className="card-title" style={{ marginBottom: 'var(--space-4)' }}>
            {editingExpId ? 'Edit Weekly Experiment' : 'New Weekly Experiment'}
          </div>
          <ErrorMessage message={expError} />
          <form onSubmit={handleCreateExp}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Week Number <span className="form-required">*</span></label>
                <input type="number" className="form-input" min={1} value={expForm.weekNumber}
                  onChange={(e) => setExpForm((p) => ({ ...p, weekNumber: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date <span className="form-required">*</span></label>
                <input type="date" className="form-input" value={expForm.dueDate}
                  onChange={(e) => setExpForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Title <span className="form-required">*</span></label>
              <input type="text" className="form-input" placeholder="e.g., Basic 2D CAD Commands"
                value={expForm.title} onChange={(e) => setExpForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={2} value={expForm.description}
                onChange={(e) => setExpForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Instructions for Students</label>
              <textarea className="form-textarea" rows={2} value={expForm.instructions}
                onChange={(e) => setExpForm((p) => ({ ...p, instructions: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button type="submit" className="btn btn-primary btn-capsule" disabled={expLoading}>
                {expLoading ? <LoadingSpinner size={16} /> : (editingExpId ? 'Save Changes' : 'Create Experiment')}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => {
                setShowCreateExp(false);
                setEditingExpId(null);
              }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="section-title">Weekly Experiments ({experiments.length})</div>

      {experiments.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 'var(--space-8) 0' }}>
            No experiments yet. Click "Add Weekly Experiment" to create one.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {experiments.map((exp) => (
            <div key={exp._id} className="card card-sm" style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/faculty/experiments/${exp._id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 4 }}>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: 'var(--border-radius-full)' }}>
                      WEEK {exp.weekNumber}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{exp.title}</span>
                    <Badge color={exp.isPublished ? 'green' : 'yellow'}>
                      {exp.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={11} /> {exp.questionCount || 0} Questions
                    </span>
                    {exp.dueDate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={11} /> Due: {new Date(exp.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <button
                    className={`btn btn-sm ${exp.isPublished ? 'btn-outline' : 'btn-primary'}`}
                    onClick={(e) => handleToggleExpPublish(exp, e)}
                    disabled={expPublishLoadingId === exp._id}
                  >
                    {expPublishLoadingId === exp._id ? (
                      <LoadingSpinner size={14} />
                    ) : exp.isPublished ? (
                      <><EyeOff size={13} /> Unpublish</>
                    ) : (
                      <><Eye size={13} /> Publish</>
                    )}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={(e) => handleEditExpClick(exp, e)}>
                    <Edit size={14} /> Edit
                  </button>
                  <ChevronRight size={14} color="var(--color-muted)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Delete Lab Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: 400 }}>
            <h3 className="card-title" style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>Delete Lab?</h3>
            <p style={{ marginBottom: 'var(--space-5)' }}>
              Are you sure you want to delete <br />
              <strong>&quot;{lab?.title}&quot;</strong>?<br /><br />
              This action will remove the lab and its associated weekly experiments, questions, and submission data.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)} disabled={deleteLoading}>Cancel</button>
              <button className="btn btn-primary" style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={handleDeleteLab} disabled={deleteLoading}>
                {deleteLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Delete Lab'}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default FacultyLabDetail;