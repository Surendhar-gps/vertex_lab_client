import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { loadingBus } from './loadingBus';

/**
 * Global loading context.
 * Mount <LoadingProvider> ONCE at the root of your app (in App.jsx,
 * wrapping everything else).
 *
 * Two ways loading gets triggered:
 * 1. AUTOMATIC — every axios request/response (see api.js) pings
 *    loadingBus, which this provider listens to. Most of your app's
 *    loading states now work with ZERO extra code per page.
 * 2. MANUAL — for loading states that aren't API calls (e.g. waiting on
 *    a file to process locally), call the hook directly:
 *      const { startLoading, stopLoading, withLoading } = useLoading();
 */

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState('');
  const countRef = useRef(0);

  const startLoading = (msg = '') => {
    countRef.current += 1;
    if (msg) setLabel(msg);
    setActive(true);
  };

  const stopLoading = () => {
    countRef.current = Math.max(0, countRef.current - 1);
    if (countRef.current === 0) {
      setActive(false);
      setLabel('');
    }
  };

  const withLoading = async (promise, msg = '') => {
    startLoading(msg);
    try {
      return await promise;
    } finally {
      stopLoading();
    }
  };

  // Listen for automatic triggers coming from axios (api.js)
  useEffect(() => {
    const unsubscribe = loadingBus.subscribe((action, msg) => {
      if (action === 'start') startLoading(msg);
      if (action === 'stop') stopLoading();
    });
    return unsubscribe;
  }, []);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, withLoading }}>
      <div
        style={{
          transition: 'filter 420ms cubic-bezier(0.4, 0, 0.2, 1), transform 420ms cubic-bezier(0.4, 0, 0.2, 1), opacity 420ms cubic-bezier(0.4, 0, 0.2, 1)',
          filter: active ? 'blur(5px) saturate(0.85)' : 'blur(0px) saturate(1)',
          transform: active ? 'scale(0.985)' : 'scale(1)',
          opacity: active ? 0.6 : 1,
          transformOrigin: 'center top',
          willChange: 'filter, transform, opacity',
          minHeight: '100vh',
        }}
      >
        {children}
      </div>

      <div
        aria-hidden={!active}
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          background: 'rgba(255,255,255,0.35)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          opacity: active ? 1 : 0,
          visibility: active ? 'visible' : 'hidden',
          transform: active ? 'scale(1)' : 'scale(0.97)',
          transition: 'opacity 320ms ease 120ms, transform 320ms ease 120ms, visibility 420ms',
          zIndex: 10000,
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
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading must be used inside <LoadingProvider>');
  }
  return ctx;
};
