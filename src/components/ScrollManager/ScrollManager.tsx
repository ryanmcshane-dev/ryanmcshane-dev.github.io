import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * On route change, scroll to top (or to the hash target if present). Keeps SPA
 * navigation feeling like real page loads and makes in-page anchor links work.
 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
