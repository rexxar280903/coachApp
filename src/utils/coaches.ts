import { AttendanceSession, ClassGroup, Coach } from '../types/sportkit';

const normalizeName = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();

/** Pelatih yang mengampu kelas (berdasarkan ID; pelatih terhapus diabaikan). */
export function getClassCoaches(cls: ClassGroup, coaches: Coach[]): Coach[] {
  const ids = cls.pelatihIds ?? [];
  return ids
    .map((id) => coaches.find((c) => c.id === id))
    .filter((c): c is Coach => !!c);
}

/** Label nama pelatih untuk ditampilkan di UI. */
export function getClassCoachLabel(cls: ClassGroup, coaches: Coach[]): string {
  if (cls.pelatihIds) {
    const names = getClassCoaches(cls, coaches).map((c) => c.nama);
    return names.length > 0 ? names.join(' & ') : 'Belum ada pelatih';
  }
  return cls.pelatih || 'Belum ada pelatih';
}

/** Kelas yang diampu satu pelatih. */
export function getCoachClasses(coachId: string, classes: ClassGroup[]): ClassGroup[] {
  return classes.filter((c) => c.pelatihIds?.includes(coachId));
}

/** Nama pelatih pencatat sesi; ikut berubah jika pelatih diganti namanya. */
export function getSessionCoachLabel(session: AttendanceSession, coaches: Coach[]): string {
  const coach = session.pelatihId ? coaches.find((c) => c.id === session.pelatihId) : undefined;
  return coach?.nama || session.pelatih || '-';
}

/** Samakan snapshot `pelatih` dengan daftar pelatih terkini. */
export function syncClassSnapshots(classes: ClassGroup[], coaches: Coach[]): ClassGroup[] {
  return classes.map((cls) => {
    if (!cls.pelatihIds) return cls;
    const valid = cls.pelatihIds.filter((id) => coaches.some((c) => c.id === id));
    const snapshot = getClassCoaches({ ...cls, pelatihIds: valid }, coaches)
      .map((c) => c.nama)
      .join(' & ');
    if (snapshot === cls.pelatih && valid.length === cls.pelatihIds.length) return cls;
    return { ...cls, pelatihIds: valid, pelatih: snapshot };
  });
}

/**
 * Migrasi satu kali: data lama hanya menyimpan nama pelatih (teks).
 * Nama dicocokkan ke Coach; "A & B" / "A, B" dipecah jadi beberapa pelatih.
 */
export function migrateCoachLinks(
  classes: ClassGroup[],
  sessions: AttendanceSession[],
  coaches: Coach[]
): { classes: ClassGroup[]; sessions: AttendanceSession[]; changed: boolean } {
  let changed = false;
  const findByName = (name: string) =>
    coaches.find((c) => normalizeName(c.nama) === normalizeName(name));

  const migratedClasses = classes.map((cls) => {
    if (cls.pelatihIds) return cls;
    changed = true;
    const ids = (cls.pelatih || '')
      .split(/\s*(?:&|,|\bdan\b)\s*/i)
      .map((n) => findByName(n)?.id)
      .filter((id): id is string => !!id);
    return { ...cls, pelatihIds: Array.from(new Set(ids)) };
  });

  const migratedSessions = sessions.map((s) => {
    if (s.pelatihId) return s;
    const match = findByName(s.pelatih || '');
    if (!match) return s;
    changed = true;
    return { ...s, pelatihId: match.id };
  });

  return { classes: migratedClasses, sessions: migratedSessions, changed };
}

/** Nomor HP Indonesia: diawali 0 / 62 / +62, lalu 8–12 digit. */
export function isValidPhone(raw: string): boolean {
  return /^(\+62|62|0)\d{8,12}$/.test(raw.replace(/[\s-]/g, ''));
}

export const normalizePhone = (raw: string) => raw.replace(/\D/g, '').replace(/^62/, '0');

export { normalizeName };
