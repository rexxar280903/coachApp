import { PortalCredentials } from './storage';

// Sesi portal siswa hanya bertahan selama tab terbuka (sessionStorage).
const KEY = 'sportkit_portal_session';

export function loadPortalSession(): PortalCredentials | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.hp && parsed?.kode ? { hp: String(parsed.hp), kode: String(parsed.kode) } : null;
  } catch {
    return null;
  }
}

export function savePortalSession(creds: PortalCredentials) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(creds));
  } catch {
    /* sessionStorage tidak tersedia — pengguna cukup login ulang saat refresh */
  }
}

export function clearPortalSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* abaikan */
  }
}
