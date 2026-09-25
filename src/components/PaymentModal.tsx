import React, { useState, useEffect } from 'react';
import { PaymentMethod, PaymentTransaction } from '../types/sportkit';
import { formatRupiah, numberToWordsId } from '../utils/numberToWordsId';
import { generateReceiptNumber } from '../services/storage';
import { CheckCircle2, DollarSign, X, Receipt, ArrowLeft } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  siswaNama: string;
  siswaId: string;
  kelasNama: string;
  noHp?: string;
  nominalAwal: number;
  tipe: 'Pendaftaran Siswa Baru' | 'Iuran Rutin' | 'Iuran Insidentil' | 'Angsuran';
  keterangan: string;
  biayaPendaftaran?: number;
  iuranBulanan?: number;
  periodeInfo?: string;
  onSuccess: (transaction: PaymentTransaction) => void;
  onViewReceipt: (transaction: PaymentTransaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  title = 'Pembayaran Iuran Rutin',
  siswaNama,
  siswaId,
  kelasNama,
  noHp = '08123456789',
  nominalAwal,
  tipe,
  keterangan,
  biayaPendaftaran,
  iuranBulanan,
  periodeInfo,
  onSuccess,
  onViewReceipt,
}) => {
  const [tanggal, setTanggal] = useState<string>('');
  const [jumlahBayar, setJumlahBayar] = useState<number>(nominalAwal);
  const [metode, setMetode] = useState<PaymentMethod>('Transfer BCA');
  const [catatan, setCatatan] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdTx, setCreatedTx] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setTanggal(today);
      setJumlahBayar(nominalAwal);
      setIsSuccess(false);
      setCreatedTx(null);
      setCatatan('');
      setMetode('Transfer BCA');
    }
  }, [isOpen, nominalAwal]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const receiptNo = generateReceiptNumber();
    const tx: PaymentTransaction = {
      id: 'tx-' + Date.now(),
      nomorKuitansi: receiptNo,
      siswaId,
      siswaNama,
      kelasNama,
      tanggal,
      nominal: Number(jumlahBayar),
      terbilang: numberToWordsId(Number(jumlahBayar)),
      metodePembayaran: metode,
      tipe,
      keterangan,
      catatan,
    };

    setCreatedTx(tx);
    setIsSuccess(true);
    onSuccess(tx);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-4 flex items-center justify-between text-white">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {isSuccess ? 'SPORTKIT 1' : title}
            </h2>
            <p className="text-xs text-blue-200 font-medium">
              {isSuccess ? 'Transaksi Berhasil Dicatat' : 'Sistem Pembayaran Kasir & Verifikasi'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess && createdTx ? (
          /* Success Screen matching video timestamp 01:01 */
          <div className="p-8 text-center space-y-6">
            <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-lg flex items-center justify-center gap-2 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
              <span>Pembayaran berhasil.</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Kuitansi:</span>
                <span className="font-mono font-bold text-slate-800">{createdTx.nomorKuitansi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-semibold text-slate-800">{createdTx.siswaNama} ({createdTx.kelasNama})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominal:</span>
                <span className="font-bold text-blue-900 text-sm">{formatRupiah(createdTx.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="font-medium text-slate-800">{createdTx.metodePembayaran}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onViewReceipt(createdTx);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-2 shadow-md transition-colors"
              >
                <Receipt className="w-4 h-4" />
                <span>Cetak Kuitansi</span>
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Student Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{siswaNama}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {kelasNama}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">📞 {noHp}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Tagihan</span>
                <span className="text-base font-black text-slate-900">{formatRupiah(nominalAwal)}</span>
              </div>
            </div>

            {/* Price breakdown if registration */}
            {biayaPendaftaran !== undefined && iuranBulanan !== undefined && (
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-xs space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>Biaya Pendaftaran:</span>
                  <span className="font-semibold">{formatRupiah(biayaPendaftaran)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Iuran Bulanan:</span>
                  <span className="font-semibold">{formatRupiah(iuranBulanan)}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200/80 pt-1 font-bold text-blue-950">
                  <span>Total Biaya Pendaftaran:</span>
                  <span>{formatRupiah(nominalAwal)}</span>
                </div>
              </div>
            )}

            {/* Date and Period */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Bayar
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Periode / Keperluan
                </label>
                <input
                  type="text"
                  readOnly
                  value={periodeInfo || keterangan}
                  className="w-full text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Jumlah Bayar */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Bayar (Rp) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-500">Rp</span>
                <input
                  type="number"
                  required
                  min={1000}
                  value={jumlahBayar}
                  onChange={(e) => setJumlahBayar(Number(e.target.value))}
                  className="w-full text-sm font-bold rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-blue-800 italic mt-1 font-medium">
                {numberToWordsId(Number(jumlahBayar))}
              </p>
            </div>

            {/* Metode Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran *
              </label>
              <select
                value={metode}
                onChange={(e) => setMetode(e.target.value as PaymentMethod)}
                className="w-full text-xs font-medium rounded-lg border border-slate-300 px-3 py-2 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Transfer BCA">Transfer BCA</option>
                <option value="QRIS">QRIS</option>
                <option value="Tunai">Tunai</option>
                <option value="EDC BCA">EDC BCA</option>
                <option value="Kartu Kredit">Kartu Kredit</option>
                <option value="Transfer Mandiri">Transfer Mandiri</option>
                <option value="Transfer BRI">Transfer BRI</option>
              </select>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Titipan transfer orang tua via m-Banking"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Simpan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
