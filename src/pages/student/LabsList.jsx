import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, ChevronRight } from 'lucide-react';
import Layout from '../../components/Layout';
import ProgressCircle from '../../components/ProgressCircle';
import { LoadingSpinner, EmptyState, BackLink } from '../../components/UI';
import { labService, experimentService } from '../../services/index';

const LabsList = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        // Get all labs assigned to the student
        const labsRes = await labService.getLabs();

        const labsList = labsRes.data.data.labs || [];

        // Calculate actual progress for every lab
        const labsWithProgress = await Promise.all(
          labsList.map(async (lab) => {
            try {
              // Get the experiments/weeks belonging to this lab
              const labRes = await labService.getLabById(lab._id);

              const experiments =
                labRes.data.data.experiments || [];

              // Get progress for every week
              const progressResults = await Promise.all(
                experiments.map((exp) =>
                  experimentService
                    .getProgress(exp._id)
                    .catch((err) => {
                      console.error(
                        `Failed to get progress for experiment ${exp._id}`,
                        err
                      );

                      return null;
                    })
                )
              );

              // Extract actual percentage for every week
              const weeklyProgress = experiments.map(
                (exp, index) => {
                  const result = progressResults[index];

                  const progress =
                    result?.data?.data?.progress;

                  // Make sure progress is a valid number
                  if (
                    typeof progress === 'number' &&
                    !Number.isNaN(progress)
                  ) {
                    return Math.max(
                      0,
                      Math.min(100, Math.round(progress))
                    );
                  }

                  return 0;
                }
              );

              const totalExperiments = experiments.length;

              // ------------------------------------------------
              // Calculate overall LAB progress
              // ------------------------------------------------
              //
              // Example:
              //
              // Week 1 = 33
              // Week 2 = 0
              // Week 3 = 0
              //
              // Overall = (33 + 0 + 0) / 3
              //         = 11%
              //
              // ------------------------------------------------

              const progressPercentage =
                totalExperiments > 0
                  ? Math.round(
                    weeklyProgress.reduce(
                      (sum, progress) => sum + progress,
                      0
                    ) / totalExperiments
                  )
                  : 0;

              // ------------------------------------------------
              // Count ONLY fully completed weeks
              // ------------------------------------------------

              const completedExperiments =
                weeklyProgress.filter(
                  (progress) => progress === 100
                ).length;

              return {
                ...lab,

                // Use actual number of experiments
                totalExperiments,

                // Average progress of all weeks
                progressPercentage,

                // Number of weeks that are exactly 100%
                completedExperiments,

                // Keep weekly values if needed later
                weeklyProgress
              };
            } catch (err) {
              console.error(
                `Failed to calculate progress for lab ${lab._id}`,
                err
              );

              return {
                ...lab,
                totalExperiments: 0,
                progressPercentage: 0,
                completedExperiments: 0,
                weeklyProgress: []
              };
            }
          })
        );

        setLabs(labsWithProgress);
      } catch (err) {
        console.error('Failed to load labs:', err);
        setLabs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLabs();
  }, []);

  if (loading) {
    return (
      <Layout title="My Labs">
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="My Labs">

      <BackLink
        to="/student/dashboard"
        label="Back to Dashboard"
      />

      <div className="page-header">

        <h1 className="page-title">
          My Labs
        </h1>

        <p className="page-subtitle">
          View and access your assigned CAD laboratories.
        </p>

      </div>

      {labs.length === 0 ? (

        <div className="card">

          <EmptyState
            icon={BookOpen}
            title="No labs assigned"
            text="Your faculty hasn't assigned any labs to your class yet. Check back later."
          />

        </div>

      ) : (

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)'
          }}
        >

          {labs.map((lab) => (

            <div
              key={lab._id}
              className="card"
              style={{
                cursor: 'pointer'
              }}
              onClick={() =>
                navigate(`/student/labs/${lab._id}`)
              }
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}
              >

                {/* -------------------------------------------
                    LAB INFORMATION
                -------------------------------------------- */}

                <div style={{ flex: 1 }}>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      marginBottom: 'var(--space-2)'
                    }}
                  >

                    <div
                      style={{
                        width: 36,
                        height: 36,
                        background:
                          'var(--color-primary-muted)',
                        borderRadius:
                          'var(--border-radius)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >

                      <BookOpen
                        size={18}
                        color="var(--color-primary)"
                      />

                    </div>

                    <div>

                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--color-text)'
                        }}
                      >
                        {lab.title}
                      </div>

                      <div
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-muted)'
                        }}
                      >
                        {lab.topic}
                      </div>

                    </div>

                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--space-5)',
                      flexWrap: 'wrap',
                      marginTop: 'var(--space-3)'
                    }}
                  >

                    {/* Class and section */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-muted)'
                      }}
                    >

                      <Users size={12} />

                      <span>
                        {lab.class} — Section {lab.section}
                      </span>

                    </div>

                    {/* Number of weeks */}
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

                      {lab.totalExperiments || 0} Weeks

                    </div>

                  </div>

                </div>

                {/* -------------------------------------------
                    PROGRESS
                -------------------------------------------- */}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-4)'
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >

                    <ProgressCircle
                      percent={
                        lab.progressPercentage || 0
                      }
                      size={64}
                      strokeWidth={5}
                    />

                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500
                      }}
                    >
                      {Math.min(
                        lab.completedExperiments || 0,
                        lab.totalExperiments || 0
                      )}{' '}
                      of {lab.totalExperiments || 0} weeks
                    </span>

                  </div>

                  <ChevronRight
                    size={16}
                    color="var(--color-muted)"
                  />

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

    </Layout>
  );
};

export default LabsList;