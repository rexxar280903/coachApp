import { EventParticipant, FeeStatus, MonthlyDueRecord, PaymentSubmission, PaymentTransaction } from '../types/sportkit';
import { MONTH_NAMES } from './constants';
import { numberToWordsId } from './numberToWordsId';

/** Status tagihan berdasarkan jumlah yang sudah terbayar. */
export function statusFromPaid(nominal: number, terbayar: number): FeeStatus {
  if (terbayar <= 0) return 'belum_bayar';
  return terbayar >= nominal ? 'lunas' : 'belum_lunas';
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

  const periode = sub.bulan ? ` ${MONTH_NAMES[sub.bulan - 1]} ${sub.tahun || ''}`.trimEnd() : '';
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
    tipe: sub.tipe === 'Pendaftaran' ? 'Pendaftaran Siswa Baru' : sub.tipe,
    keterangan: `${sub.tipe}${periode}`,
    catatan: sub.catatanAdmin,
  };
}
