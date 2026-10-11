import { createClient } from '@supabase/supabase-js';
import { validateSupabaseConfig } from '../utils/security';

// Garis miring di akhir URL dibuang agar URL storage yang disusun aplikasi sama dengan buatan supabase-js.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/+$/, '');
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = validateSupabaseConfig(url || '', anonKey || '', import.meta.env.PROD);

const memorySession = new Map<string, string>();
export const STAFF_SESSION_KEY = 'sportkit_staff_session';
const tabStorage = {
  getItem: (key: string) => { try { return sessionStorage.getItem(key); } catch { return memorySession.get(key) ?? null; } },
  setItem: (key: string, value: string) => { try { sessionStorage.setItem(key, value); } catch { memorySession.set(key, value); } },
  removeItem: (key: string) => { memorySession.delete(key); try { sessionStorage.removeItem(key); } catch { /* unavailable */ } },
};

// Remove the previous persistent browser token after switching to tab-scoped sessions.
if (url && typeof window !== 'undefined') {
  try { localStorage.removeItem(`sb-${new URL(url).hostname.split('.')[0]}-auth-token`); } catch { /* unavailable */ }
}

// Saat env belum diisi, klien dibuat dengan nilai dummy agar import tidak crash;
// App menampilkan layar "konfigurasi belum lengkap" dan tidak memakainya.
export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'missing-anon-key',
  { auth: {
    storage: tabStorage, storageKey: STAFF_SESSION_KEY, persistSession: true, autoRefreshToken: true,
    detectSessionInUrl: typeof window !== 'undefined' && window.location.pathname === '/reset-password',
  } },
);

export const SUPABASE_URL = url || '';

// Dibaca sinkron, sebelum supabase-js selesai memproses & membersihkan hash URL, agar tautan
// "atur ulang kata sandi" tetap dikenali walau event PASSWORD_RECOVERY terpicu sebelum listener terpasang.
export const startedInRecovery =
  typeof window !== 'undefined' && window.location.pathname === '/reset-password' &&
  /(^|[#&])type=recovery(&|$)/.test(window.location.hash);
