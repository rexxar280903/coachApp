/**
 * Shared constants used across the Hans Swimming application.
 */

export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des',
] as const;

/**
 * Returns the current year dynamically instead of hardcoding.
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Returns the current month (1-12) dynamically.
 */
export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

/**
 * Returns today's date in YYYY-MM-DD format, based on the device's local
 * timezone (WIB, not UTC — toISOString() would yield yesterday before 07:00).
 */
export function getTodayISO(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** YYYY-MM-DD → "7 Oktober 2026" (teks asli dikembalikan bila formatnya tidak dikenali). */
export function formatTanggalPanjang(iso: string): string {
  const [y, m, d] = (iso || '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d || m > 12) return iso || '-';
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

/**
 * Year options for dropdowns: a few years back through next year,
 * always including any extra years passed in (e.g. the selected year).
 */
export function getYearOptions(...include: number[]): number[] {
  const current = getCurrentYear();
  const years = new Set<number>(include.filter((y) => Number.isFinite(y)));
  for (let y = current - 4; y <= current + 1; y++) years.add(y);
  return Array.from(years).sort((a, b) => a - b);
}

/**
 * Returns current time in HH:MM format.
 */
export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5);
}
