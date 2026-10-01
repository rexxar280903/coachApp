/**
 * Shared constants used across the SportKit application.
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
 * Returns today's date in YYYY-MM-DD format.
 */
export function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns current time in HH:MM format.
 */
export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5);
}
