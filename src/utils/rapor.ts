import { RaporItem, RaporItemTipe, RaporJawaban, RaporTemplate, RaporTtd, RaporTtdSumber } from '../types/sportkit';

export const RAPOR_ITEM_TIPE_LABEL: Record<RaporItemTipe, string> = {
  judul: 'Judul Bagian',
  isian: 'Isian Singkat',
  paragraf: 'Paragraf',
  checkbox: 'Checkbox (pilih banyak)',
  pilihan: 'Pilihan Ganda (pilih satu)',
  dropdown: 'Dropdown (pilih satu)',
  pertemuan: 'Evaluasi Pertemuan (B/C/M)',
  kelulusan: 'Rekap Kelulusan Level',
};

export const RAPOR_NILAI_RENANG = [
  { kode: 'B', label: 'Belum Mampu', deskripsi: 'Membutuhkan bantuan penuh dari pelatih.' },
  { kode: 'C', label: 'Cukup / Dalam Proses', deskripsi: 'Bisa melakukan gerakan dengan instruksi/sedikit bantuan.' },
  { kode: 'M', label: 'Mahir / Mandiri', deskripsi: 'Dapat melakukan gerakan secara mandiri, stabil, dan konsisten sesuai standar teknik.' },
] as const;

export const RAPOR_STATUS_KELULUSAN = ['Lulus', 'Mengulang'] as const;

export const structuredRaporAnswer = (value: string | string[] | undefined): string[] =>
  Array.isArray(value) ? value : [];

export const isSwimmingTemplate = (template: RaporTemplate) => template.items.some((it) => it.tipe === 'pertemuan');

export const RAPOR_TTD_SUMBER_LABEL: Record<RaporTtdSumber, string> = {
  manual: 'Nama tetap (diketik)',
  pelatih: 'Otomatis: pelatih pengisi rapor',
  orangtua: 'Otomatis: orang tua siswa',
};

/** Batas jumlah kolom tanda tangan agar tetap muat satu baris di kertas A4. */
export const RAPOR_TTD_MAX = 4;

/** Kolom TTD bawaan (perilaku lama template renang). */
export const defaultRaporTtd = (): RaporTtd[] => [
  { id: newRaporId('ttd'), jabatan: 'Orangtua Murid', sumberNama: 'orangtua' },
  { id: newRaporId('ttd'), jabatan: 'Pelatih', sumberNama: 'pelatih' },
];

/** Kolom TTD yang dicetak: pengaturan template, atau bawaan untuk template renang lama. */
export function raporSignatures(template: RaporTemplate): RaporTtd[] {
  if (Array.isArray(template.ttd)) return template.ttd;
  return isSwimmingTemplate(template) ? defaultRaporTtd() : [];
}

/** Usia pada akhir periode, bukan pada tanggal ketika rapor dibuka. */
export function usiaPadaTanggal(lahir: string | undefined, tanggal: string): string {
  if (!isValidRaporDate(lahir ?? '') || !isValidRaporDate(tanggal) || lahir! > tanggal) return '-';
  const [year, month, day] = lahir!.split('-').map(Number);
  const [endYear, endMonth, endDay] = tanggal.split('-').map(Number);
  const age = endYear - year - (endMonth < month || (endMonth === month && endDay < day) ? 1 : 0);
  return `${age} tahun`;
}

export function isValidRaporDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Tipe yang memakai daftar opsi. */
export const hasOpsi = (tipe: RaporItemTipe) => tipe === 'checkbox' || tipe === 'pilihan' || tipe === 'dropdown';

export const newRaporId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/** YYYY-MM-DD → DD/MM/YYYY */
export function formatTanggalRapor(iso: string): string {
  const [y, m, d] = (iso || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso || '-';
}

export function formatPeriode(awal: string, akhir: string): string {
  return `${formatTanggalRapor(awal)} - ${formatTanggalRapor(akhir)}`;
}

export function jawabanText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.join(', ');
  return (value ?? '').trim();
}

export function isJawabanKosong(value: string | string[] | undefined): boolean {
  return Array.isArray(value) ? value.length === 0 : !(value ?? '').trim();
}

/** Item wajib yang belum diisi (untuk validasi sebelum disimpan). */
export function missingRequired(template: RaporTemplate, jawaban: RaporJawaban): RaporItem[] {
  return template.items.filter((it) => {
    if (it.tipe === 'judul' || !it.wajib) return false;
    const value = jawaban[it.id];
    return it.tipe === 'pertemuan' || it.tipe === 'kelulusan'
      ? isJawabanKosong(structuredRaporAnswer(value)[0])
      : isJawabanKosong(value);
  });
}

/** Validasi isian terstruktur tanpa mewajibkan semua pertemuan selesai sekaligus. */
export function raporValidationError(template: RaporTemplate, jawaban: RaporJawaban): string | null {
  for (const it of template.items) {
    if (it.tipe !== 'pertemuan' && it.tipe !== 'kelulusan') continue;
    const raw = jawaban[it.id];
    if (raw !== undefined && !Array.isArray(raw)) return `Format jawaban ${it.label} tidak valid.`;
    const [nilai = '', tanggal = '', pelatih = ''] = structuredRaporAnswer(raw);
    if (it.tipe === 'pertemuan') {
      if (nilai && !RAPOR_NILAI_RENANG.some((n) => n.kode === nilai)) return `Pilih nilai B, C, atau M untuk ${it.label}.`;
    } else {
      if (nilai && !RAPOR_STATUS_KELULUSAN.some((s) => s === nilai)) return `Status ${it.label} tidak valid.`;
      if (tanggal && !isValidRaporDate(tanggal)) return `Tanggal lulus ${it.label} tidak valid.`;
      if (nilai === 'Lulus' && !tanggal) return `Isi tanggal lulus untuk ${it.label}.`;
      if (nilai && !pelatih.trim()) return `Isi nama pelatih penandatangan untuk ${it.label}.`;
      if (nilai !== 'Lulus' && tanggal) return `Tanggal lulus hanya diisi untuk status Lulus pada ${it.label}.`;
    }
  }
  return null;
}

/** Buang jawaban item terhapus serta elemen di luar format masing-masing tipe. */
export function cleanRaporAnswers(template: RaporTemplate, jawaban: RaporJawaban): RaporJawaban {
  const clean: RaporJawaban = {};
  for (const it of template.items) {
    const value = jawaban[it.id];
    if (it.tipe === 'judul' || value === undefined) continue;
    if (it.tipe === 'pertemuan' || it.tipe === 'kelulusan') {
      const length = it.tipe === 'pertemuan' ? 2 : 3;
      const parts = structuredRaporAnswer(value);
      clean[it.id] = Array.from({ length }, (_, i) => (parts[i] ?? '').trim());
    } else {
      clean[it.id] = typeof value === 'string' ? value.trim() : value.map((v) => v.trim()).filter(Boolean);
    }
  }
  return clean;
}

export function raporProgress(template: RaporTemplate, jawaban: RaporJawaban): { dinilai: number; total: number } {
  const pertemuan = template.items.filter((it) => it.tipe === 'pertemuan');
  return {
    total: pertemuan.length,
    dinilai: pertemuan.filter((it) => RAPOR_NILAI_RENANG.some((n) => n.kode === structuredRaporAnswer(jawaban[it.id])[0])).length,
  };
}

export interface RaporSection {
  /** Null untuk item sebelum judul bagian pertama. */
  judul: string | null;
  items: RaporItem[];
}

/** Kelompokkan item per judul bagian, sesuai urutan di template. */
export function groupRaporSections(items: RaporItem[]): RaporSection[] {
  const sections: RaporSection[] = [];
  let current: RaporSection = { judul: null, items: [] };
  for (const it of items) {
    if (it.tipe === 'judul') {
      if (current.judul !== null || current.items.length > 0) sections.push(current);
      current = { judul: it.label, items: [] };
    } else {
      current.items.push(it);
    }
  }
  if (current.judul !== null || current.items.length > 0) sections.push(current);
  return sections;
}

/** Template contoh, mengikuti blangko di video panduan. */
export function createSampleTemplate(footer: string): RaporTemplate {
  const item = (tipe: RaporItemTipe, label: string, opsi?: string[]): RaporItem => ({
    id: newRaporId('itm'),
    tipe,
    label,
    ...(opsi ? { opsi } : {}),
  });
  const nilai = ['A', 'AB', 'B', 'BC', 'C'];
  return {
    id: newRaporId('tpl'),
    nama: 'Blangko Rapor Renang',
    header: 'Laporan Perkembangan Siswa',
    items: [
      item('isian', 'Tinggi Badan (cm)'),
      item('isian', 'Berat Badan (kg)'),
      item('judul', 'Kemampuan'),
      item('checkbox', 'Gaya yang Dikuasai', ['Gaya Bebas', 'Gaya Dada', 'Gaya Punggung', 'Gaya Kupu-kupu']),
      item('judul', 'Penilaian'),
      item('pilihan', 'Teknik Pernapasan', nilai),
      item('pilihan', 'Stamina', nilai),
      item('pilihan', 'Kedisiplinan', nilai),
      item('judul', 'Catatan Pelatih'),
      item('paragraf', 'Kendala yang dihadapi siswa'),
    ],
    footer,
  };
}
