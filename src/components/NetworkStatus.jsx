import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const CHECK_INTERVAL = 30000; // 30 seconds

const NetworkStatus = () => {
  const [status, setStatus] = useState('online'); // 'online' | 'offline'
  const intervalRef = useRef(null);

  const checkBackend = async () => {
    // First check browser connectivity
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }
    try {
      await api.get('/health', { timeout: 5000 });
      setStatus('online');
    } catch {
      setStatus('offline');
    }
  };

  useEffect(() => {
    checkBackend();

    intervalRef.current = setInterval(checkBackend, CHECK_INTERVAL);

    const goOnline = () => checkBackend();
    const goOffline = () => setStatus('offline');

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const isOnline = status === 'online';

  return (
    <div
      title={isOnline ? 'Backend connected' : 'Backend unreachable'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        fontSize: '12px',
        fontWeight: 500,
        color: isOnline ? '#16A34A' : '#DC2626',
        padding: '3px 8px',
        borderRadius: 'var(--border-radius-full)',
        background: isOnline ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
        border: `1px solid ${isOnline ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}`,
        transition: 'all 0.3s ease',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: isOnline ? '#16A34A' : '#DC2626',
          flexShrink: 0,
          boxShadow: isOnline ? '0 0 4px rgba(22,163,74,0.5)' : 'none',
        }}
      />
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
};

export default NetworkStatus;
