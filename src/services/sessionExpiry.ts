import { useEffect } from 'react';
import { IDLE_TIMEOUT_MS } from '../utils/security';

/** Local session hygiene; authorization and token expiry remain enforced by the server. */
export function useSessionExpiry(active: boolean, onExpired: () => void, deadline?: number) {
  useEffect(() => {
    if (!active) return;
    let lastActivity = Date.now();
    let ended = false;
    const check = () => {
      if (!ended && (Date.now() - lastActivity >= IDLE_TIMEOUT_MS || (deadline && Date.now() >= deadline))) {
        ended = true;
        onExpired();
      }
    };
    const touch = () => { check(); if (!ended) lastActivity = Date.now(); };
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((event) => window.addEventListener(event, touch, { passive: true }));
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    const timer = window.setInterval(check, 15_000);
    check();
    return () => {
      window.clearInterval(timer);
      events.forEach((event) => window.removeEventListener(event, touch));
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, [active, onExpired, deadline]);
}
