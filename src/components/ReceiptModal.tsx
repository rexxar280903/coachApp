import React, { useRef } from 'react';
import { PaymentTransaction, ClubProfile } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { Printer, X, Share2, CheckCircle2, Building, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  transaction: PaymentTransaction | null;
  profile: ClubProfile;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  profile,
  isOpen,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(
      `*KUITANSI PEMBAYARAN - ${profile.namaKlub}*\n\n` +
      `No. Kuitansi: ${transaction.nomorKuitansi}\n` +
      `Tanggal: ${transaction.tanggal}\n` +
      `Nama Siswa: ${transaction.siswaNama} (${transaction.kelasNama})\n` +
      `Untuk: ${transaction.tipe} - ${transaction.keterangan}\n` +
      `Metode: ${transaction.metodePembayaran}\n` +
      `Jumlah: *${formatRupiah(transaction.nominal)}*\n` +
      `Terbilang: _${transaction.terbilang}_\n\n` +
      `Status: LUNAS ✅\n` +
      `Terima kasih atas pembayarannya.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        {/* Header Action Bar (Hidden when printing) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm tracking-wide">Kuitansi Pembayaran Digital</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
              title="Kirim ke WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share WA</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kuitansi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Printable Area */}
        <div ref={receiptRef} className="p-8 print:p-6 bg-white text-slate-900">
          {/* Top Brand Header */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900/90 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 flex flex-col items-center justify-center text-white shadow-md border border-blue-400/30">
                <span className="text-[10px] tracking-wider font-extrabold text-blue-300">★ ★ ★</span>
                <span className="text-xs font-black tracking-tight uppercase leading-none">SPORTKIT</span>
                <span className="text-[8px] font-bold text-slate-300 tracking-tighter">CLUB ADMIN</span>
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                  {profile.namaKlub}
                </h2>
                <p className="text-[11px] text-slate-600 max-w-xs leading-relaxed">
                  {profile.alamat}, {profile.kota}
                </p>
                <p className="text-[11px] text-slate-500">
                  WA: {profile.noHp} | {profile.email}
                </p>
              </div>
            </div>

            <div className="text-right">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                KUITANSI
              </h1>
              <div className="mt-1 space-y-0.5">
                <p className="text-xs font-medium text-slate-500">
                  No. Kuitansi: <span className="font-mono font-bold text-slate-800">{transaction.nomorKuitansi}</span>
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Tanggal: <span className="font-semibold text-slate-800">{transaction.tanggal}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Student Subheader */}
          <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 font-bold text-xs">
                {transaction.kelasNama}
              </span>
              <span className="text-base font-bold text-slate-900">
                {transaction.siswaNama}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>TERVERIFIKASI LUNAS</span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="my-6 p-5 rounded-xl bg-slate-100/90 border border-slate-300/80">
            <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
              Telah terima pembayaran senilai:
            </span>
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {formatRupiah(transaction.nominal)}
            </div>
            <p className="text-sm font-semibold italic text-blue-900 mt-1">
              "{transaction.terbilang}"
            </p>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Metode Pembayaran</span>
              <p className="font-bold text-slate-800 text-sm">{transaction.metodePembayaran}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-500 font-medium">Kategori Pembayaran</span>
              <p className="font-bold text-slate-800 text-sm">{transaction.tipe}</p>
            </div>
            <div className="col-span-2 space-y-1 border-t border-slate-200 pt-3">
              <span className="text-slate-500 font-medium">Untuk Keperluan</span>
              <p className="font-semibold text-slate-800">{transaction.keterangan}</p>
              {transaction.catatan && (
                <p className="text-slate-500 italic mt-0.5">Catatan: {transaction.catatan}</p>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end text-xs">
            <div className="text-center w-36">
              <p className="text-slate-500 mb-12">Penyetor / Orang Tua</p>
              <div className="border-b border-slate-400"></div>
              <p className="text-slate-800 font-semibold mt-1">Orang Tua Siswa</p>
            </div>
            <div className="text-center w-44">
              <p className="text-slate-500 mb-2">Petugas Administrasi,</p>
              <div className="h-10 flex items-center justify-center">
                <span className="text-[10px] font-mono tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                  [LUNAS SISTEM]
                </span>
              </div>
              <div className="border-b border-slate-900"></div>
              <p className="text-slate-900 font-bold mt-1">Bendahara {profile.namaKlub}</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            Kuitansi ini sah dan diterbitkan secara resmi melalui sistem SportKit.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
