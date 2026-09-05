/**
 * Progress Circle SVG component.
 * @param {number} percent - 0 to 100
 * @param {number} size - SVG size in px (default 80)
 * @param {number} strokeWidth - stroke width (default 6)
 * @param {string} label - optional label below circle
 */
const ProgressCircle = ({ percent = 0, percentage, size = 80, strokeWidth = 6, label }) => {
  // Support both percent and percentage props
  const value = percentage !== undefined ? percentage : percent;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, value || 0));
  const offset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="progress-circle-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
      <div className="progress-circle" style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke="var(--color-border)"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke="#10b981"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset var(--transition-slow)',
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
        </svg>
        <span
          className="progress-percentage"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text)',
            fontWeight: 600,
            pointerEvents: 'none',
            fontSize: size * 0.22,
          }}
        >
          {clampedPercent}%
        </span>
      </div>
      {label && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>{label}</span>}
    </div>
  );
};

export default ProgressCircle;
