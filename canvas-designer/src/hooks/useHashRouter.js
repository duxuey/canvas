import { useState, useEffect, useCallback } from 'react';

export function useHashRouter() {
  const [route, setRoute] = useState(() => parseHash());

  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((hash) => {
    window.location.hash = hash;
  }, []);

  return { route, navigate };
}

function parseHash() {
  const hash = window.location.hash.replace('#', '') || 'designer';
  const [view, ...params] = hash.split('/');
  const search = window.location.search;
  return { view, params, search };
}
