import { AlertCircle } from 'lucide-react';

export const LoadingSpinner = ({ size = 'default' }) => (
  <div className="loading-center">
    <div className={`spinner${size === 'lg' ? ' spinner-lg' : ''}`} />
  </div>
);

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="empty-state">
    {Icon && <Icon size={40} className="empty-state-icon" />}
    <h3 className="empty-state-title">{title}</h3>
    {text && <p className="empty-state-text">{text}</p>}
    {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
  </div>
);

export const ErrorMessage = ({ message }) =>
  message ? (
    <div className="alert alert-error">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  ) : null;

export const SuccessMessage = ({ message }) =>
  message ? (
    <div className="alert alert-success">
      <span>{message}</span>
    </div>
  ) : null;

export const Badge = ({ variant = 'gray', children }) => (
  <span className={`badge badge-${variant}`}>{children}</span>
);

export const getStatusBadge = (status) => {
  const map = {
    pending: { variant: 'yellow', label: 'Pending' },
    evaluated: { variant: 'blue', label: 'Evaluated' },
    reviewed: { variant: 'green', label: 'Reviewed' },
  };
  const { variant, label } = map[status] || { variant: 'gray', label: status };
  return <Badge variant={variant}>{label}</Badge>;
};

import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const BackLink = ({ to, label = 'Back' }) => (
  <div style={{ marginBottom: 'var(--space-4)' }}>
    <Link
      to={to}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color: 'var(--color-muted)',
        fontSize: 'var(--text-sm)',
        fontWeight: 500,
        transition: 'color var(--transition)'
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted)')}
    >
      <ChevronLeft size={16} /> {label}
    </Link>
  </div>
);

export const Avatar = ({ user, size = 32, style = {} }) => {
  if (!user) return null;
  const { name, email, avatarUrl } = user;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || email}
        style={{
          width: size,
          height: size,
          borderRadius: 'var(--border-radius-full)',
          objectFit: 'cover',
          ...style
        }}
      />
    );
  }

  // Generate initials
  let initials = '?';
  if (name) {
    const parts = name.split(' ');
    initials = parts.length > 1
      ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  } else if (email) {
    initials = email.substring(0, 2).toUpperCase();
  }

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 'var(--border-radius-full)',
      backgroundColor: 'var(--color-primary-light)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.4,
      fontWeight: 600,
      color: 'var(--color-primary)',
      flexShrink: 0,
      ...style
    }}>
      {initials}
    </div>
  );
};

/**
 * LoadingOverlay
 * Wrap any card/section/page content in this. While `active` is true, the
 * content underneath MORPHS: it blurs, dims, and scales down very slightly
 * (instead of just having a layer plonked on top of it untouched), while a
 * centered spinner fades in above it. When `active` flips back to false,
 * everything smoothly reverses — content sharpens, un-dims, and returns to
 * full scale — instead of snapping back instantly.
 *
 * Usage (unchanged):
 *   <LoadingOverlay active={submitting} label="Saving...">
 *     <form>...</form>
 *   </LoadingOverlay>
 *
 * For a true full-screen version (covers the whole viewport, e.g. during
 * a page-level transition rather than one card/form), pass fullScreen.
 */
export const LoadingOverlay = ({ active, children, label, fullScreen = false }) => (
  <div style={{ position: fullScreen ? undefined : 'relative' }}>
    <div
      style={{
        transition: 'filter 420ms cubic-bezier(0.4, 0, 0.2, 1), transform 420ms cubic-bezier(0.4, 0, 0.2, 1), opacity 420ms cubic-bezier(0.4, 0, 0.2, 1)',
        filter: active ? 'blur(5px) saturate(0.85)' : 'blur(0px) saturate(1)',
        transform: active ? 'scale(0.985)' : 'scale(1)',
        opacity: active ? 0.6 : 1,
        transformOrigin: 'center top',
        willChange: 'filter, transform, opacity',
      }}
    >
      {children}
    </div>
    <div
      aria-hidden={!active}
      style={{
        position: fullScreen ? 'fixed' : 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
        background: 'rgba(255,255,255,0.35)',
        backdropFilter: 'blur(2px)',
        WebkitBackdropFilter: 'blur(2px)',
        borderRadius: fullScreen ? 0 : 'inherit',
        opacity: active ? 1 : 0,
        visibility: active ? 'visible' : 'hidden',
        transform: active ? 'scale(1)' : 'scale(0.97)',
        transition: 'opacity 320ms ease 120ms, transform 320ms ease 120ms, visibility 420ms',
        zIndex: fullScreen ? 10000 : 5,
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      <div className="spinner spinner-lg" />
      {label && (
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)', fontWeight: 500 }}>
          {label}
        </div>
      )}
    </div>
  </div>
);