/**
 * Horizontal Progress Bar component — replaces ProgressCircle everywhere.
 *
 * Props:
 *   percent      {number}  0–100
 *   label        {string}  optional label shown on the left
 *   showPercent  {boolean} whether to show the % value on the right (default true)
 *   color        {string}  CSS color override (defaults to primary/success based on value)
 *   height       {number}  bar height in px (default 8)
 *   style        {object}  extra style for the container
 */
const ProgressBar = ({
  percent = 0,
  label,
  showPercent = true,
  color,
  height = 8,
  style = {},
}) => {
  const clamped = Math.min(100, Math.max(0, percent));

  const barColor = '#16A34A';
  const textColor = 'var(--color-text)'; // Use theme text color instead of hardcoded dark for dark mode visibility

  return (
    <div className="progress-bar-wrapper" style={style}>
      {(label || showPercent) && (
        <div className="progress-bar-meta">
          {label && <span className="progress-bar-label">{label}</span>}
          {showPercent && (
            <span className="progress-bar-pct" style={{ color: textColor }}>
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        className="progress-bar-track"
        style={{ height, backgroundColor: '#E5E7EB' }}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        role="progressbar"
      >
        <div
          className="progress-bar-fill"
          style={{
            width: `${clamped}%`,
            height: '100%',
            backgroundColor: barColor,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
