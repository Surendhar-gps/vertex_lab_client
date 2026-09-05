import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, ChevronRight, Clock } from 'lucide-react';
import Layout from '../../components/Layout';
import ProgressCircle from '../../components/ProgressCircle';
import { LoadingSpinner, getStatusBadge, BackLink } from '../../components/UI';
import { experimentService, submissionService } from '../../services/index';

const ExperimentView = () => {
  const { labId, experimentId } = useParams();
  const [experiment, setExperiment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [finalSubmission, setFinalSubmission] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [expRes] = await Promise.all([
        experimentService.getProgress(experimentId),
        submissionService.getStudentSubmissions({ experimentId }),
      ]);
      const data = expRes.data.data;
      setQuestions(data.questions || []);
      setFinalSubmission(data.finalSubmission || null);
      setProgress(data.progress || 0);

      // Also get experiment metadata
      const metaRes = await experimentService.getById(experimentId);
      setExperiment(metaRes.data.data.experiment);
    } catch (err) {
      console.error('ExperimentView error:', err);
    } finally {
      setLoading(false);
    }
  }, [experimentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <Layout title="Experiment"><LoadingSpinner /></Layout>;

  const total = questions.length;

  const categoryTitles = {
    'mcq': 'MCQ',
    'skill_enhancer': 'Skill Enhancer',
    'practice_by_yourself': 'Practice by Yourself'
  };

  const getSectionStatusField = (type) => {
    if (type === 'mcq') return 'mcqStatus';
    if (type === 'skill_enhancer') return 'skillEnhancerStatus';
    return 'practiceStatus';
  };

  const getSectionStatus = (type) => {
    if (!finalSubmission) return 'not_submitted';
    return finalSubmission[getSectionStatusField(type)] || 'not_submitted';
  };

  return (
    <Layout title={experiment?.title || 'Experiment'}>
      {/* BackLink */}
      <BackLink to={`/student/labs/${labId}`} label={`Back to ${experiment?.lab?.title || 'Lab'}`} />

      {/* Experiment header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <span style={{
                fontSize: 'var(--text-xs)', fontWeight: 700,
                background: 'var(--color-primary)', color: 'white',
                padding: '2px var(--space-2)', borderRadius: 'var(--border-radius-full)',
              }}>
                WEEK {experiment?.weekNumber}
              </span>
            </div>
            <h1 className="page-title">{experiment?.title}</h1>
            {experiment?.description && (
              <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)', marginTop: 4, maxWidth: 600 }}>
                {experiment.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: 'var(--space-5)', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <BookOpen size={12} /> {total} Questions
              </div>
              {experiment?.dueDate && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Due: {new Date(experiment.dueDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Progress circle based on section completion */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ProgressCircle percent={progress} size={100} strokeWidth={9} />
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center' }}>
              Overall Progress
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      {experiment?.instructions && (
        <div className="alert alert-info" style={{ marginBottom: 'var(--space-6)' }}>
          <span>{experiment.instructions}</span>
        </div>
      )}

      {/* Questions */}
      <div className="section-title">Sections</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {['mcq', 'skill_enhancer', 'practice_by_yourself'].map((type) => {
          const typeQuestions = questions.filter((q) => q.type === type);
          const sectionStatus = getSectionStatus(type);
          
          return (
            <Link 
              key={type}
              to={`/student/labs/${labId}/experiments/${experimentId}/sections/${type}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="card" style={{ 
                padding: 'var(--space-4)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-lg)', marginBottom: 4 }}>
                    {categoryTitles[type]}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
                    {typeQuestions.length} Questions
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  {getStatusBadge(sectionStatus)}
                  <ChevronRight size={20} color="var(--color-muted)" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
};

export default ExperimentView;
