export type Gender = 'Laki-laki' | 'Perempuan';

export type StudentStatus = 'Calon' | 'Aktif' | 'Cuti' | 'Nonaktif';

export type PaymentMethod = 
  | 'Transfer BCA' 
  | 'QRIS' 
  | 'Tunai' 
  | 'EDC BCA' 
  | 'Kartu Kredit'
  | 'Transfer Mandiri'
  | 'Transfer BRI';

export type FeeStatus = 'lunas' | 'belum_lunas' | 'belum_bayar' | 'belum_bergabung' | 'cuti';

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
  biayaPendaftaran: number;
  iuranBulanan: number;
  totalBiayaPendaftaran: number;
  foto?: string;
}

export interface ClassGroup {
  id: string;
  nama: string; // e.g. "KU-10", "KU-12", "Renang ACM 1", etc.
  deskripsi: string;
  iuranBulanan: number;
  biayaPendaftaran: number;
  pelatih: string;
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
  pelatih: string;
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
  namaKlub: string; // "CLS SURABAYA"
  cabangOlahraga: string;
  alamat: string;
  kota: string;
  noHp: string;
  email: string;
  noWhatsApp: string;
  logoUrl?: string;
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
