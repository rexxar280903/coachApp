export const PORTAL_SESSION_TTL_MS = 60 * 60 * 1000;
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

/** Only public Supabase credentials may be compiled into the browser bundle. */
export function validateSupabaseConfig(url: string, key: string, production = false): boolean {
  if (!url && !key) return false;
  if (!url || !key) throw new Error('URL Supabase dan publishable/anon key harus diisi bersama.');
  const parsed = new URL(url);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' ||
      (parsed.protocol !== 'https:' && !(local && !production && parsed.protocol === 'http:'))) {
    throw new Error('URL Supabase harus berupa origin HTTPS yang valid.');
  }
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  try {
    const parts = key.split('.');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (parts.length === 3 && payload.role === 'anon') return true;
  } catch { /* rejected below */ }
  throw new Error('Gunakan publishable/anon key. Secret atau service_role key dilarang di frontend.');
}

export function escapeCsvCell(value: string | number): string {
  let text = String(value);
  // Quoting alone does not stop Excel from evaluating attacker-controlled formulas.
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function passwordValidationError(password: string): string | null {
  if (password.length < 12 || password.length > 128) return 'Kata sandi harus 12–128 karakter.';
  return null;
}
