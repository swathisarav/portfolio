import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 767px)';

const subscribe = (onChange: () => void) => {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
};
const isMobileNow = () => window.matchMedia(QUERY).matches;

/**
 * True on phone-sized screens. Read straight from the media query, so it is
 * already right on the first render (no desktop-then-phone flash).
 */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, isMobileNow, () => false);
}
