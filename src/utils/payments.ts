import { EventParticipant, FeeStatus, MonthlyDueRecord, PaymentSubmission, PaymentTransaction, Student } from '../types/sportkit';
import { MONTH_NAMES, getCurrentMonth, getCurrentYear } from './constants';
import { numberToWordsId } from './numberToWordsId';

/** Status tagihan berdasarkan jumlah yang sudah terbayar. */
export function statusFromPaid(nominal: number, terbayar: number): FeeStatus {
  if (terbayar <= 0) return 'belum_bayar';
  return terbayar >= nominal ? 'lunas' : 'belum_lunas';
}

// ─── Periode bulan (tahun*12 + bulan) ────────────────────────────────────────

const toPeriod = (tahun: number, bulan: number) => tahun * 12 + (bulan - 1);
const fromPeriod = (p: number) => ({ tahun: Math.floor(p / 12), bulan: (p % 12) + 1 });
const currentPeriod = () => toPeriod(getCurrentYear(), getCurrentMonth());

function periodOf(isoDate?: string): number | null {
  if (!isoDate) return null;
  const [y, m] = isoDate.split('-').map(Number);
  return y && m ? toPeriod(y, m) : null;
}

/**
 * Status iuran sebuah bulan. Bila sudah ada record, record yang dipakai.
 * Bila belum, status diturunkan dari tanggal bergabung dan status siswa,
 * sehingga bulan sebelum bergabung / selama cuti tidak tampil sebagai tunggakan.
 */
export function effectiveDueStatus(
  student: Pick<Student, 'status' | 'tanggalBergabung' | 'tanggalStatus'>,
  due: MonthlyDueRecord | undefined,
  bulan: number,
  tahun: number
): FeeStatus {
  if (due) return due.status;
  if (student.status === 'Calon') return 'belum_bergabung';

  const target = toPeriod(tahun, bulan);
  const joined = periodOf(student.tanggalBergabung);
  if (joined !== null && target < joined) return 'belum_bergabung';

  if (student.status === 'Cuti' || student.status === 'Nonaktif') {
    const since = periodOf(student.tanggalStatus) ?? currentPeriod();
    if (target >= since) return student.status === 'Cuti' ? 'cuti' : 'nonaktif';
  }
  return 'belum_bayar';
}

/** Bulan dengan status ini tidak ditagih / tidak bisa dibayar. */
export function isNonBillable(status: FeeStatus): boolean {
  return status === 'belum_bergabung' || status === 'cuti' || status === 'nonaktif';
}

export const FEE_STATUS_LABEL: Record<FeeStatus, string> = {
  lunas: 'Lunas',
  belum_lunas: 'Belum Lunas (Cicilan)',
  belum_bayar: 'Belum Bayar',
  belum_bergabung: 'Belum Bergabung',
  cuti: 'Cuti',
  nonaktif: 'Nonaktif',
};

/**
 * Saat siswa keluar dari status Cuti/Nonaktif, bulan-bulan selama status itu
 * dikunci sebagai record 'cuti'/'nonaktif' (nominal 0) agar tidak berubah jadi tunggakan.
 * Bulan berjalan tidak dikunci (mulai ditagih lagi).
 */
export function freezeInactiveMonths(
  dues: MonthlyDueRecord[],
  student: Pick<Student, 'id' | 'status' | 'tanggalStatus'>
): MonthlyDueRecord[] {
  if (student.status !== 'Cuti' && student.status !== 'Nonaktif') return dues;
  const status: FeeStatus = student.status === 'Cuti' ? 'cuti' : 'nonaktif';
  const since = periodOf(student.tanggalStatus) ?? currentPeriod();
  const added: MonthlyDueRecord[] = [];
  for (let p = since; p < currentPeriod(); p++) {
    const { tahun, bulan } = fromPeriod(p);
    if (findMonthlyDue(dues, student.id, bulan, tahun)) continue;
    added.push({ id: `due-${student.id}-${tahun}-${bulan}`, siswaId: student.id, tahun, bulan, status, nominal: 0, terbayar: 0 });
  }
  return added.length ? [...dues, ...added] : dues;
}

export function findMonthlyDue(
  dues: MonthlyDueRecord[],
  siswaId: string,
  bulan: number,
  tahun: number
): MonthlyDueRecord | undefined {
  return dues.find((d) => d.siswaId === siswaId && d.bulan === bulan && d.tahun === tahun);
}

/**
 * Catat pembayaran (penuh atau cicilan) ke tagihan bulanan.
 * Pembayaran bersifat kumulatif: `terbayar` ditambah, `nominal` tagihan tidak berubah,
 * dan status menjadi 'lunas' hanya jika total terbayar sudah menutup tagihan.
 * Jika tagihan bulan itu belum ada, dibuat baru dengan `nominalTagihan`.
 */
export function applyMonthlyPayment(
  dues: MonthlyDueRecord[],
  params: {
    siswaId: string;
    bulan: number;
    tahun: number;
    nominalTagihan: number;
    jumlah: number;
    tanggalBayar: string;
    kuitansiId: string;
  }
): MonthlyDueRecord[] {
  const { siswaId, bulan, tahun, nominalTagihan, jumlah, tanggalBayar, kuitansiId } = params;
  const existing = findMonthlyDue(dues, siswaId, bulan, tahun);

  if (existing) {
    // Tagihan 'belum_bergabung'/'cuti' bernominal 0 → pakai tarif yang berlaku.
    const nominal = existing.nominal > 0 ? existing.nominal : nominalTagihan;
    const terbayar = (existing.terbayar || 0) + jumlah;
    return dues.map((d) =>
      d === existing
        ? { ...d, nominal, terbayar, status: statusFromPaid(nominal, terbayar), tanggalBayar, kuitansiId }
        : d
    );
  }

  const nominal = nominalTagihan > 0 ? nominalTagihan : jumlah;
  return [
    ...dues,
    {
      id: `due-${siswaId}-${tahun}-${bulan}`,
      siswaId,
      bulan,
      tahun,
      nominal,
      terbayar: jumlah,
      status: statusFromPaid(nominal, jumlah),
      tanggalBayar,
      kuitansiId,
    },
  ];
}

/** Catat pembayaran (penuh atau cicilan) untuk peserta event. */
export function applyEventPayment(
  participants: EventParticipant[],
  participantId: string,
  jumlah: number,
  tanggalBayar: string,
  kuitansiId: string
): EventParticipant[] {
  return participants.map((p) => {
    if (p.id !== participantId) return p;
    const terbayar = (p.terbayar || 0) + jumlah;
    return { ...p, terbayar, status: statusFromPaid(p.nominal, terbayar), tanggalBayar, kuitansiId };
  });
}

/**
 * Hitung ulang totalPeserta & pesertaLunas dari data peserta untuk event tertentu.
 * Hanya event yang disebut yang dihitung ulang (event demo lama tidak punya data peserta).
 */
export function recountEvents<T extends { id: string; totalPeserta: number; pesertaLunas: number }>(
  events: T[],
  participants: EventParticipant[],
  eventIds: string[]
): T[] {
  const ids = new Set(eventIds);
  return events.map((e) => {
    if (!ids.has(e.id)) return e;
    const parts = participants.filter((p) => p.eventId === e.id);
    return {
      ...e,
      totalPeserta: parts.length,
      pesertaLunas: parts.filter((p) => p.status === 'lunas').length,
    };
  });
}

/**
 * Kuitansi untuk sebuah bukti bayar terverifikasi. Memakai transaksi asli bila ada;
 * untuk data lama tanpa transaksi, kuitansi disusun ulang dari data bukti bayar.
 */
export function receiptForSubmission(
  sub: PaymentSubmission,
  transactions: PaymentTransaction[]
): PaymentTransaction {
  const existing = transactions.find(
    (t) => (sub.transactionId && t.id === sub.transactionId) || (sub.kuitansiId && t.nomorKuitansi === sub.kuitansiId)
  );
  if (existing) return existing;

  const tipe = sub.tipe === 'Pendaftaran' ? 'Pendaftaran Siswa Baru' : sub.tipe;
  const label = submissionPeriodLabel(sub);
  return {
    id: sub.transactionId || `tx-${sub.id}`,
    nomorKuitansi: sub.kuitansiId || '-',
    siswaId: sub.siswaId,
    siswaNama: sub.siswaNama,
    kelasNama: sub.kelasNama,
    tanggal: sub.tanggalVerifikasi || sub.tanggalTransfer,
    nominal: sub.nominal,
    terbilang: numberToWordsId(sub.nominal),
    metodePembayaran: sub.metodePembayaran,
    tipe,
    keterangan: label === tipe ? tipe : `${sub.tipe} ${label}`,
    catatan: sub.catatanAdmin,
  };
}

/** Label periode / keperluan sebuah bukti bayar, mis. "Oktober 2026", nama event, atau "Pendaftaran Siswa Baru". */
export function submissionPeriodLabel(sub: Pick<PaymentSubmission, 'tipe' | 'bulan' | 'tahun' | 'eventNama'>): string {
  if (sub.bulan && sub.tahun) return `${MONTH_NAMES[sub.bulan - 1]} ${sub.tahun}`;
  if (sub.tipe === 'Iuran Insidentil') return sub.eventNama || 'Event / Kegiatan';
  if (sub.tipe === 'Pendaftaran') return 'Pendaftaran Siswa Baru';
  return sub.tipe;
}

/** Sisa tagihan iuran bulan tertentu (tarif dipakai bila record belum ada / bernominal 0). */
export function remainingMonthlyDue(
  dues: MonthlyDueRecord[],
  siswaId: string,
  bulan: number,
  tahun: number,
  tarif: number
): number {
  const due = findMonthlyDue(dues, siswaId, bulan, tahun);
  const nominal = due && due.nominal > 0 ? due.nominal : tarif;
  return Math.max(0, nominal - (due?.terbayar || 0));
}

/** Kalimat ringkas hasil sebuah pembayaran terhadap sisa tagihan. */
export function describePaymentOutcome(jumlah: number, sisa: number): {
  kind: 'lunas' | 'cicilan' | 'lebih';
  text: string;
} {
  const rp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  if (jumlah > sisa) return { kind: 'lebih', text: `kelebihan bayar ${rp(jumlah - sisa)} dari sisa tagihan ${rp(sisa)}` };
  if (jumlah < sisa) return { kind: 'cicilan', text: `cicilan, masih kurang ${rp(sisa - jumlah)}` };
  return { kind: 'lunas', text: 'tagihan dinyatakan lunas' };
}

/**
 * Untuk bukti bayar Iuran Rutin: sisa tagihan bulan itu dan hasil bila diverifikasi.
 * Mengembalikan null untuk tipe pembayaran lain.
 */
export function submissionOutcome(
  sub: PaymentSubmission,
  dues: MonthlyDueRecord[],
  tarif: number
): { sisa: number; kind: 'lunas' | 'cicilan' | 'lebih'; text: string } | null {
  if (sub.tipe !== 'Iuran Rutin' || !sub.bulan || !sub.tahun) return null;
  const sisa = remainingMonthlyDue(dues, sub.siswaId, sub.bulan, sub.tahun, tarif);
  return { sisa, ...describePaymentOutcome(sub.nominal, sisa) };
}

/** Catatan verifikasi default yang sesuai dengan hasil pembayaran. */
export function defaultVerifyNote(sub: PaymentSubmission, outcome: ReturnType<typeof submissionOutcome>): string {
  const base = `Dana transfer ${sub.metodePembayaran} sebesar Rp ${sub.nominal.toLocaleString('id-ID')} telah terkonfirmasi masuk rekening kas klub.`;
  const periode = sub.bulan && sub.tahun ? ` ${MONTH_NAMES[sub.bulan - 1]} ${sub.tahun}` : '';
  if (!outcome) return `${base} Pembayaran ${sub.tipe}${periode} diterima.`;
  if (outcome.kind === 'cicilan') return `${base} Diterima sebagai cicilan iuran${periode}; ${outcome.text}.`;
  if (outcome.kind === 'lebih') return `${base} Iuran${periode} lunas; ${outcome.text}.`;
  return `${base} Iuran${periode} dinyatakan lunas.`;
}
