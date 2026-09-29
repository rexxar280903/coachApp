import React, { useState } from 'react';
import { 
  PaymentSubmission, 
  Student, 
  ClassGroup, 
  MonthlyDueRecord, 
  PaymentTransaction 
} from '../types/sportkit';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  MessageSquare, 
  Calendar, 
  CreditCard, 
  User, 
  Receipt, 
  AlertCircle, 
  FileText,
  ShieldCheck,
  ChevronRight,
  Maximize2,
  X
} from 'lucide-react';

interface VerifikasiPembayaranViewProps {
  submissions: PaymentSubmission[];
  students: Student[];
  classes: ClassGroup[];
  monthlyDues: MonthlyDueRecord[];
  onVerifySubmission: (submissionId: string, catatanAdmin: string) => void;
  onRejectSubmission: (submissionId: string, alasan: string) => void;
  onViewReceipt: (tx: PaymentTransaction) => void;
  transactions: PaymentTransaction[];
}

export const VerifikasiPembayaranView: React.FC<VerifikasiPembayaranViewProps> = ({
  submissions,
  students,
  classes,
  monthlyDues,
  onVerifySubmission,
  onRejectSubmission,
  onViewReceipt,
  transactions,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');

  // Preview Image Modal State
  const [previewImage, setPreviewImage] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    studentName: string;
    nominal: number;
    tanggal: string;
    message?: string;
  } | null>(null);

  // Verification Modal State
  const [verifyingSubmission, setVerifyingSubmission] = useState<PaymentSubmission | null>(null);
  const [adminNote, setAdminNote] = useState<string>('Dana telah terkonfirmasi masuk ke rekening klub. Pembayaran dinyatakan lunas.');

  // Rejection Modal State
  const [rejectingSubmission, setRejectingSubmission] = useState<PaymentSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Calculate Stats
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const verifiedCount = submissions.filter((s) => s.status === 'verified').length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;
  const totalVerifiedNominal = submissions
    .filter((s) => s.status === 'verified')
    .reduce((sum, s) => sum + s.nominal, 0);

  // Filter Submissions
  const filteredSubmissions = submissions.filter((sub) => {
    // Status Filter
    if (filterStatus !== 'all' && sub.status !== filterStatus) return false;

    // Class Filter
    if (selectedClassFilter !== 'all' && sub.kelasId !== selectedClassFilter) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = sub.siswaNama.toLowerCase().includes(q);
      const matchClass = sub.kelasNama.toLowerCase().includes(q);
      const matchMsg = sub.pesanSiswa?.toLowerCase().includes(q) || false;
      const matchMetode = sub.metodePembayaran.toLowerCase().includes(q);
      return matchName || matchClass || matchMsg || matchMetode;
    }

    return true;
  });

  const handleConfirmVerify = () => {
    if (!verifyingSubmission) return;
    onVerifySubmission(verifyingSubmission.id, adminNote);
    setVerifyingSubmission(null);
  };

  const handleConfirmReject = () => {
    if (!rejectingSubmission) return;
    if (!rejectReason.trim()) {
      alert('Mohon tuliskan alasan penolakan agar siswa dapat memperbaikinya.');
      return;
    }
    onRejectSubmission(rejectingSubmission.id, rejectReason);
    setRejectingSubmission(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Validasi Keuangan
            </span>
            <span className="text-xs text-slate-500 font-medium">· Verifikasi Pembayaran Siswa</span>
          </div>
          <h1 className="text-xl md:text-2xl font-display font-extrabold text-slate-900 tracking-tight mt-1">
            Verifikasi Bukti Transfer & Kuitansi Siswa
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Periksa kiriman bukti pembayaran dari akun siswa, verifikasi mutasi rekening, dan otomatis ceklist status lunas di sistem.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Menunggu</p>
              <p className="text-base font-display font-black leading-none">{pendingCount}</p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Terverifikasi</p>
              <p className="text-base font-display font-black leading-none">{verifiedCount}</p>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-900 text-white flex items-center gap-2.5 border border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kas Masuk Terverifikasi</p>
              <p className="text-sm font-mono font-bold leading-none text-emerald-400">
                Rp {totalVerifiedNominal.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({submissions.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('verified')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'verified'
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Terverifikasi ({verifiedCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              filterStatus === 'rejected'
                ? 'bg-rose-600 text-white shadow-xs font-bold'
                : 'text-rose-700 hover:bg-rose-100'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Ditolak ({rejectedCount})</span>
          </button>
        </div>

        {/* Right side: Class dropdown & search */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-emerald-500 cursor-pointer"
          >
            <option value="all">Semua Kelompok Usia / Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama} (Pelatih: {c.pelatih})
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa, bank, pesan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-emerald-500 focus:border-emerald-500 placeholder-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Tidak ada bukti pembayaran</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filterStatus === 'pending'
              ? 'Bagus sekali! Semua bukti transfer dari siswa telah diverifikasi atau belum ada kiriman baru.'
              : 'Tidak ditemukan data pengajuan bukti pembayaran yang sesuai dengan filter pencarian.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubmissions.map((sub) => {
            const student = students.find((s) => s.id === sub.siswaId);
            const periodLabel = sub.bulan && sub.tahun 
              ? `${monthNames[sub.bulan - 1]} ${sub.tahun}`
              : sub.eventNama || sub.tipe;

            return (
              <div
                key={sub.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md ${
                  sub.status === 'pending'
                    ? 'border-amber-300 ring-2 ring-amber-100/50'
                    : sub.status === 'verified'
                    ? 'border-emerald-200'
                    : 'border-slate-200 opacity-90'
                }`}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  {/* Left: Student & Payment Info */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Student Avatar / Initial */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-display font-black text-sm shrink-0 border border-slate-700 shadow-xs">
                      {sub.siswaNama.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {sub.siswaNama}
                        </h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                          {sub.kelasNama}
                        </span>
                        {student?.orangTua?.namaAyah && (
                          <span className="text-[11px] text-slate-500">
                            Wali: {student.orangTua.namaAyah}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">· Diajukan: {sub.tanggalKirim}</span>
                      </div>

                      {/* Payment Details Pill Grid */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-medium border border-emerald-200/60">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Periode: <strong>{periodLabel}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-medium">
                          <span>Nominal:</span>
                          <strong className="font-mono text-slate-900">
                            Rp {sub.nominal.toLocaleString('id-ID')}
                          </strong>
                        </div>

                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 font-medium border border-sky-200/60">
                          <span>Metode: <strong>{sub.metodePembayaran}</strong></span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Tgl Transfer: {sub.tanggalTransfer}</span>
                        </div>
                      </div>

                      {/* Student Message / Catatan dari Siswa */}
                      {sub.pesanSiswa && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                            <MessageSquare className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 mr-1.5">Pesan Siswa:</span>
                            <span className="italic text-slate-600">"{sub.pesanSiswa}"</span>
                          </div>
                        </div>
                      )}

                      {/* Verification Status Feedback */}
                      {sub.status === 'verified' && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-700 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            Diverifikasi oleh <strong>{sub.diverifikasiOleh || 'Super Admin'}</strong> pada {sub.tanggalVerifikasi}
                          </span>
                          {sub.kuitansiId && (
                            <span className="font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                              Kuitansi: {sub.kuitansiId}
                            </span>
                          )}
                          {sub.catatanAdmin && (
                            <span className="text-slate-600 italic">· "{sub.catatanAdmin}"</span>
                          )}
                        </div>
                      )}

                      {sub.status === 'rejected' && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-rose-700 font-medium">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>
                            Ditolak: <strong className="text-slate-800">{sub.catatanAdmin || 'Bukti transfer tidak valid.'}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Receipt Thumbnail & Verification Action Buttons */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Receipt Image Thumbnail */}
                    <div 
                      onClick={() => setPreviewImage({
                        isOpen: true,
                        url: sub.buktiGambarUrl,
                        title: `Bukti Transfer - ${sub.siswaNama}`,
                        studentName: sub.siswaNama,
                        nominal: sub.nominal,
                        tanggal: sub.tanggalTransfer,
                        message: sub.pesanSiswa,
                      })}
                      className="group relative cursor-pointer rounded-xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-emerald-500 transition-all shadow-2xs shrink-0"
                      title="Klik untuk memperbesar bukti pembayaran"
                    >
                      <img
                        src={sub.buktiGambarUrl}
                        alt={`Bukti transfer ${sub.siswaNama}`}
                        className="w-24 h-16 object-cover object-center group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] font-bold px-1 rounded backdrop-blur-xs">
                        Bukti
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {sub.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setVerifyingSubmission(sub);
                              setAdminNote(`Dana transfer ${sub.metodePembayaran} sebesar Rp ${sub.nominal.toLocaleString('id-ID')} telah terkonfirmasi masuk rekening kas klub. Pembayaran iuran ${periodLabel} dinyatakan lunas.`);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verifikasi & Ceklist</span>
                          </button>

                          <button
                            onClick={() => {
                              setRejectingSubmission(sub);
                              setRejectReason('Bukti transfer tidak terbaca jelas atau nominal dana belum masuk ke mutasi rekening bank. Silakan unggah bukti yang lebih jelas.');
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                          >
                            Tolak
                          </button>
                        </>
                      )}

                      {sub.status === 'verified' && (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Lunas & Ceklist
                          </span>

                          {/* Open receipt if transaction exists */}
                          {sub.kuitansiId && (
                            <button
                              onClick={() => {
                                const tx = transactions.find((t) => t.nomorKuitansi === sub.kuitansiId);
                                if (tx) {
                                  onViewReceipt(tx);
                                } else {
                                  alert(`Kuitansi nomor: ${sub.kuitansiId} sudah terbit.`);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Cetak / Bagikan Kuitansi Resmi"
                            >
                              <Receipt className="w-3.5 h-3.5 text-slate-500" />
                              <span>Kuitansi</span>
                            </button>
                          )}
                        </div>
                      )}

                      {sub.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Ditolak
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Full-Screen / High-Res Image Preview */}
      {previewImage?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-sm tracking-tight">
                  {previewImage.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Nominal: Rp {previewImage.nominal.toLocaleString('id-ID')} · Tgl: {previewImage.tanggal}
                </p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[65vh] overflow-auto">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            {previewImage.message && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs">
                <span className="font-bold text-slate-700">Pesan dari Siswa: </span>
                <span className="italic text-slate-600">"{previewImage.message}"</span>
              </div>
            )}

            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Admin Verification Confirmation */}
      {verifyingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Konfirmasi Verifikasi Pembayaran
                </span>
              </div>
              <h3 className="font-display font-black text-lg">
                Verifikasi & Ceklist Lunas Iuran
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Status siswa akan otomatis ditandai LUNAS dan kuitansi resmi diterbitkan.
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Siswa:</span>
                  <span className="font-bold text-slate-800">{verifyingSubmission.siswaNama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kelas / Kelompok:</span>
                  <span className="font-semibold text-slate-800">{verifyingSubmission.kelasNama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Periode Iuran:</span>
                  <span className="font-bold text-emerald-700">
                    {verifyingSubmission.bulan && verifyingSubmission.tahun
                      ? `${monthNames[verifyingSubmission.bulan - 1]} ${verifyingSubmission.tahun}`
                      : verifyingSubmission.tipe}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Transfer:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    Rp {verifyingSubmission.nominal.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Metode & Tgl:</span>
                  <span className="font-medium text-slate-700">
                    {verifyingSubmission.metodePembayaran} · {verifyingSubmission.tanggalTransfer}
                  </span>
                </div>
              </div>

              {/* Verification Note by Admin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Verifikasi Admin (Tampil di Kuitansi & Akun Siswa):
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-emerald-500 focus:border-emerald-500"
                  placeholder="Contoh: Dana telah masuk rekening BCA klub. Pembayaran lunas."
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Tindakan ini akan mencatat transaksi di buku kas klub, memberi tanda ceklist hijau di matriks iuran rutin, dan menerbitkan kuitansi digital untuk siswa.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setVerifyingSubmission(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmVerify}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Lunas & Terbitkan Kuitansi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Rejection Dialog */}
      {rejectingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-gradient-to-r from-rose-700 to-rose-900 text-white">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-rose-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-rose-200">
                  Tolak Pembayaran
                </span>
              </div>
              <h3 className="font-display font-black text-lg">
                Tolak Bukti Pembayaran Siswa
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Siswa <strong className="text-slate-900">{rejectingSubmission.siswaNama}</strong> akan melihat alasan penolakan ini di akun mereka dan dapat mengunggah bukti perbaikan.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alasan Penolakan:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-rose-500 focus:border-rose-500"
                  placeholder="Misal: Bukti transfer buram/terpotong, mohon unggah ulang struk m-banking yang memuat nomor referensi transfer."
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setRejectingSubmission(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak Pengajuan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
