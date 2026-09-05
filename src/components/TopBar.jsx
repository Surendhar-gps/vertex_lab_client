import { useAuth } from '../context/AuthContext';
import NetworkStatus from './NetworkStatus';

const TopBar = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div>
        <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-text)' }}>
          {title || 'VERTEX LAB'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <NetworkStatus />
        {user && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
            {user.name || user.email}
          </span>
        )}
      </div>
    </header>
  );
};

export default TopBar;
