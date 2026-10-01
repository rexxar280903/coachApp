import React, { useState, useEffect } from 'react';
import { PaymentMethod, PaymentTransaction } from '../types/sportkit';
import { formatRupiah, numberToWordsId } from '../utils/numberToWordsId';
import { generateReceiptNumber, SAMPLE_TRANSFER_PROOF_SVG } from '../services/storage';
import { 
  CheckCircle2, 
  DollarSign, 
  X, 
  Receipt, 
  ArrowLeft, 
  CreditCard, 
  Sparkles,
  Upload,
  Image as ImageIcon,
  Trash2,
  Calendar,
  FileText,
  MessageSquare
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  siswaNama: string;
  siswaId: string;
  kelasId?: string;
  kelasNama: string;
  noHp?: string;
  nominalAwal: number;
  tipe: 'Pendaftaran Siswa Baru' | 'Iuran Rutin' | 'Iuran Insidentil' | 'Angsuran';
  keterangan: string;
  biayaPendaftaran?: number;
  iuranBulanan?: number;
  periodeInfo?: string;
  bulan?: number;
  tahun?: number;
  onSuccess: (
    transaction: PaymentTransaction,
    proofData?: {
      buktiGambarUrl?: string;
      pesanPembayaran?: string;
      catatanAdmin?: string;
      bulan?: number;
      tahun?: number;
    }
  ) => void;
  onViewReceipt: (transaction: PaymentTransaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  title = 'Pembayaran Iuran Rutin',
  siswaNama,
  siswaId,
  kelasId,
  kelasNama,
  noHp = '08123456789',
  nominalAwal,
  tipe,
  keterangan,
  biayaPendaftaran,
  iuranBulanan,
  periodeInfo,
  bulan: initialBulan = 12,
  tahun: initialTahun = 2024,
  onSuccess,
  onViewReceipt,
}) => {
  const [tanggal, setTanggal] = useState<string>('');
  const [jumlahBayar, setJumlahBayar] = useState<number>(nominalAwal);
  const [metode, setMetode] = useState<PaymentMethod>('Transfer BCA');
  const [catatan, setCatatan] = useState<string>('');
  const [selectedBulan, setSelectedBulan] = useState<number>(initialBulan || 12);
  const [selectedTahun, setSelectedTahun] = useState<number>(initialTahun || 2024);
  const [buktiGambarUrl, setBuktiGambarUrl] = useState<string>('');
  const [pesanPembayaran, setPesanPembayaran] = useState<string>('');
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
      setMetode('Tunai');
      setSelectedBulan(initialBulan || 12);
      setSelectedTahun(initialTahun || 2024);
      setBuktiGambarUrl('');
      setPesanPembayaran(
        `Pembayaran iuran bulan ${MONTH_NAMES[(initialBulan || 12) - 1]} ${initialTahun || 2024} untuk ${siswaNama}`
      );
    }
  }, [isOpen, nominalAwal, initialBulan, initialTahun, siswaNama]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setBuktiGambarUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSampleProof = () => {
    setBuktiGambarUrl(SAMPLE_TRANSFER_PROOF_SVG);
    if (!pesanPembayaran) {
      setPesanPembayaran(
        `Pembayaran iuran ${MONTH_NAMES[selectedBulan - 1]} ${selectedTahun} telah ditransfer melalui m-Banking oleh wali murid ${siswaNama}.`
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const receiptNo = generateReceiptNumber();
    const monthLabel = tipe === 'Iuran Rutin' ? ` ${MONTH_NAMES[selectedBulan - 1]} ${selectedTahun}` : '';
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
      keterangan: tipe === 'Iuran Rutin' ? `Iuran Rutin${monthLabel}` : keterangan,
      catatan: catatan || pesanPembayaran || 'Pembayaran dicatat & diverifikasi Admin.',
    };

    setCreatedTx(tx);
    setIsSuccess(true);
    onSuccess(tx, {
      buktiGambarUrl: buktiGambarUrl || SAMPLE_TRANSFER_PROOF_SVG,
      pesanPembayaran: pesanPembayaran || `Pembayaran iuran ${MONTH_NAMES[selectedBulan - 1]} ${selectedTahun}`,
      catatanAdmin: catatan || 'Diinput & diverifikasi langsung oleh Admin.',
      bulan: selectedBulan,
      tahun: selectedTahun,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#090e17] px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base font-display font-bold tracking-tight text-white">
                {isSuccess ? 'Pembayaran Berhasil' : title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isSuccess ? 'Kuitansi resmi telah otomatis terbit' : 'Pencatatan kasir & kuitansi resmi akademi'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSuccess && createdTx ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-display font-bold text-slate-900">
                Transaksi Berhasil Dicatat!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kuitansi <span className="font-mono font-bold text-slate-800">{createdTx.nomorKuitansi}</span> telah tersimpan di sistem
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{createdTx.siswaNama} ({createdTx.kelasNama})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Dibayar:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">{formatRupiah(createdTx.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Metode:</span>
                <span className="font-medium text-slate-800">{createdTx.metodePembayaran}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 italic">
                "{createdTx.terbilang}"
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  onClose();
                  onViewReceipt(createdTx);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Lihat / Cetak Kuitansi</span>
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Student Info Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Siswa / Atlet:</span>
                <span className="font-bold text-slate-900">{siswaNama}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Kelas:</span>
                <span className="font-semibold text-slate-800">{kelasNama}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Keperluan:</span>
                <span className="font-semibold text-emerald-700">{keterangan}</span>
              </div>
            </div>

            {/* Target Periode (Bulan & Tahun) for Iuran Rutin */}
            {tipe === 'Iuran Rutin' && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Target Periode Iuran Bulanan
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-900">
                    {MONTH_NAMES[selectedBulan - 1]} {selectedTahun}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Bulan:
                    </label>
                    <select
                      value={selectedBulan}
                      onChange={(e) => {
                        const b = Number(e.target.value);
                        setSelectedBulan(b);
                        setPesanPembayaran(
                          `Pembayaran iuran bulan ${MONTH_NAMES[b - 1]} ${selectedTahun} untuk ${siswaNama}`
                        );
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-semibold"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={idx} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tahun:
                    </label>
                    <select
                      value={selectedTahun}
                      onChange={(e) => {
                        const y = Number(e.target.value);
                        setSelectedTahun(y);
                        setPesanPembayaran(
                          `Pembayaran iuran bulan ${MONTH_NAMES[selectedBulan - 1]} ${y} untuk ${siswaNama}`
                        );
                      }}
                      className="w-full text-xs rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer font-bold font-mono"
                    >
                      {[2022, 2023, 2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Input Nominal Bayar */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah yang Dibayarkan (Rp)
              </label>
              <input
                type="number"
                required
                value={jumlahBayar}
                onChange={(e) => setJumlahBayar(Number(e.target.value))}
                className="w-full text-base font-display font-bold rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1 italic">
                Terbilang: {numberToWordsId(Number(jumlahBayar))}
              </p>
            </div>

            {/* Metode Pembayaran */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { value: 'Tunai' as PaymentMethod, label: 'Tunai (Cash)' },
                  { value: 'Transfer BCA' as PaymentMethod, label: 'Transfer BCA' },
                  { value: 'Transfer Mandiri' as PaymentMethod, label: 'Transfer Mandiri' },
                  { value: 'QRIS' as PaymentMethod, label: 'QRIS' },
                ]).map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMetode(m.value)}
                    className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      metode === m.value
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Bukti Pembayaran & Pesan Siswa (Tersimpan di Sisi Admin & Siswa) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-display font-bold text-slate-900 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    Bukti Pembayaran & Pesan Siswa
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Otomatis disimpan di daftar bukti admin dan dapat dilihat oleh siswa di akun portalnya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUseSampleProof}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Gunakan contoh struk transfer otomatis"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Pakai Contoh Struk</span>
                </button>
              </div>

              {/* Upload Input & Preview */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Foto / Gambar Bukti Transfer (Opsional / Unggah):
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer bg-white transition-colors">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">Pilih Foto Struk / Bukti</span>
                    <span className="text-[10px] text-slate-400">JPG, PNG, atau WEBP (Maks 5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {buktiGambarUrl && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-emerald-400 shrink-0 bg-slate-100 group">
                      <img
                        src={buktiGambarUrl}
                        alt="Preview Bukti"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setBuktiGambarUrl('')}
                        className="absolute inset-0 bg-rose-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                        title="Hapus Bukti"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pesan Pembayaran */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-slate-400" />
                  Pesan Pembayaran dari Siswa / Wali:
                </label>
                <textarea
                  rows={2}
                  value={pesanPembayaran}
                  onChange={(e) => setPesanPembayaran(e.target.value)}
                  placeholder="Contoh: Bukti transfer iuran Desember via mobile banking BCA an Ibu..."
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            {/* Tanggal & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan transfer..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Konfirmasi & Terbitkan Kuitansi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
