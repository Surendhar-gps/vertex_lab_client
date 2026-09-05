import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { user } = useAuth();
  const dashboardHref = user ? `/${user.role}/dashboard` : '/student/login';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-secondary)', textAlign: 'center', padding: 'var(--space-6)' }}>
      <div>
        <div style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
          Page Not Found
        </h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-6)' }}>
          The page you're looking for doesn't exist or you don't have access.
        </p>
        <Link to={dashboardHref} className="btn btn-primary btn-lg">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
