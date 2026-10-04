import { RaporItem, RaporItemTipe, RaporJawaban, RaporTemplate } from '../types/sportkit';

export const RAPOR_ITEM_TIPE_LABEL: Record<RaporItemTipe, string> = {
  judul: 'Judul Bagian',
  isian: 'Isian Singkat',
  paragraf: 'Paragraf',
  checkbox: 'Checkbox (pilih banyak)',
  pilihan: 'Pilihan Ganda (pilih satu)',
  dropdown: 'Dropdown (pilih satu)',
};

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
  return template.items.filter((it) => it.tipe !== 'judul' && it.wajib && isJawabanKosong(jawaban[it.id]));
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
