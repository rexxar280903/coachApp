import React, { useState } from 'react';
import { useToast } from '../components/Toast';
import { receiptForSubmission } from '../utils/payments';
import { getTodayISO, getCurrentYear, getCurrentMonth, getYearOptions } from '../utils/constants';
import { 
  Student, 
  ClassGroup, 
  MonthlyDueRecord, 
  AttendanceSession, 
  PaymentTransaction, 
  PaymentSubmission,
  ClubProfile,
  PaymentMethod 
} from '../types/sportkit';
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Upload, 
  Calendar, 
  CreditCard, 
  User, 
  Receipt, 
  FileText, 
  MessageSquare, 
  Award, 
  ShieldCheck, 
  Phone, 
  ChevronLeft,
  ChevronRight, 
  Filter,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  X,
  AlertCircle,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { SAMPLE_TRANSFER_PROOF_SVG } from '../services/storage';

interface StudentPortalViewProps {
  currentStudent: Student;
  students: Student[];
  classes: ClassGroup[];
  monthlyDues: MonthlyDueRecord[];
  attendanceSessions: AttendanceSession[];
  transactions: PaymentTransaction[];
  submissions: PaymentSubmission[];
  clubProfile: ClubProfile;
  onSelectStudent: (studentId: string) => void;
  onSubmitPaymentProof: (newSubmission: Omit<PaymentSubmission, 'id' | 'status' | 'tanggalKirim'>) => boolean;
  onViewReceipt: (tx: PaymentTransaction) => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  currentStudent,
  students,
  classes,
  monthlyDues,
  attendanceSessions,
  transactions,
  submissions,
  clubProfile,
  onSelectStudent,
  onSubmitPaymentProof,
  onViewReceipt,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upload' | 'iuran' | 'absensi'>('upload');
  
  // Student's specific class
  const studentClass = classes.find((c) => c.id === currentStudent.kelasId) || classes[0];

  // Month names in Indonesian
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Upload Form State
  const [selectedMonth, setSelectedMonth] = useState<number>(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear());
  const [historyYearFilter, setHistoryYearFilter] = useState<number | 'all'>('all');
  const [transferAmount, setTransferAmount] = useState<number>(studentClass?.iuranBulanan || 100000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer BCA');
  const [transferDate, setTransferDate] = useState<string>(
    getTodayISO()
  );
  const [studentMessage, setStudentMessage] = useState<string>('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);

  // High-Res Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    nominal: number;
    tanggal: string;
  } | null>(null);

  // Student's monthly dues
  const studentDues = monthlyDues.filter((d) => d.siswaId === currentStudent.id);

  // Student's submissions
  const studentSubmissions = submissions.filter((s) => s.siswaId === currentStudent.id);
  const displayedSubmissions = studentSubmissions.filter((s) => {
    if (historyYearFilter === 'all') return true;
    return s.tahun === historyYearFilter;
  });

  // Attendance stats for current student
  const studentSessions = attendanceSessions.filter(
    (sess) => sess.kehadiran && sess.kehadiran[currentStudent.id] !== undefined
  );
  const attendedCount = studentSessions.filter(
    (sess) => sess.kehadiran[currentStudent.id] === true
  ).length;
  const totalSessionsCount = studentSessions.length;
  const attendanceRate = totalSessionsCount > 0 
    ? Math.round((attendedCount / totalSessionsCount) * 100) 
    : 100;

  // Handle Image File Upload (FileReader to Base64)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File terlalu besar', 'Ukuran file maksimal 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviewUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset sample proof generator for rapid testing
  const handleUseSampleProof = () => {
    setImagePreviewUrl(SAMPLE_TRANSFER_PROOF_SVG);
    setStudentMessage(
      `Halo Admin ${clubProfile.namaKlub}, saya melampirkan bukti transfer m-banking untuk iuran bulan ${monthNames[selectedMonth - 1]} ${selectedYear}. Mohon bantu diverifikasi, terima kasih!`
    );
  };

  // Submit Handler
  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreviewUrl) {
      toast.error('Bukti transfer belum ada', 'Mohon unggah gambar struk / bukti transfer pembayaran terlebih dahulu.');
      return;
    }
    if (!transferAmount || transferAmount <= 0) {
      toast.error('Nominal tidak valid', 'Nominal transfer harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const accepted = onSubmitPaymentProof({
        siswaId: currentStudent.id,
        siswaNama: currentStudent.nama,
        kelasId: currentStudent.kelasId,
        kelasNama: studentClass?.nama || 'Kelas Akademi',
        tipe: 'Iuran Rutin',
        bulan: selectedMonth,
        tahun: selectedYear,
        nominal: Number(transferAmount),
        metodePembayaran: paymentMethod,
        tanggalTransfer: transferDate,
        buktiGambarUrl: imagePreviewUrl,
        pesanSiswa: studentMessage || `Pembayaran iuran ${monthNames[selectedMonth - 1]} ${selectedYear}`,
      });

      setIsSubmitting(false);
      if (!accepted) return;
      setShowSuccessAlert(true);
      setImagePreviewUrl('');
      setStudentMessage('');

      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 5000);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Student Switcher Bar (Useful for testing multiple students or parents with multiple kids) */}
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-200">Portal Siswa & Orang Tua Atlet</p>
            <p className="text-[11px] text-slate-400">
              Lihat jadwal presensi, histori iuran yang sudah diverifikasi, dan unggah kuitansi pembayaran.
            </p>
          </div>
        </div>

        {/* Student Selector Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:inline">Pilih Siswa:</span>
          <select
            value={currentStudent.id}
            onChange={(e) => onSelectStudent(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-white border border-slate-700 focus:outline-emerald-500 cursor-pointer"
          >
            {students
              .filter((s) => s.status !== 'Calon')
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} ({s.kelasId.toUpperCase()})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Athlete Hero Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs relative overflow-hidden">
        {/* Subtle accent backdrop */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pt-2">
          {/* Left: Avatar & Bio */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-center font-display font-black text-xl border-2 border-emerald-500/40 shadow-md shrink-0">
              {currentStudent.nama.split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-display font-black text-slate-900 tracking-tight">
                  {currentStudent.nama}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {currentStudent.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                  {studentClass?.nama}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 mt-1.5 font-medium">
                <span>Wali: <strong className="text-slate-700">{currentStudent.orangTua?.namaAyah || currentStudent.orangTua?.namaIbu || 'Orang Tua'}</strong></span>
                <span>·</span>
                <span>Pelatih: <strong className="text-slate-700">{studentClass?.pelatih}</strong></span>
                <span>·</span>
                <span>No. WA: <strong className="text-slate-700">{currentStudent.noHp}</strong></span>
                <span>·</span>
                <span>Iuran: <strong className="text-emerald-700">Rp {studentClass?.iuranBulanan.toLocaleString('id-ID')}/bln</strong></span>
              </div>
            </div>
          </div>

          {/* Right: Quick KPI Badges */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Attendance KPI */}
            <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3 flex-1 sm:flex-none">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Presensi Latihan</p>
                <p className="text-base font-display font-black text-slate-900 leading-none">
                  {attendanceRate}% <span className="text-xs font-normal text-slate-500">({attendedCount}/{totalSessionsCount} sesi)</span>
                </p>
              </div>
            </div>

            {/* Submissions Verified Status */}
            <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center gap-3 flex-1 sm:flex-none">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Status Pembayaran</p>
                <p className="text-xs font-bold text-emerald-900 mt-0.5">
                  {studentSubmissions.filter((s) => s.status === 'verified').length} Bulan Terverifikasi
                </p>
              </div>
            </div>

            {/* Quick Year Selector Control */}
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900 text-white flex items-center gap-2 flex-1 sm:flex-none border border-slate-800 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider leading-none">Tahun Ajaran</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent text-white font-mono text-xs font-bold focus:outline-none cursor-pointer"
                  >
                    {getYearOptions(selectedYear).map((y) => (
                      <option key={y} value={y} className="bg-slate-900 text-white">
                        Tahun {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Bukti & Status Verifikasi</span>
            {studentSubmissions.filter((s) => s.status === 'pending').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('iuran')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'iuran'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Matriks Iuran 12 Bulan</span>
          </button>

          <button
            onClick={() => setActiveTab('absensi')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'absensi'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Rekap Kehadiran Latihan ({attendanceRate}%)</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER ALERT */}
      {showSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-md flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold">Bukti Pembayaran Berhasil Dikirim ke Admin!</p>
              <p className="text-[11px] text-emerald-100">
                Pihak admin klub akan mengecek mutasi transfer dan melakukan verifikasi. Ceklist status lunas akan otomatis muncul di bawah.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSuccessAlert(false)}
            className="text-white hover:text-emerald-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: UPLOAD BUKTI & HISTORI PENGAJUAN */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload Form */}
          <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                Kwitansi & Pembayaran
              </span>
              <h2 className="text-lg font-display font-extrabold text-slate-900 mt-2">
                Unggah Bukti Transfer Iuran
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirim foto struk transfer m-banking atau ATM beserta pesan keterangan pembayaran ke admin.
              </p>
            </div>

            {/* Club Destination Account Info */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Rekening Tujuan Klub:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                  RESMI {clubProfile.namaKlub}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-semibold text-slate-300">Bank Central Asia (BCA)</p>
                  <p className="font-mono text-base font-bold text-white tracking-wider">8290-8812-3390</p>
                  <p className="text-[10px] text-slate-400">a.n Akademi Olahraga {clubProfile.namaKlub}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Tarif SPP Kelas:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    Rp {studentClass?.iuranBulanan.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitProof} className="space-y-4">
              {/* Month & Year Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bulan Pembayaran:
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-emerald-500 cursor-pointer"
                  >
                    {monthNames.map((m, idx) => (
                      <option key={idx} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tahun:
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-emerald-500 cursor-pointer font-bold font-mono"
                  >
                    {getYearOptions(selectedYear).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nominal Transfer (Rp):
                  </label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-emerald-500"
                    placeholder="100000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-emerald-500 cursor-pointer"
                  >
                    <option value="Transfer BCA">Transfer BCA</option>
                    <option value="Transfer Mandiri">Transfer Mandiri</option>
                    <option value="Transfer BRI">Transfer BRI</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Tunai">Tunai ke Kasir</option>
                  </select>
                </div>
              </div>

              {/* Transfer Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Transfer:
                </label>
                <input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                  required
                />
              </div>

              {/* Message to Admin (Payment Message Feature) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Pesan Pembayaran ke Admin:
                  </label>
                  <span className="text-[10px] text-slate-400">Sertakan nama pengirim transfer</span>
                </div>
                <textarea
                  rows={2}
                  value={studentMessage}
                  onChange={(e) => setStudentMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-emerald-500 focus:border-emerald-500 placeholder-slate-400"
                  placeholder="Contoh: Sudah transfer via BCA a.n Hendra Syahira untuk iuran SPP bulan ini. Terima kasih admin!"
                />
              </div>

              {/* Upload Proof Image Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Foto Struk / Bukti Transfer:
                  </label>
                  <button
                    type="button"
                    onClick={handleUseSampleProof}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    <span>Gunakan Contoh Bukti m-BCA</span>
                  </button>
                </div>

                {!imagePreviewUrl ? (
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center block cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/20">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Klik untuk upload foto bukti transfer
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Format PNG, JPG, JPEG (Maks. 5 MB)
                    </p>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 group">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview Bukti Pembayaran"
                      className="w-full h-44 object-contain object-center"
                    />
                    <button
                      type="button"
                      onClick={() => setImagePreviewUrl('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                      title="Hapus foto bukti"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                      Foto Bukti Siap Dikirim
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !imagePreviewUrl}
                className={`w-full py-3 rounded-2xl font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  imagePreviewUrl && !isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span>Mengirim Bukti...</span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Kirim Bukti Pembayaran ke Admin</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Status Verifikasi & History of Submissions */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900">
                    Histori Bukti Pembayaran & Status Verifikasi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Semua pengajuan bukti transfer yang telah Anda kirim beserta verifikasi admin.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={historyYearFilter}
                    onChange={(e) => setHistoryYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer focus:outline-none"
                  >
                    <option value="all">Semua Tahun</option>
                    {getYearOptions().map((y) => (
                      <option key={y} value={y}>Tahun {y}</option>
                    ))}
                  </select>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                    {displayedSubmissions.length} Data
                  </span>
                </div>
              </div>

              {displayedSubmissions.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Belum ada bukti pembayaran yang diunggah</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Silakan gunakan form di samping untuk mengunggah bukti transfer iuran bulan ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {displayedSubmissions.map((sub) => {
                    const period = sub.bulan && sub.tahun 
                      ? `${monthNames[sub.bulan - 1]} ${sub.tahun}`
                      : sub.tipe;

                    return (
                      <div
                        key={sub.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          sub.status === 'verified'
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : sub.status === 'pending'
                            ? 'bg-amber-50/40 border-amber-200'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          {/* Left details */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-display font-bold text-sm text-slate-900">
                                Iuran {period}
                              </span>

                              {/* Status Badge */}
                              {sub.status === 'verified' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Terverifikasi Lunas
                                </span>
                              )}
                              {sub.status === 'pending' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  Menunggu Verifikasi Admin
                                </span>
                              )}
                              {sub.status === 'rejected' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  Ditolak
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600">
                              Nominal: <strong className="font-mono text-slate-900">Rp {sub.nominal.toLocaleString('id-ID')}</strong> · {sub.metodePembayaran}
                            </p>

                            {/* Student Message */}
                            {sub.pesanSiswa && (
                              <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/60 text-xs text-slate-700 flex items-start gap-2">
                                <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                <span className="italic">"{sub.pesanSiswa}"</span>
                              </div>
                            )}

                            {/* Verification Result Feedback */}
                            {sub.status === 'verified' && (
                              <div className="pt-1 text-xs text-emerald-800 space-y-1">
                                <p className="font-semibold flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  Diverifikasi oleh: {sub.diverifikasiOleh || 'Super Admin'} ({sub.tanggalVerifikasi})
                                </p>
                                {sub.catatanAdmin && (
                                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-emerald-100">
                                    Catatan Admin: <em>{sub.catatanAdmin}</em>
                                  </p>
                                )}
                              </div>
                            )}

                            {sub.status === 'rejected' && sub.catatanAdmin && (
                              <div className="p-2 rounded-lg bg-rose-100 text-rose-800 text-xs">
                                <strong>Alasan Penolakan:</strong> {sub.catatanAdmin}
                              </div>
                            )}

                            <p className="text-[10px] text-slate-400">
                              Dikirim pada: {sub.tanggalKirim}
                            </p>
                          </div>

                          {/* Right thumbnail & action */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div
                              onClick={() => setPreviewImage({
                                url: sub.buktiGambarUrl,
                                title: `Bukti Transfer Iuran ${period}`,
                                nominal: sub.nominal,
                                tanggal: sub.tanggalTransfer,
                              })}
                              className="w-16 h-16 rounded-xl overflow-hidden border border-slate-300 bg-slate-100 cursor-pointer hover:border-emerald-500 transition-all relative group"
                              title="Klik untuk perbesar bukti"
                            >
                              <img
                                src={sub.buktiGambarUrl}
                                alt="Bukti Transfer"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </div>
                            </div>

                            {/* If verified, show receipt button */}
                            {sub.status === 'verified' && sub.kuitansiId && (
                              <button
                                onClick={() => onViewReceipt(receiptForSubmission(sub, transactions))}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Kuitansi Resmi</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATRIKS IURAN 12 BULAN */}
      {activeTab === 'iuran' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">
                Status Pembayaran Iuran Rutin 12 Bulan (Tahun {selectedYear})
              </h2>
              <p className="text-xs text-slate-500">
                Tanda centang hijau menunjukkan iuran yang telah diverifikasi dan lunas oleh admin klub.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Year Selector with Prev & Next */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => y - 1)}
                  className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Tahun Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 px-1">
                  <span className="text-xs font-semibold text-slate-500">Tahun:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="rounded-lg border-0 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  >
                    {getYearOptions(selectedYear).map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => y + 1)}
                  className="p-1 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                  title="Tahun Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2.5 text-xs">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Lunas
                </span>
                <span className="flex items-center gap-1 text-amber-700 font-semibold">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Pending
                </span>
                <span className="flex items-center gap-1 text-slate-400 font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-slate-300" />
                  Belum Bayar
                </span>
              </div>
            </div>
          </div>

          {/* 12 Months Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {monthNames.map((mName, idx) => {
              const monthNum = idx + 1;
              const due = studentDues.find((d) => d.bulan === monthNum && d.tahun === selectedYear);
              const sub = studentSubmissions.find(
                (s) => s.bulan === monthNum && s.tahun === selectedYear
              );
              const isPaid = due?.status === 'lunas' || sub?.status === 'verified';
              const isPending = sub?.status === 'pending';

              return (
                <div
                  key={monthNum}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPaid
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                      : isPending
                      ? 'bg-amber-50/50 border-amber-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-700">
                      {mName}
                    </span>
                    {isPaid ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    ) : isPending ? (
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center">
                        <Clock className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                        <XCircle className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <p className="font-mono text-sm font-bold text-slate-900">
                    Rp {studentClass?.iuranBulanan.toLocaleString('id-ID')}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    {isPaid ? (
                      <>
                        <span className="text-emerald-700 font-bold">LUNAS</span>
                        {(due?.kuitansiId || sub?.kuitansiId) && (
                          <span className="font-mono text-[10px] text-slate-500">
                            {due?.kuitansiId || sub?.kuitansiId}
                          </span>
                        )}
                      </>
                    ) : isPending ? (
                      <>
                        <span className="text-amber-700 font-bold">Menunggu Cek Admin</span>
                        <span className="text-[10px] text-amber-600">Pending</span>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-500">Belum Dibayar</span>
                        <button
                          onClick={() => {
                            setSelectedMonth(monthNum);
                            setActiveTab('upload');
                          }}
                          className="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                        >
                          Bayar Sekarang →
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: DATA KEHADIRAN & ABSENSI SISWA */}
      {activeTab === 'absensi' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">
                Rekapitulasi Kehadiran & Sesi Latihan Atlet
              </h2>
              <p className="text-xs text-slate-500">
                Catatan presensi harian yang diverifikasi langsung oleh tim pelatih di lapangan.
              </p>
            </div>

            {/* Attendance Progress Bar */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 sm:w-64">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Tingkat Kehadiran:</span>
                <span className="text-emerald-700">{attendanceRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 text-right">
                Hadir {attendedCount} dari {totalSessionsCount} sesi latihan
              </p>
            </div>
          </div>

          {/* Attendance Sessions Table */}
          {studentSessions.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Belum ada sesi latihan yang tercatat untuk atlet ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Tanggal Latihan</th>
                    <th className="py-3 px-3">Topik / Materi</th>
                    <th className="py-3 px-3">Pelatih</th>
                    <th className="py-3 px-3">Status Kehadiran</th>
                    <th className="py-3 px-3">Catatan Pelatih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentSessions.map((sess) => {
                    const isPresent = sess.kehadiran[currentStudent.id] === true;

                    return (
                      <tr key={sess.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                          {sess.tanggal}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {sess.catatan || 'Latihan Rutin Akademi'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {sess.pelatih || studentClass?.pelatih}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Hadir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Tidak Hadir
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">
                          {sess.catatan || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* FULL-RES IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
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
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer"
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

            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
