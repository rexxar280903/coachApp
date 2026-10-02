import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { PaymentTransaction, ClubProfile } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { Printer, X, Share2, CheckCircle2, Building, ShieldCheck, Award } from 'lucide-react';

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
      `*KUITANSI RESMI PEMBAYARAN - ${profile.namaKlub}*\n\n` +
      `No. Kuitansi: ${transaction.nomorKuitansi}\n` +
      `Tanggal: ${transaction.tanggal}\n` +
      `Nama Atlet: ${transaction.siswaNama} (${transaction.kelasNama})\n` +
      `Untuk: ${transaction.tipe} - ${transaction.keterangan}\n` +
      `Metode: ${transaction.metodePembayaran}\n` +
      `Jumlah: *${formatRupiah(transaction.nominal)}*\n` +
      `Terbilang: _${transaction.terbilang}_\n\n` +
      `Status: Pembayaran diterima & terverifikasi ✅\n` +
      `Terima kasih atas pembayarannya.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Dirender di luar #root agar saat dicetak hanya kuitansi yang tampil
  // (#root disembunyikan oleh aturan @media print di index.css).
  return createPortal(
    <div className="receipt-print-root fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 print:static print:block print:overflow-visible print:p-0 print:bg-white print:backdrop-blur-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden print:border-none print:shadow-none">
        {/* Header Action Bar (Hidden in Print) */}
        <div className="bg-[#090e17] text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-xs tracking-wide">Kuitansi Pembayaran Resmi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Kirim bukti ke WhatsApp Wali Murid"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share WA</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors shadow-xs border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div ref={receiptRef} className="p-8 sm:p-10 print:p-6 bg-white text-slate-900 font-sans">
          {/* Top Club Header */}
          <div className="flex items-start justify-between pb-6 border-b-2 border-slate-900 gap-4">
            <div className="flex items-center gap-3.5">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={`Logo ${profile.namaKlub}`} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-slate-900 flex flex-col items-center justify-center text-white shadow-sm">
                  <span className="text-[7px] tracking-wider font-extrabold text-emerald-400">★ ★ ★</span>
                  <span className="text-[11px] font-black tracking-tight uppercase leading-none font-display">SPORT</span>
                  <span className="text-[7px] font-bold text-slate-300">ACADEMY</span>
                </div>
              )}
              <div>
                <h2 className="text-base font-display font-black tracking-tight text-slate-900 uppercase">
                  {profile.namaKlub}
                </h2>
                <p className="text-[11px] text-slate-600 max-w-xs leading-relaxed">
                  {profile.alamat}, {profile.kota}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Telp/WA: {profile.noHp} {profile.email ? `| ${profile.email}` : ''}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded bg-slate-100 text-slate-900 font-display font-extrabold text-sm uppercase tracking-wider">
                KUITANSI
              </div>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                {transaction.nomorKuitansi}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {transaction.tanggal}
              </p>
            </div>
          </div>

          {/* Receipt Body */}
          <div className="my-6 space-y-3.5 text-xs">
            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Telah Diterima Dari</span>
              <span className="col-span-2 font-bold text-slate-900 text-sm">
                {transaction.siswaNama}{' '}
                <span className="text-xs font-semibold text-slate-600">
                  (Kelas {transaction.kelasNama})
                </span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Uang Sejumlah</span>
              <div className="col-span-2">
                <span className="font-mono font-extrabold text-emerald-700 text-base">
                  {formatRupiah(transaction.nominal)}
                </span>
                <p className="italic text-slate-700 font-serif text-xs mt-0.5 bg-slate-50 p-2 rounded border border-slate-200">
                  "{transaction.terbilang}"
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Untuk Pembayaran</span>
              <span className="col-span-2 font-semibold text-slate-900">
                {transaction.tipe} — {transaction.keterangan}
                {transaction.catatan && (
                  <span className="block text-slate-500 font-normal mt-0.5 italic">
                    Catatan: {transaction.catatan}
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Metode Pembayaran</span>
              <span className="col-span-2 font-semibold text-slate-800">
                {transaction.metodePembayaran}
              </span>
            </div>
          </div>

          {/* Signatures and Stamp */}
          <div className="mt-8 pt-4 flex items-end justify-between text-xs">
            <div className="text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 font-bold text-[11px] font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>PEMBAYARAN TERVERIFIKASI</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Kuitansi ini sah dan dihasilkan secara digital oleh SportKit System.
              </p>
            </div>

            <div className="text-center min-w-[140px]">
              <p className="text-slate-500 text-[11px] font-mono">
                {profile.kota}, {transaction.tanggal}
              </p>
              <p className="text-slate-600 font-medium mt-0.5">Bendahara / Pengurus Klub</p>
              <div className="h-14 flex items-center justify-center text-slate-300 italic text-[11px]">
                [Tanda Tangan & Stempel]
              </div>
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1">
                Pengurus {profile.namaKlub}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
