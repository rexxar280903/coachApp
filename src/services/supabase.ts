import { createClient } from '@supabase/supabase-js';

// Garis miring di akhir URL dibuang agar URL storage yang disusun aplikasi sama dengan buatan supabase-js.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim().replace(/\/+$/, '');
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export const isSupabaseConfigured = Boolean(url && anonKey);

// Saat env belum diisi, klien dibuat dengan nilai dummy agar import tidak crash;
// App menampilkan layar "konfigurasi belum lengkap" dan tidak memakainya.
export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'missing-anon-key',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
);

export const SUPABASE_URL = url || '';

// Dibaca sinkron, sebelum supabase-js selesai memproses & membersihkan hash URL, agar tautan
// "atur ulang kata sandi" tetap dikenali walau event PASSWORD_RECOVERY terpicu sebelum listener terpasang.
export const startedInRecovery =
  typeof window !== 'undefined' && /(^|[#&])type=recovery(&|$)/.test(window.location.hash);
