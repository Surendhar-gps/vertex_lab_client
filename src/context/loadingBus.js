/**
 * loadingBus
 * A tiny pub/sub so code OUTSIDE React (like axios interceptors, which
 * can't use hooks) can still trigger the global page-morph loading state
 * that LoadingContext.jsx owns.
 *
 * You normally won't call this directly from your components — use the
 * useLoading() hook for that. This file exists so api.js can plug in.
 */

let listeners = [];

export const loadingBus = {
  subscribe(fn) {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },
  start(label) {
    listeners.forEach((fn) => fn('start', label));
  },
  stop() {
    listeners.forEach((fn) => fn('stop'));
  },
};
