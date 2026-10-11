import type { PaymentMethod, PaymentTransaction } from './sportkit';

export interface ManualPaymentInput {
  requestId: string;
  siswaId: string;
  tipe: PaymentTransaction['tipe'];
  nominal: number;
  tanggal: string;
  metodePembayaran: PaymentMethod;
  bulan?: number;
  tahun?: number;
  participantId?: string;
  buktiGambarUrl?: string;
  pesan?: string;
  catatan?: string;
  keterangan?: string;
}
