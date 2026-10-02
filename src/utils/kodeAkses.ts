// Sama dengan public.gen_kode_akses() di database: 8 karakter tanpa 0/O/1/I.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateKodeAkses(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

/** Hanya angka; 62812… / +62812… → 0812… (selaras dengan norm_hp di database). */
export function normalizePhone(raw: string): string {
  const d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('62')) return '0' + d.slice(2);
  if (d.startsWith('8')) return '0' + d;
  return d;
}
