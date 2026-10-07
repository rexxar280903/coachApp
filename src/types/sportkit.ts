export type Gender = 'Laki-laki' | 'Perempuan';

export type StudentStatus = 'Calon' | 'Aktif' | 'Cuti' | 'Nonaktif';

export type CoachStatus = 'Aktif' | 'Nonaktif';

export interface Coach {
  id: string;
  nama: string;           // e.g. "Coach Dimas"
  noHp: string;
  email?: string;
  spesialisasi: string;   // e.g. "Basket", "Renang", "Atletik"
  status: CoachStatus;
  catatan?: string;
  tanggalBergabung: string; // YYYY-MM-DD
  foto?: string;
}

export type PaymentMethod = 
  | 'Transfer BCA' 
  | 'QRIS' 
  | 'Tunai' 
  | 'EDC BCA' 
  | 'Kartu Kredit'
  | 'Transfer Mandiri'
  | 'Transfer BRI';

export type FeeStatus = 'lunas' | 'belum_lunas' | 'belum_bayar' | 'belum_bergabung' | 'cuti' | 'nonaktif';

export interface ParentInfo {
  namaAyah: string;
  noHpAyah: string;
  namaIbu: string;
  noHpIbu: string;
}

export interface Student {
  id: string;
  nama: string;
  kelasId: string;
  jenisKelamin: Gender;
  tempatLahir: string;
  tanggalLahir: string;
  noHp: string;
  email?: string;
  alamat: string;
  orangTua: ParentInfo;
  status: StudentStatus;
  catatan?: string;
  tanggalBergabung: string; // YYYY-MM-DD
  tanggalStatus?: string;   // YYYY-MM-DD, kapan status terakhir diubah (untuk cuti/nonaktif)
  biayaPendaftaran: number;
  iuranBulanan: number;
  totalBiayaPendaftaran: number;
  foto?: string;
  /** Kode rahasia untuk login Portal Siswa (bersama No. HP). Dibuat otomatis. */
  kodeAkses?: string;
}

export interface ClassGroup {
  id: string;
  nama: string; // e.g. "KU-10", "KU-12", "Renang ACM 1", etc.
  deskripsi: string;
  iuranBulanan: number;
  biayaPendaftaran: number;
  pelatihIds?: string[]; // relasi ke Coach.id (sumber kebenaran)
  pelatih: string;       // snapshot nama (fallback data lama / pelatih terhapus)
}

export interface MonthlyDueRecord {
  id: string;
  siswaId: string;
  tahun: number;
  bulan: number; // 1 to 12
  status: FeeStatus;
  nominal: number;
  terbayar: number;
  tanggalBayar?: string;
  kuitansiId?: string;
}

export interface ClubEvent {
  id: string;
  nama: string; // e.g. "Familia Cup", "Kejurnas 2023"
  deskripsi: string;
  nominal: number;
  tanggal: string;
  lokasi: string;
  totalPeserta: number;
  pesertaLunas: number;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  siswaId: string;
  status: FeeStatus; // 'lunas' | 'belum_lunas' | 'belum_bayar'
  nominal: number;
  terbayar: number;
  tanggalBayar?: string;
  kuitansiId?: string;
}

export interface AttendanceSession {
  id: string;
  tanggal: string; // YYYY-MM-DD
  kelasId: string;
  catatan: string;
  pelatihId?: string; // relasi ke Coach.id
  pelatih: string;    // snapshot nama (fallback)
  kehadiran: {
    [siswaId: string]: boolean; // true = hadir, false = absen
  };
}

export interface PaymentTransaction {
  id: string;
  nomorKuitansi: string; // e.g. INVSP-241105-006
  siswaId: string;
  siswaNama: string;
  kelasNama: string;
  tanggal: string;
  nominal: number;
  terbilang: string;
  metodePembayaran: PaymentMethod;
  tipe: 'Pendaftaran Siswa Baru' | 'Iuran Rutin' | 'Iuran Insidentil' | 'Angsuran';
  keterangan: string;
  catatan?: string;
}

export interface ClubProfile {
  namaKlub: string; // "Hans Swimming"
  cabangOlahraga: string;
  alamat: string;
  kota: string;
  noHp: string;
  email: string;
  noWhatsApp: string;
  logoUrl?: string;
  /** Rekening tujuan transfer iuran (ditampilkan di Portal Siswa). */
  namaBank?: string;
  noRekening?: string;
  atasNama?: string;
}

export type UserRole = 'admin' | 'coach' | 'student' | 'public';

export type SubmissionStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentSubmission {
  id: string;
  siswaId: string;
  siswaNama: string;
  kelasId: string;
  kelasNama: string;
  tipe: 'Iuran Rutin' | 'Iuran Insidentil' | 'Pendaftaran';
  bulan?: number; // 1-12
  tahun?: number;
  eventId?: string;
  eventNama?: string;
  nominal: number;
  metodePembayaran: PaymentMethod;
  tanggalTransfer: string;
  buktiGambarUrl: string;
  pesanSiswa?: string;
  status: SubmissionStatus;
  tanggalKirim: string;
  tanggalVerifikasi?: string;
  diverifikasiOleh?: string;
  catatanAdmin?: string;
  kuitansiId?: string;
  transactionId?: string;
}

// ─── Rapor (laporan perkembangan siswa) ──────────────────────────────────────

/**
 * Jenis item penilaian pada template rapor:
 *  - judul    : judul bagian (mis. "Kemampuan"), tanpa isian
 *  - isian    : jawaban singkat satu baris (mis. "Tinggi Badan (cm)")
 *  - paragraf : jawaban panjang (mis. catatan pelatih)
 *  - checkbox : boleh pilih lebih dari satu opsi
 *  - pilihan  : pilih satu opsi (radio)
 *  - dropdown : pilih satu opsi (daftar turun)
 */
export type RaporItemTipe = 'judul' | 'isian' | 'paragraf' | 'checkbox' | 'pilihan' | 'dropdown';

export interface RaporItem {
  id: string;
  tipe: RaporItemTipe;
  label: string;
  /** Hanya untuk checkbox / pilihan / dropdown. */
  opsi?: string[];
  wajib?: boolean;
}

/** Blangko rapor yang bisa dipakai berulang untuk banyak folder/kelas. */
export interface RaporTemplate {
  id: string;
  nama: string;     // e.g. "Blangko Rapor KU-10 & KU-12"
  header: string;   // teks pembuka di atas tabel penilaian
  items: RaporItem[];
  footer: string;   // teks penutup di bawah rapor
}

/** Satu periode penilaian untuk satu kelas, memakai satu template. */
export interface RaporFolder {
  id: string;
  nama: string;           // e.g. "Laporan Perkembangan KU-10, Semester 1, 2025"
  awalPenilaian: string;  // YYYY-MM-DD
  akhirPenilaian: string; // YYYY-MM-DD
  kelasId: string;
  templateId: string;
  /** Bila true, rapor yang sudah diisi tampil di Portal Siswa. */
  diterbitkan: boolean;
}

export type RaporJawaban = Record<string, string | string[]>;

/** Isian rapor satu siswa di satu folder. */
export interface RaporEntry {
  id: string;
  folderId: string;
  siswaId: string;
  jawaban: RaporJawaban; // kunci = RaporItem.id
  diisiOleh: string;
  tanggalIsi: string; // "YYYY-MM-DD HH:mm"
}
