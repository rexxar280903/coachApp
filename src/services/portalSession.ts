import type { PortalCredentials } from './storage';
import { normalizePhone } from '../utils/kodeAkses';
import { PORTAL_SESSION_TTL_MS } from '../utils/security';

// Sesi portal siswa hanya bertahan selama tab terbuka (sessionStorage).
const KEY = 'sportkit_portal_session';
export interface PortalSession extends PortalCredentials { expiresAt: number }

export function loadPortalSession(): PortalSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.hp !== 'string' || typeof parsed?.kode !== 'string' ||
        !/^0\d{8,14}$/.test(parsed.hp) || !/^[A-HJ-NP-Z2-9]{8}([A-HJ-NP-Z2-9]{4})?$/.test(parsed.kode) ||
        !Number.isFinite(parsed.expiresAt) || parsed.expiresAt <= Date.now() ||
        parsed.expiresAt > Date.now() + PORTAL_SESSION_TTL_MS) {
      clearPortalSession();
      return null;
    }
    return { hp: parsed.hp, kode: parsed.kode, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

export function savePortalSession(creds: PortalCredentials): PortalSession {
  const session = { hp: normalizePhone(creds.hp), kode: creds.kode.trim().toUpperCase(), expiresAt: Date.now() + PORTAL_SESSION_TTL_MS };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* sessionStorage tidak tersedia — pengguna cukup login ulang saat refresh */
  }
  return session;
}

export function clearPortalSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}
