import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, AlertCircle, ChevronRight } from 'lucide-react';
import Layout from '../../components/Layout';
import ProgressCircle from '../../components/ProgressCircle';
import { LoadingSpinner, BackLink } from '../../components/UI';
import { labService, submissionService, experimentService } from '../../services/index';

const SECTION_STATUS_FIELDS = [
  'mcqStatus',
  'skillEnhancerStatus',
  'practiceStatus'
];

const SUBMITTED_STATUSES = [
  'submitted',
  'evaluating',
  'evaluated'
];

const TopicView = () => {
  const { labId } = useParams();
  const navigate = useNavigate();

  const [lab, setLab] = useState(null);
  const [experiments, setExperiments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [experimentProgress, setExperimentProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [labRes, subRes] = await Promise.all([
          labService.getLabById(labId),
          submissionService.getStudentSubmissions({ labId }),
        ]);

        const labData = labRes.data.data.lab;
        const expList = labRes.data.data.experiments || [];

        setLab(labData);
        setExperiments(expList);
        setSubmissions(subRes.data.data.submissions || []);

        // Get each week's actual progress and final submission status
        const progressResults = await Promise.all(
          expList.map((exp) =>
            experimentService.getProgress(exp._id).catch((err) => {
              console.error(
                `Failed to get progress for experiment ${exp._id}`,
                err
              );
              return null;
            })
          )
        );

        const progressMap = {};

        expList.forEach((exp, idx) => {
          const result = progressResults[idx];

          if (result?.data?.data) {
            progressMap[exp._id] = {
              progress: Number(result.data.data.progress) || 0,
              finalSubmission:
                result.data.data.finalSubmission || null
            };
          } else {
            progressMap[exp._id] = {
              progress: 0,
              finalSubmission: null
            };
          }
        });

        setExperimentProgress(progressMap);

      } catch (err) {
        console.error('TopicView error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [labId]);

  if (loading) {
    return (
      <Layout title="Lab">
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!lab) {
    return (
      <Layout title="Lab">
        <div className="card">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              color: 'var(--color-muted)'
            }}
          >
            <AlertCircle size={20} />
            <span>
              Lab not found or you don't have access to this lab.
            </span>
          </div>
        </div>
      </Layout>
    );
  }

  // ---------------------------------------------------------
  // Get the final submission for a particular week
  // ---------------------------------------------------------
  const getFinalSubmission = (expId) => {
    return experimentProgress[expId]?.finalSubmission || null;
  };

  // ---------------------------------------------------------
  // Count submitted sections for a particular week
  // ---------------------------------------------------------
  const getSubmittedSectionCount = (expId) => {
    const finalSubmission = getFinalSubmission(expId);

    if (!finalSubmission) {
      return 0;
    }

    return SECTION_STATUS_FIELDS.reduce((count, field) => {
      const status = finalSubmission[field] || 'not_submitted';

      return SUBMITTED_STATUSES.includes(status)
        ? count + 1
        : count;
    }, 0);
  };

  // ---------------------------------------------------------
  // Get the actual percentage of a particular week
  // ---------------------------------------------------------
  const getExperimentPercent = (expId) => {
    // First use the progress returned by the backend
    const backendProgress = experimentProgress[expId]?.progress;

    if (
      typeof backendProgress === 'number' &&
      !Number.isNaN(backendProgress)
    ) {
      return Math.max(0, Math.min(100, Math.round(backendProgress)));
    }

    // Fallback: calculate from submitted sections
    const submittedSections = getSubmittedSectionCount(expId);

    if (SECTION_STATUS_FIELDS.length === 0) {
      return 0;
    }

    return Math.round(
      (submittedSections / SECTION_STATUS_FIELDS.length) * 100
    );
  };

  // ---------------------------------------------------------
  // OVERALL LAB PROGRESS
  //
  // Every week's percentage contributes to the lab percentage.
  //
  // Example:
  // Week 1 = 33%
  // Week 2 = 0%
  // Week 3 = 0%
  //
  // Lab = (33 + 0 + 0) / 3 = 11%
  //
  // Only when ALL weeks are 100%:
  //
  // Week 1 = 100%
  // Week 2 = 100%
  // Week 3 = 100%
  //
  // Lab = 100%
  // ---------------------------------------------------------

  const totalExperiments = experiments.length;

  const experimentPercents = experiments.map((exp) =>
    getExperimentPercent(exp._id)
  );

  const overallPercent =
    totalExperiments > 0
      ? Math.round(
        experimentPercents.reduce(
          (sum, percent) => sum + percent,
          0
        ) / totalExperiments
      )
      : 0;

  // Number of completely finished weeks
  const completedExperiments = experiments.filter(
    (exp) => getExperimentPercent(exp._id) === 100
  ).length;

  return (
    <Layout title={lab.title}>

      <BackLink
        to="/student/labs"
        label="Back to My Labs"
      />

      {/* ---------------------------------------------------
          LAB HEADER
      --------------------------------------------------- */}
      <div className="page-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 'var(--space-6)'
          }}
        >

          <div style={{ flex: 1 }}>

            <h1 className="page-title">
              {lab.title}
            </h1>

            <p className="page-subtitle">
              {lab.topic}
            </p>

            {lab.description && (
              <p
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-text-secondary)',
                  marginTop: 'var(--space-2)',
                  maxWidth: 600
                }}
              >
                {lab.description}
              </p>
            )}

            <div
              style={{
                display: 'flex',
                gap: 'var(--space-4)',
                marginTop: 'var(--space-4)',
                flexWrap: 'wrap'
              }}
            >

              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-muted)'
                }}
              >
                Faculty:{' '}
                <strong>
                  {lab.createdBy?.name}
                </strong>
              </span>

              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-muted)'
                }}
              >
                {lab.class} — Section {lab.section}
              </span>

              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-muted)'
                }}
              >
                {experiments.length} Weekly Experiments
              </span>

            </div>
          </div>

          {/* ------------------------------------------------
              OVERALL LAB PROGRESS
          ------------------------------------------------- */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4
            }}
          >

            <ProgressCircle
              percent={overallPercent}
              size={64}
              strokeWidth={6}
            />

            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                color: 'var(--color-muted)'
              }}
            >
              {completedExperiments} of {totalExperiments} weeks
            </span>

          </div>

        </div>
      </div>

      {/* ---------------------------------------------------
          WEEKLY EXPERIMENTS
      --------------------------------------------------- */}

      <div className="section-title">
        Weekly Experiments
      </div>

      {experiments.length === 0 ? (

        <div className="card">
          <p
            style={{
              color: 'var(--color-muted)',
              textAlign: 'center',
              padding: 'var(--space-8) 0'
            }}
          >
            No experiments added yet. Check back later.
          </p>
        </div>

      ) : (

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)'
          }}
        >

          {experiments.map((exp) => {

            const percent = getExperimentPercent(exp._id);

            return (

              <div
                key={exp._id}
                className="card"
                style={{
                  cursor: 'pointer'
                }}
                onClick={() =>
                  navigate(
                    `/student/labs/${labId}/experiments/${exp._id}`
                  )
                }
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >

                  <div style={{ flex: 1 }}>

                    {/* Week number + title */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-3)',
                        marginBottom: 'var(--space-2)'
                      }}
                    >

                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          background: 'var(--color-primary)',
                          color: 'white',
                          padding: '2px var(--space-2)',
                          borderRadius:
                            'var(--border-radius-full)'
                        }}
                      >
                        WEEK {exp.weekNumber}
                      </span>

                      <span
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-text)'
                        }}
                      >
                        {exp.title}
                      </span>

                    </div>

                    {/* Description */}
                    {exp.description && (
                      <p
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-muted)',
                          marginBottom: 'var(--space-3)'
                        }}
                      >
                        {exp.description}
                      </p>
                    )}

                    {/* Questions + due date */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--space-5)',
                        flexWrap: 'wrap'
                      }}
                    >

                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <BookOpen size={12} />

                        {exp.questionCount || 0} Questions
                      </div>

                      {exp.dueDate && (
                        <div
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Calendar size={12} />

                          Due:{' '}
                          {new Date(
                            exp.dueDate
                          ).toLocaleDateString()}
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Week progress */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-4)'
                    }}
                  >

                    <ProgressCircle
                      percent={percent}
                      size={72}
                      strokeWidth={7}
                    />

                    <ChevronRight
                      size={16}
                      color="var(--color-muted)"
                    />

                  </div>

                </div>

              </div>

            );
          })}

        </div>

      )}

    </Layout>
  );
};

export default TopicView;