import React, { useState } from 'react';
import { 
  Student, 
  ClassGroup, 
  MonthlyDueRecord, 
  ClubEvent, 
  EventParticipant, 
  AttendanceSession, 
  FeeStatus,
  PaymentSubmission,
  PaymentTransaction,
  PaymentMethod
} from '../types/sportkit';
import { formatRupiah, numberToWordsId } from '../utils/numberToWordsId';
import { SAMPLE_TRANSFER_PROOF_SVG } from '../services/storage';
import { 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Edit3, 
  Check, 
  ChevronDown, 
  Award, 
  MessageCircle, 
  Clock, 
  Layers, 
  Sparkles, 
  Receipt, 
  FileText, 
  MessageSquare, 
  ZoomIn, 
  Eye, 
  Maximize2, 
  X, 
  ShieldCheck, 
  CheckCheck, 
  Filter, 
  ArrowUpRight, 
  ExternalLink,
  Upload,
  PlusCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ProfilSiswaViewProps {
  students: Student[];
  classes: ClassGroup[];
  monthlyDues: MonthlyDueRecord[];
  events: ClubEvent[];
  eventParticipants: EventParticipant[];
  attendanceSessions: AttendanceSession[];
  selectedStudentId: string;
  submissions?: PaymentSubmission[];
  transactions?: PaymentTransaction[];
  onSelectStudent: (id: string) => void;
  onOpenPaymentModal: (due: MonthlyDueRecord, student: Student, classGroup: ClassGroup) => void;
  onOpenEventPaymentModal: (event: ClubEvent, participant: EventParticipant, student: Student, classGroup: ClassGroup) => void;
  onUpdateStudent: (student: Student) => void;
  onVerifySubmission?: (submissionId: string, catatanAdmin: string) => void;
  onRejectSubmission?: (submissionId: string, alasan: string) => void;
  onViewReceipt?: (tx: PaymentTransaction) => void;
  onAdminRecordPaymentWithProof?: (data: {
    siswaId: string;
    siswaNama: string;
    kelasId: string;
    kelasNama: string;
    bulan: number;
    tahun: number;
    nominal: number;
    metodePembayaran: PaymentMethod;
    tanggalTransfer: string;
    buktiGambarUrl: string;
    pesanPembayaran?: string;
    catatanAdmin?: string;
  }) => void;
}

type TabKey = 'iuran' | 'bukti' | 'event' | 'absensi' | 'biodata';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const FULL_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const ProfilSiswaView: React.FC<ProfilSiswaViewProps> = ({
  students,
  classes,
  monthlyDues,
  events,
  eventParticipants,
  attendanceSessions,
  selectedStudentId,
  submissions = [],
  transactions = [],
  onSelectStudent,
  onOpenPaymentModal,
  onOpenEventPaymentModal,
  onUpdateStudent,
  onVerifySubmission,
  onRejectSubmission,
  onViewReceipt,
  onAdminRecordPaymentWithProof,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('iuran');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isEditingBiodata, setIsEditingBiodata] = useState<boolean>(false);
  const [filterProofStatus, setFilterProofStatus] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [proofYearFilter, setProofYearFilter] = useState<number | 'all'>('all');

  // Active student
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentClass = classes.find((c) => c.id === currentStudent?.kelasId) || classes[0];

  // Biodata Edit State
  const [editForm, setEditForm] = useState<Student | null>(currentStudent);

  // High-Res Image Lightbox Preview Modal
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    title: string;
    nominal: number;
    tanggal: string;
    metode: string;
    status: string;
    sub: PaymentSubmission;
  } | null>(null);

  // Admin Quick Verify Modal
  const [verifyModalSub, setVerifyModalSub] = useState<PaymentSubmission | null>(null);
  const [verifyNote, setVerifyNote] = useState<string>('Dana telah masuk rekening klub, pembayaran terverifikasi.');

  // Admin Quick Reject Modal
  const [rejectModalSub, setRejectModalSub] = useState<PaymentSubmission | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Bukti transfer tidak valid atau nominal tidak cocok.');

  // Admin Manual Input Proof Modal
  const [adminInputProofModal, setAdminInputProofModal] = useState<{
    isOpen: boolean;
    bulan: number;
    tahun: number;
  } | null>(null);

  const [inputNominal, setInputNominal] = useState<number>(currentClass?.iuranBulanan || 100000);
  const [inputMetode, setInputMetode] = useState<PaymentMethod>('Transfer BCA');
  const [inputTanggal, setInputTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [inputBuktiUrl, setInputBuktiUrl] = useState<string>('');
  const [inputPesan, setInputPesan] = useState<string>('');
  const [inputCatatanAdmin, setInputCatatanAdmin] = useState<string>('Pembayaran diinput & diverifikasi oleh Admin.');

  React.useEffect(() => {
    setEditForm(currentStudent);
    setIsEditingBiodata(false);
  }, [currentStudent]);

  if (!currentStudent) {
    return (
      <div className="sports-card rounded-2xl p-12 text-center space-y-3">
        <User className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-display font-bold text-slate-800">Belum Ada Data Siswa</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Database masih kosong dari nol. Silakan lakukan pendaftaran siswa baru melalui menu Pendaftaran Baru untuk melihat data profil di sini.
        </p>
      </div>
    );
  }

  // Monthly dues for this student & year
  const studentDues = monthlyDues.filter(
    (d) => d.siswaId === currentStudent.id && d.tahun === selectedYear
  );

  const studentEventParticipants = eventParticipants.filter(
    (ep) => ep.siswaId === currentStudent.id
  );

  // Submissions for this student
  const studentSubmissions = (submissions || []).filter((s) => s.siswaId === currentStudent.id);
  const pendingSubmissions = studentSubmissions.filter((s) => s.status === 'pending');
  const verifiedSubmissions = studentSubmissions.filter((s) => s.status === 'verified');
  const rejectedSubmissions = studentSubmissions.filter((s) => s.status === 'rejected');

  const filteredProofs = studentSubmissions.filter((s) => {
    if (proofYearFilter !== 'all' && s.tahun && s.tahun !== proofYearFilter) return false;
    if (filterProofStatus === 'all') return true;
    return s.status === filterProofStatus;
  });

  const handleOpenReceiptForSub = (sub: PaymentSubmission) => {
    if (!onViewReceipt) return;
    const existingTx = transactions?.find((t) => t.id === sub.transactionId || t.nomorKuitansi === sub.kuitansiId);
    if (existingTx) {
      onViewReceipt(existingTx);
    } else {
      const tx: PaymentTransaction = {
        id: sub.transactionId || `tx-${sub.id}`,
        nomorKuitansi: sub.kuitansiId || 'INVSP-OFFICIAL',
        siswaId: sub.siswaId,
        siswaNama: sub.siswaNama,
        kelasNama: sub.kelasNama,
        tanggal: sub.tanggalTransfer || sub.tanggalVerifikasi || new Date().toISOString().slice(0, 10),
        nominal: sub.nominal,
        terbilang: numberToWordsId(sub.nominal),
        metodePembayaran: sub.metodePembayaran,
        tipe: 'Iuran Rutin',
        keterangan: sub.pesanSiswa || `Iuran Rutin ${sub.bulan ? FULL_MONTH_NAMES[sub.bulan - 1] : ''} ${sub.tahun || ''}`,
        catatan: sub.catatanAdmin,
      };
      onViewReceipt(tx);
    }
  };

  const handleConfirmVerify = () => {
    if (verifyModalSub && onVerifySubmission) {
      onVerifySubmission(verifyModalSub.id, verifyNote);
      setVerifyModalSub(null);
    }
  };

  const handleConfirmReject = () => {
    if (rejectModalSub && onRejectSubmission) {
      onRejectSubmission(rejectModalSub.id, rejectReason);
      setRejectModalSub(null);
    }
  };

  const getCellColorClass = (status: FeeStatus) => {
    switch (status) {
      case 'lunas':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs';
      case 'belum_lunas':
        return 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs';
      case 'belum_bayar':
        return 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer shadow-xs';
      case 'belum_bergabung':
        return 'bg-slate-200 text-slate-400 cursor-not-allowed';
      case 'cuti':
        return 'bg-amber-100 text-amber-800 border border-amber-300';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const openAdminInputProofModal = (monthNumber: number, year: number) => {
    const defaultNominal = currentClass?.iuranBulanan || 100000;
    setInputNominal(defaultNominal);
    setInputMetode('Transfer BCA');
    setInputTanggal(new Date().toISOString().split('T')[0]);
    setInputBuktiUrl(SAMPLE_TRANSFER_PROOF_SVG);
    setInputPesan(
      `Pembayaran iuran bulan ${FULL_MONTH_NAMES[monthNumber - 1]} ${year} dari wali murid ${
        currentStudent.orangTua?.namaAyah || currentStudent.orangTua?.namaIbu || currentStudent.nama
      }`
    );
    setInputCatatanAdmin('Pembayaran diinput & diverifikasi langsung oleh Admin.');
    setAdminInputProofModal({
      isOpen: true,
      bulan: monthNumber,
      tahun: year,
    });
  };

  const handleAdminFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputBuktiUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitAdminProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminInputProofModal) return;

    if (!inputBuktiUrl) {
      alert('Mohon lampirkan struk / foto bukti pembayaran transfer.');
      return;
    }

    if (!inputNominal || inputNominal <= 0) {
      alert('Nominal pembayaran harus lebih dari 0.');
      return;
    }

    if (onAdminRecordPaymentWithProof) {
      onAdminRecordPaymentWithProof({
        siswaId: currentStudent.id,
        siswaNama: currentStudent.nama,
        kelasId: currentStudent.kelasId,
        kelasNama: currentClass?.nama || 'Kelas Akademi',
        bulan: adminInputProofModal.bulan,
        tahun: adminInputProofModal.tahun,
        nominal: Number(inputNominal),
        metodePembayaran: inputMetode,
        tanggalTransfer: inputTanggal,
        buktiGambarUrl: inputBuktiUrl,
        pesanPembayaran: inputPesan,
        catatanAdmin: inputCatatanAdmin,
      });
    }

    setAdminInputProofModal(null);
  };

  const handleCellClick = (monthNumber: number) => {
    const record = studentDues.find((d) => d.bulan === monthNumber);

    if (record && record.status === 'belum_bergabung') {
      alert('Siswa belum bergabung pada bulan ini.');
      return;
    }

    if (record && record.status === 'lunas') {
      const monthSub = studentSubmissions.find(
        (s) => s.bulan === monthNumber && (!s.tahun || s.tahun === selectedYear)
      );
      if (monthSub) {
        setPreviewImage({
          url: monthSub.buktiGambarUrl,
          title: `Bukti ${monthSub.tipe} - ${FULL_MONTH_NAMES[monthNumber - 1]} ${selectedYear}`,
          nominal: monthSub.nominal,
          tanggal: monthSub.tanggalTransfer,
          metode: monthSub.metodePembayaran,
          status: monthSub.status,
          sub: monthSub,
        });
      } else {
        alert(`Iuran bulan ${FULL_MONTH_NAMES[monthNumber - 1]} sudah lunas (${formatRupiah(record?.nominal || currentClass?.iuranBulanan || 100000)}).`);
      }
      return;
    }

    // Open Admin Input Proof Modal for this unpaid month!
    openAdminInputProofModal(monthNumber, selectedYear);
  };

  const handleSaveBiodata = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm) {
      onUpdateStudent(editForm);
      setIsEditingBiodata(false);
    }
  };

  const cleanedPhone = currentStudent.noHp.replace(/[^0-9]/g, '');
  const waPhone = cleanedPhone.startsWith('0') ? '62' + cleanedPhone.slice(1) : cleanedPhone;

  return (
    <div className="space-y-6">
      {/* Athlete Header Card */}
      <div className="sports-card rounded-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-[#090e17] text-white p-6 border-b border-slate-800 relative">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-pitch-pattern opacity-30 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              {/* Athlete Avatar Badge */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-slate-900 border-2 border-emerald-400/40 flex items-center justify-center font-display font-black text-2xl text-white shadow-lg shrink-0">
                {currentStudent.nama.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                    {currentStudent.nama}
                  </h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentStudent.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1.5">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    {currentClass?.nama || 'Kelas Akademi'}
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-400 font-mono">
                    ID: {currentStudent.id}
                  </span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-400">
                    {currentStudent.jenisKelamin}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Student Switcher */}
            <div className="flex flex-wrap items-center gap-3">
              {currentStudent.noHp && (
                <a
                  href={`https://wa.me/${waPhone}?text=${encodeURIComponent(
                    `Halo ${currentStudent.nama}, informasi dari pengurus ${currentClass?.nama || 'Akademi'}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              )}

              {/* Student Dropdown */}
              <div className="relative min-w-[200px]">
                <select
                  value={currentStudent.id}
                  onChange={(e) => onSelectStudent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {students
                    .filter((s) => s.status === 'Aktif')
                    .map((s) => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                        {s.nama} ({s.kelasId.toUpperCase()})
                      </option>
                    ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
          {(['iuran', 'bukti', 'event', 'absensi', 'biodata'] as TabKey[]).map((tab) => {
            const meta: { [k in TabKey]: { name: string; icon: any; count?: number; hasPending?: boolean } } = {
              iuran: { name: 'Iuran Rutin Bulanan', icon: CreditCard },
              bukti: { 
                name: 'Bukti Pembayaran', 
                icon: Receipt,
                count: studentSubmissions.length,
                hasPending: pendingSubmissions.length > 0,
              },
              event: { name: 'Event & Turnamen', icon: Award },
              absensi: { name: 'Kalender Presensi', icon: Calendar },
              biodata: { name: 'Biodata & Ortu', icon: User },
            };
            const item = meta[tab];
            const isActive = activeTab === tab;
            const Icon = item.icon;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    item.hasPending 
                      ? 'bg-amber-500 text-white animate-pulse' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {item.hasPending ? `${pendingSubmissions.length} Menunggu` : `${item.count}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: IURAN BULANAN */}
      {activeTab === 'iuran' && (
        <div className="sports-card rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">
                Matriks Pembayaran Iuran Rutin {selectedYear}
              </h2>
              <p className="text-xs text-slate-500">
                Nominal per bulan: <span className="font-bold text-slate-800 font-mono">{formatRupiah(currentClass?.iuranBulanan || 100000)}</span>. Kotak bulan menampilkan status pembayaran dan bukti transfer yang diunggah.
              </p>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
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
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                >
                  <option value={2022}>2022</option>
                  <option value={2023}>2023</option>
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
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
          </div>

          {/* Matrix Grid with Submissions Indicator */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-semibold">
                  <th className="py-2.5 px-3 border border-slate-800">Tahun</th>
                  {MONTH_NAMES.map((m) => (
                    <th key={m} className="py-2.5 px-2 border border-slate-800">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-3 border border-slate-200 font-bold text-xs bg-slate-50 text-slate-800 font-mono">
                    {selectedYear}
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => {
                    const due = studentDues.find((d) => d.bulan === monthNum);
                    const status: FeeStatus = due ? due.status : 'belum_bayar';
                    const monthSub = studentSubmissions.find(
                      (s) => s.bulan === monthNum && (!s.tahun || s.tahun === selectedYear)
                    );

                    return (
                      <td
                        key={monthNum}
                        onClick={() => {
                          if (monthSub && monthSub.status === 'pending') {
                            setVerifyModalSub(monthSub);
                            return;
                          }
                          handleCellClick(monthNum);
                        }}
                        className={`p-2 border border-slate-200 transition-all cursor-pointer relative ${getCellColorClass(
                          status
                        )}`}
                        title={`Bulan: ${FULL_MONTH_NAMES[monthNum - 1]} (${status.replace('_', ' ')})${
                          monthSub ? ` - Bukti Pembayaran: ${monthSub.status.toUpperCase()}` : ''
                        }`}
                      >
                        <div className="min-w-[48px] min-h-[40px] flex flex-col items-center justify-center font-bold text-xs font-mono">
                          <span>
                            {status === 'lunas' && '✓ LUNAS'}
                            {status === 'belum_lunas' && '½ SEBAGIAN'}
                            {status === 'belum_bayar' && 'BAYAR'}
                            {status === 'belum_bergabung' && '-'}
                            {status === 'cuti' && 'CUTI'}
                          </span>
                          {monthSub && (
                            <span
                              className={`text-[8px] px-1 py-0.5 rounded leading-none mt-1 font-sans font-bold flex items-center gap-0.5 shadow-xs ${
                                monthSub.status === 'pending'
                                  ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                                  : monthSub.status === 'verified'
                                  ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-400/40'
                                  : 'bg-rose-950/80 text-rose-200 border border-rose-400/40'
                              }`}
                            >
                              {monthSub.status === 'pending' && '⏳ Verifikasi'}
                              {monthSub.status === 'verified' && '📎 Bukti OK'}
                              {monthSub.status === 'rejected' && '✕ Ditolak'}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Color Legend */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-5 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 shadow-xs" />
              <span className="font-semibold">Lunas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 shadow-xs" />
              <span className="font-semibold">Belum Lunas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-rose-500 shadow-xs" />
              <span className="font-semibold">Belum Bayar (Bisa Diklik)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-200" />
              <span className="font-semibold text-slate-500">Belum Bergabung</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-100 border border-amber-300" />
              <span className="font-semibold text-amber-800">Cuti</span>
            </div>
            <div className="h-4 w-px bg-slate-300 hidden md:block" />
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400 text-slate-950 font-bold animate-pulse">
                ⏳ Verifikasi
              </span>
              <span className="font-medium text-slate-600">Bukti Transfer Belum Diverifikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-800 text-emerald-200 font-bold">
                📎 Bukti OK
              </span>
              <span className="font-medium text-slate-600">Bukti Transfer Sudah Diverifikasi</span>
            </div>
          </div>

          {/* Preview Bukti Pembayaran Siswa Card in Tab Iuran */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-display font-bold text-white">
                    Bukti Pembayaran Siswa Terlampir ({currentStudent.nama})
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Menampilkan bukti transfer pembayaran baik yang <strong>sudah terverifikasi</strong> maupun <strong>belum diverifikasi</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('bukti')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span>Buka Tab Bukti ({studentSubmissions.length})</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {studentSubmissions.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-300">Belum ada bukti pembayaran yang diunggah untuk siswa ini</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Siswa atau orang tua dapat mengunggah bukti transfer iuran melalui akun Siswa (Student Portal).
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {studentSubmissions.slice(0, 4).map((sub) => {
                  const period = sub.bulan && sub.tahun
                    ? `${FULL_MONTH_NAMES[sub.bulan - 1]} ${sub.tahun}`
                    : sub.tipe;

                  return (
                    <div
                      key={sub.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                        sub.status === 'verified'
                          ? 'bg-slate-800/80 border-emerald-500/30'
                          : sub.status === 'pending'
                          ? 'bg-slate-800/80 border-amber-500/40'
                          : 'bg-slate-800/80 border-rose-500/30'
                      }`}
                    >
                      {/* Image Thumbnail Clickable */}
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: sub.buktiGambarUrl,
                            title: `Bukti ${sub.tipe} - ${period}`,
                            nominal: sub.nominal,
                            tanggal: sub.tanggalTransfer,
                            metode: sub.metodePembayaran,
                            status: sub.status,
                            sub,
                          })
                        }
                        className="relative w-16 h-20 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 shrink-0 group cursor-pointer focus:outline-none"
                        title="Klik untuk memperbesar bukti transfer"
                      >
                        <img
                          src={sub.buktiGambarUrl}
                          alt="Bukti Transfer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <ZoomIn className="w-4 h-4 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        </div>
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-white truncate">
                            {sub.tipe} ({period})
                          </span>
                          {/* Status Badge */}
                          {sub.status === 'verified' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Terverifikasi
                            </span>
                          )}
                          {sub.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Menunggu
                            </span>
                          )}
                          {sub.status === 'rejected' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              Ditolak
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-300">
                          <strong className="text-emerald-400 font-mono text-sm">{formatRupiah(sub.nominal)}</strong>
                          <span className="text-slate-400 text-[11px] ml-1.5 font-medium">· {sub.metodePembayaran}</span>
                        </div>

                        <p className="text-[11px] text-slate-400">
                          Transfer: <span className="text-slate-300 font-medium">{sub.tanggalTransfer}</span>
                        </p>

                        {/* Action buttons */}
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          {sub.status === 'pending' && onVerifySubmission && (
                            <button
                              type="button"
                              onClick={() => setVerifyModalSub(sub)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <CheckCheck className="w-3 h-3" />
                              <span>Verifikasi Sekarang</span>
                            </button>
                          )}
                          {sub.status === 'verified' && (
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptForSub(sub)}
                              className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Receipt className="w-3 h-3 text-emerald-400" />
                              <span>Kuitansi #{sub.kuitansiId || 'RESMI'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewImage({
                                url: sub.buktiGambarUrl,
                                title: `Bukti ${sub.tipe} - ${period}`,
                                nominal: sub.nominal,
                                tanggal: sub.tanggalTransfer,
                                metode: sub.metodePembayaran,
                                status: sub.status,
                                sub,
                              })
                            }
                            className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline flex items-center gap-1 ml-auto"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Perbesar Bukti</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB BUKTI: BUKTI PEMBAYARAN SISWA (LENGKAP) */}
      {activeTab === 'bukti' && (
        <div className="space-y-6">
          {/* Header Card & Filter Bar */}
          <div className="sports-card rounded-2xl p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verifikasi Struk & Bukti Transfer
                </span>
                <h2 className="text-lg font-display font-extrabold text-slate-900 mt-2">
                  Daftar Bukti Pembayaran ({currentStudent.nama})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan semua bukti transfer iuran dan kegiatan yang diunggah, baik yang <strong>sudah terverifikasi</strong> maupun <strong>belum diverifikasi</strong>.
                </p>
              </div>

              {/* Status Statistics Pills & Add Button */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                  Total: {studentSubmissions.length}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Belum Verifikasi: {pendingSubmissions.length}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Terverifikasi: {verifiedSubmissions.length}
                </span>
                <button
                  type="button"
                  onClick={() => openAdminInputProofModal(12, selectedYear)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs sm:ml-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Input Bukti Pembayaran</span>
                </button>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filter Status:
              </span>
              {[
                { id: 'all', label: `Semua (${studentSubmissions.length})` },
                { id: 'pending', label: `Menunggu Verifikasi (${pendingSubmissions.length})` },
                { id: 'verified', label: `Sudah Terverifikasi (${verifiedSubmissions.length})` },
                { id: 'rejected', label: `Ditolak (${rejectedSubmissions.length})` },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilterProofStatus(btn.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterProofStatus === btn.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Filter Year Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Filter Tahun:
              </span>
              <button
                onClick={() => setProofYearFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  proofYearFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Tahun
              </button>
              {[2022, 2023, 2024, 2025, 2026, 2027].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setProofYearFilter(yr)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer font-mono ${
                    proofYearFilter === yr
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tahun {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions List */}
          {filteredProofs.length === 0 ? (
            <div className="sports-card rounded-2xl p-12 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-display font-bold text-slate-800">
                Tidak Ada Bukti Pembayaran Sesuai Filter
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {filterProofStatus === 'all'
                  ? 'Siswa ini belum pernah mengunggah bukti pembayaran atau kwitansi transfer.'
                  : `Tidak ditemukan bukti pembayaran dengan status "${filterProofStatus}".`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProofs.map((sub) => {
                const period = sub.bulan && sub.tahun
                  ? `${FULL_MONTH_NAMES[sub.bulan - 1]} ${sub.tahun}`
                  : sub.tipe;

                return (
                  <div
                    key={sub.id}
                    className={`sports-card rounded-2xl overflow-hidden border p-5 flex flex-col justify-between transition-all ${
                      sub.status === 'verified'
                        ? 'border-emerald-200 bg-white hover:border-emerald-300'
                        : sub.status === 'pending'
                        ? 'border-amber-300 bg-amber-50/20 hover:border-amber-400'
                        : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div className="space-y-4">
                      {/* Top Header of the card */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {sub.id}
                            </span>
                            <span className="text-xs font-display font-bold text-slate-900">
                              {sub.tipe}
                            </span>
                          </div>
                          <h4 className="text-sm font-display font-black text-slate-900 mt-1">
                            {period}
                          </h4>
                        </div>

                        {/* Status Badge */}
                        {sub.status === 'verified' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Terverifikasi Lunas
                          </span>
                        )}
                        {sub.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-xs animate-pulse">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Menunggu Verifikasi Admin
                          </span>
                        )}
                        {sub.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Ditolak
                          </span>
                        )}
                      </div>

                      {/* Image Thumbnail and Details Row */}
                      <div className="flex gap-4">
                        {/* Image Preview Container */}
                        <div
                          onClick={() =>
                            setPreviewImage({
                              url: sub.buktiGambarUrl,
                              title: `Bukti ${sub.tipe} - ${period}`,
                              nominal: sub.nominal,
                              tanggal: sub.tanggalTransfer,
                              metode: sub.metodePembayaran,
                              status: sub.status,
                              sub,
                            })
                          }
                          className="w-28 h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative group cursor-pointer shrink-0 shadow-xs"
                          title="Klik untuk melihat bukti ukuran penuh"
                        >
                          <img
                            src={sub.buktiGambarUrl}
                            alt="Struk Transfer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-slate-900/10 flex flex-col items-center justify-center text-white transition-all">
                            <ZoomIn className="w-5 h-5 mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-bold bg-black/60 px-1.5 py-0.5 rounded">
                              Perbesar
                            </span>
                          </div>
                        </div>

                        {/* Details List */}
                        <div className="flex-1 space-y-2 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px] font-medium">Nominal Transfer:</span>
                            <span className="text-base font-display font-extrabold text-emerald-700 font-mono">
                              {formatRupiah(sub.nominal)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-400 block font-medium">Metode:</span>
                              <span className="font-semibold text-slate-800">{sub.metodePembayaran}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Tgl Transfer:</span>
                              <span className="font-semibold text-slate-800">{sub.tanggalTransfer}</span>
                            </div>
                          </div>

                          <div className="text-[11px]">
                            <span className="text-slate-400 block font-medium">Waktu Kirim:</span>
                            <span className="font-mono text-slate-600">{sub.tanggalKirim}</span>
                          </div>
                        </div>
                      </div>

                      {/* Student Message */}
                      {sub.pesanSiswa && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div className="italic">
                            <span className="font-semibold not-italic text-slate-500 text-[10px] block">
                              Pesan / Catatan Siswa:
                            </span>
                            "{sub.pesanSiswa}"
                          </div>
                        </div>
                      )}

                      {/* Verification Results info if verified */}
                      {sub.status === 'verified' && (
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              Verifikasi Berhasil
                            </span>
                            <span className="text-[11px] font-mono font-bold text-emerald-700">
                              Kuitansi: {sub.kuitansiId || 'INVSP-RESMI'}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-700">
                            Diverifikasi pada <strong className="font-medium">{sub.tanggalVerifikasi || '-'}</strong> oleh{' '}
                            <strong className="font-medium">{sub.diverifikasiOleh || 'Super Admin'}</strong>.
                          </p>
                          {sub.catatanAdmin && (
                            <p className="text-[11px] text-emerald-800 italic pt-1 border-t border-emerald-200/60">
                              Catatan Admin: "{sub.catatanAdmin}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Rejection Result info if rejected */}
                      {sub.status === 'rejected' && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-900 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-rose-800">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            Bukti Ditolak Admin
                          </div>
                          <p className="text-[11px] text-rose-700">
                            Alasan: <strong className="font-medium">{sub.catatanAdmin || 'Bukti transfer tidak sesuai.'}</strong>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewImage({
                            url: sub.buktiGambarUrl,
                            title: `Bukti ${sub.tipe} - ${period}`,
                            nominal: sub.nominal,
                            tanggal: sub.tanggalTransfer,
                            metode: sub.metodePembayaran,
                            status: sub.status,
                            sub,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-slate-500" />
                        <span>Perbesar Bukti</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {sub.status === 'pending' && (
                          <>
                            {onRejectSubmission && (
                              <button
                                type="button"
                                onClick={() => setRejectModalSub(sub)}
                                className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Tolak
                              </button>
                            )}
                            {onVerifySubmission && (
                              <button
                                type="button"
                                onClick={() => setVerifyModalSub(sub)}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Verifikasi & Ceklist Lunas</span>
                              </button>
                            )}
                          </>
                        )}

                        {sub.status === 'verified' && (
                          <button
                            type="button"
                            onClick={() => handleOpenReceiptForSub(sub)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Lihat Kuitansi Resmi</span>
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
      )}

      {/* TAB 2: EVENT */}
      {activeTab === 'event' && (
        <div className="sports-card rounded-2xl p-6 space-y-4">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="text-base font-display font-bold text-slate-900">
              Iuran Insidentil & Keikutsertaan Turnamen
            </h2>
            <p className="text-xs text-slate-500">
              Biaya kejuaraan, try-out, dan kegiatan insidentil yang diikuti atlet
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Kegiatan</th>
                  <th className="py-3 px-4">Biaya</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((evt) => {
                  const part = studentEventParticipants.find((p) => p.eventId === evt.id);
                  const isRegistered = !!part;
                  const isLunas = part?.status === 'lunas';

                  return (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 text-sm">{evt.nama}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{evt.deskripsi}</span>
                          <span aria-hidden="true">·</span>
                          <span>{evt.tanggal}</span>
                          <span aria-hidden="true">·</span>
                          <span>{evt.lokasi}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 font-mono tabular-nums">
                        {formatRupiah(evt.nominal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isRegistered ? (
                          isLunas ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                              <XCircle className="w-3.5 h-3.5" /> Belum Lunas
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[11px]">
                            Tidak Ikut
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isRegistered && !isLunas && (
                          <button
                            onClick={() => onOpenEventPaymentModal(evt, part, currentStudent, currentClass)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors"
                          >
                            Bayar Sekarang
                          </button>
                        )}
                        {isRegistered && isLunas && (
                          <span className="text-xs text-slate-400 font-mono">
                            {part.kuitansiId || 'Terbayar'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ABSENSI */}
      {activeTab === 'absensi' && (
        <div className="sports-card rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">
                Kalender Rekap Presensi Atlet ({selectedYear})
              </h2>
              <p className="text-xs text-slate-500">
                Warna hijau menandakan atlet tercatat hadir pada sesi latihan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-slate-700">Hadir Latihan</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FULL_MONTH_NAMES.map((mName, mIdx) => {
              const monthNumber = mIdx + 1;
              const daysInMonth = new Date(selectedYear, monthNumber, 0).getDate();
              const monthSessions = attendanceSessions.filter((s) => {
                const parts = s.tanggal.split('-');
                return Number(parts[0]) === selectedYear && Number(parts[1]) === monthNumber;
              });

              return (
                <div key={mName} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="font-bold text-xs text-slate-800 text-center pb-2 border-b border-slate-200">
                    {mName}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-bold text-slate-400 my-1.5">
                    <span>S</span>
                    <span>S</span>
                    <span>R</span>
                    <span>K</span>
                    <span>J</span>
                    <span>S</span>
                    <span>M</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-[11px] text-center">
                    {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                      const day = dayIdx + 1;
                      const dateStr = `${selectedYear}-${monthNumber.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                      const session = monthSessions.find((s) => s.tanggal === dateStr);
                      const isPresent = session?.kehadiran[currentStudent.id] === true;
                      const isAbsent = session && session.kehadiran[currentStudent.id] === false;

                      return (
                        <div
                          key={day}
                          className={`h-6 flex items-center justify-center rounded text-[10px] font-semibold transition-colors ${
                            isPresent
                              ? 'bg-emerald-500 text-white font-bold shadow-xs'
                              : isAbsent
                              ? 'bg-rose-400 text-white'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title={session ? `Sesi latihan: ${isPresent ? 'Hadir' : 'Tidak Hadir'}` : ''}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BIODATA */}
      {activeTab === 'biodata' && (
        <div className="sports-card rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">
                Biodata & Informasi Kontak
              </h2>
              <p className="text-xs text-slate-500">
                Informasi atlet dan kontak darurat orang tua/wali
              </p>
            </div>
            {!isEditingBiodata ? (
              <button
                onClick={() => setIsEditingBiodata(true)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Biodata</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditingBiodata(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Batal
              </button>
            )}
          </div>

          {isEditingBiodata && editForm ? (
            <form onSubmit={handleSaveBiodata} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Siswa</label>
                  <input
                    type="text"
                    required
                    value={editForm.nama}
                    onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No HP Siswa</label>
                  <input
                    type="text"
                    value={editForm.noHp}
                    onChange={(e) => setEditForm({ ...editForm, noHp: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
                  <input
                    type="text"
                    value={editForm.alamat}
                    onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ayah/Wali</label>
                  <input
                    type="text"
                    value={editForm.orangTua.namaAyah}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orangTua: { ...editForm.orangTua, namaAyah: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No HP Ayah/Wali</label>
                  <input
                    type="text"
                    value={editForm.orangTua.noHpAyah}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orangTua: { ...editForm.orangTua, noHpAyah: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ibu/Wali</label>
                  <input
                    type="text"
                    value={editForm.orangTua.namaIbu}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orangTua: { ...editForm.orangTua, namaIbu: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No HP Ibu/Wali</label>
                  <input
                    type="text"
                    value={editForm.orangTua.noHpIbu}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orangTua: { ...editForm.orangTua, noHpIbu: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[11px]">Nama Lengkap</span>
                <span className="font-bold text-slate-900 text-sm">{currentStudent.nama}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[11px]">Jenis Kelamin</span>
                <span className="font-bold text-slate-900 text-sm">{currentStudent.jenisKelamin}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[11px]">Tempat, Tanggal Lahir</span>
                <span className="font-bold text-slate-900 text-sm">
                  {currentStudent.tempatLahir}, {currentStudent.tanggalLahir}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[11px]">No. WhatsApp Siswa</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{currentStudent.noHp}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[11px]">Email</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{currentStudent.email || '-'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[11px]">Alamat Domisili</span>
                <span className="font-bold text-slate-900 text-sm">{currentStudent.alamat}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[11px]">Nama Ayah/Wali</span>
                <span className="font-bold text-slate-900 text-sm">{currentStudent.orangTua.namaAyah}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[11px]">No. WhatsApp Ayah</span>
                <span className="font-bold text-slate-900 text-sm font-mono">{currentStudent.orangTua.noHpAyah}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-slate-400 font-semibold block text-[11px]">Nama Ibu/Wali</span>
                <span className="font-bold text-slate-900 text-sm">{currentStudent.orangTua.namaIbu}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: HIGH-RES PROOF IMAGE LIGHTBOX */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-display font-bold text-white">
                    {previewImage.title}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Siswa: {currentStudent.nama} ({currentClass?.nama})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100 flex flex-col items-center justify-center min-h-[300px]">
              <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-300 bg-white max-w-md w-full">
                <img
                  src={previewImage.url}
                  alt={previewImage.title}
                  className="w-full h-auto object-contain max-h-[50vh]"
                />
              </div>
            </div>

            {/* Modal Footer Info & Actions */}
            <div className="p-4 bg-white border-t border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Nominal & Metode:</span>
                  <span className="font-extrabold text-slate-900 font-mono text-sm">
                    {formatRupiah(previewImage.nominal)}
                  </span>
                  <span className="text-slate-500 font-medium text-[11px] ml-1.5">
                    · {previewImage.metode}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">Status Bukti:</span>
                  {previewImage.status === 'verified' && (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> Terverifikasi Lunas
                    </span>
                  )}
                  {previewImage.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[11px] animate-pulse">
                      <Clock className="w-3 h-3" /> Menunggu Verifikasi
                    </span>
                  )}
                  {previewImage.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[11px]">
                      <XCircle className="w-3 h-3" /> Ditolak
                    </span>
                  )}
                </div>
              </div>

              {previewImage.sub.pesanSiswa && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 italic">
                  "{previewImage.sub.pesanSiswa}"
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                {previewImage.status === 'pending' && onVerifySubmission && (
                  <button
                    type="button"
                    onClick={() => {
                      const sub = previewImage.sub;
                      setPreviewImage(null);
                      setVerifyModalSub(sub);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Verifikasi Pembayaran Ini</span>
                  </button>
                )}
                {previewImage.status === 'verified' && (
                  <button
                    type="button"
                    onClick={() => {
                      const sub = previewImage.sub;
                      setPreviewImage(null);
                      handleOpenReceiptForSub(sub);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    <span>Buka Kuitansi Resmi</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM VERIFY */}
      {verifyModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-emerald-300" />
                <h3 className="text-sm font-display font-bold text-white">
                  Verifikasi & Ceklist Lunas Pembayaran
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModalSub(null)}
                className="p-1.5 rounded-full hover:bg-emerald-900 text-emerald-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Siswa:</span>
                  <span className="font-bold text-slate-900 text-sm">{verifyModalSub.siswaNama}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Pembayaran:</span>
                  <span className="font-semibold text-slate-800">
                    {verifyModalSub.tipe} {verifyModalSub.bulan ? `(${FULL_MONTH_NAMES[verifyModalSub.bulan - 1]} ${verifyModalSub.tahun})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Nominal Transfer:</span>
                  <span className="font-bold text-emerald-700 font-mono text-base">{formatRupiah(verifyModalSub.nominal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Metode & Tgl:</span>
                  <span className="font-semibold text-slate-800">{verifyModalSub.metodePembayaran} ({verifyModalSub.tanggalTransfer})</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Admin untuk Siswa (Akan tercetak di kuitansi resmi):
                </label>
                <textarea
                  rows={2}
                  value={verifyNote}
                  onChange={(e) => setVerifyNote(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Contoh: Dana telah masuk rekening BCA klub, terverifikasi lunas."
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1 text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Konfirmasi Dampak Sistem:
                </p>
                <p>
                  1. Status iuran bulan bersangkutan otomatis berubah menjadi <strong>LUNAS</strong>.
                </p>
                <p>
                  2. Kuitansi resmi digital klub otomatis diterbitkan dan dapat diakses oleh siswa.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setVerifyModalSub(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmVerify}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Konfirmasi & Terbitkan Kuitansi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REJECT */}
      {rejectModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-200" />
                <h3 className="text-sm font-display font-bold text-white">
                  Tolak Bukti Pembayaran Siswa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectModalSub(null)}
                className="p-1.5 rounded-full hover:bg-rose-800 text-rose-200 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600">
                Silakan tuliskan alasan penolakan agar siswa atau orang tua dapat memperbaiki bukti pembayaran mereka:
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan:
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Contoh: Bukti transfer tidak jelas / nominal transfer kurang Rp 20.000."
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalSub(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                Tolak Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADMIN INPUT BUKTI PEMBAYARAN & PESAN (UNTUK BULAN DESEMBER DLL) */}
      {adminInputProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-white">
                    Input Bukti Pembayaran & Iuran Siswa
                  </h3>
                  <p className="text-xs text-slate-300">
                    Siswa: <strong className="text-white">{currentStudent.nama}</strong> ({currentClass?.nama})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAdminInputProofModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitAdminProof} className="p-6 space-y-4 text-xs">
              {/* Target Period & Class info */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Target Pembayaran</span>
                  <span className="text-sm font-display font-black text-emerald-950">
                    Iuran Rutin {FULL_MONTH_NAMES[adminInputProofModal.bulan - 1]} {adminInputProofModal.tahun}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-700 block">Tarif Kelas</span>
                  <span className="text-xs font-mono font-bold text-emerald-900">
                    {formatRupiah(currentClass?.iuranBulanan || 100000)}/bln
                  </span>
                </div>
              </div>

              {/* Month & Year Selectors (Editable) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bulan Iuran:
                  </label>
                  <select
                    value={adminInputProofModal.bulan}
                    onChange={(e) => {
                      const newMonth = Number(e.target.value);
                      setAdminInputProofModal({
                        ...adminInputProofModal,
                        bulan: newMonth,
                      });
                      setInputPesan(
                        `Pembayaran iuran bulan ${FULL_MONTH_NAMES[newMonth - 1]} ${adminInputProofModal.tahun} dari wali murid ${
                          currentStudent.orangTua?.namaAyah || currentStudent.orangTua?.namaIbu || currentStudent.nama
                        }`
                      );
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-emerald-500 cursor-pointer"
                  >
                    {FULL_MONTH_NAMES.map((m, idx) => (
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
                    value={adminInputProofModal.tahun}
                    onChange={(e) => {
                      const newYear = Number(e.target.value);
                      setAdminInputProofModal({
                        ...adminInputProofModal,
                        tahun: newYear,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-emerald-500 cursor-pointer"
                  >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
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
                    required
                    value={inputNominal}
                    onChange={(e) => setInputNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-emerald-500"
                    placeholder="100000"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5 italic">
                    Terbilang: {numberToWordsId(Number(inputNominal))}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Metode Pembayaran:
                  </label>
                  <select
                    value={inputMetode}
                    onChange={(e) => setInputMetode(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-emerald-500 cursor-pointer"
                  >
                    <option value="Transfer BCA">Transfer BCA</option>
                    <option value="Transfer Mandiri">Transfer Mandiri</option>
                    <option value="Transfer BRI">Transfer BRI</option>
                    <option value="QRIS">QRIS</option>
                    <option value="Tunai">Tunai (Cash)</option>
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tanggal Transaksi / Transfer:
                </label>
                <input
                  type="date"
                  required
                  value={inputTanggal}
                  onChange={(e) => setInputTanggal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-emerald-500"
                />
              </div>

              {/* Upload Foto Bukti Pembayaran */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Unggah Bukti Struk Transfer:
                  </label>
                  <button
                    type="button"
                    onClick={() => setInputBuktiUrl(SAMPLE_TRANSFER_PROOF_SVG)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold underline cursor-pointer"
                  >
                    Gunakan Contoh Struk Transfer
                  </button>
                </div>

                {!inputBuktiUrl ? (
                  <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-slate-50/50">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAdminFileChange}
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <p className="text-xs font-bold text-slate-700">Klik untuk pilih foto struk transfer</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Format JPG, PNG, atau WEBP (Maks 5 MB)</p>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-900 group">
                    <img
                      src={inputBuktiUrl}
                      alt="Preview Bukti Pembayaran"
                      className="w-full h-40 object-contain object-center"
                    />
                    <button
                      type="button"
                      onClick={() => setInputBuktiUrl('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                      title="Ganti foto bukti"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                      ✓ Foto Bukti Terpasang
                    </div>
                  </div>
                )}
              </div>

              {/* Pesan Pembayaran */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan / Keterangan Pembayaran:
                </label>
                <textarea
                  rows={2}
                  value={inputPesan}
                  onChange={(e) => setInputPesan(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-emerald-500"
                  placeholder="Contoh: Transfer iuran via m-BCA dari orang tua siswa."
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  * Pesan ini akan disimpan ke database dan ditampilkan di akun siswa & admin.
                </p>
              </div>

              {/* Catatan Admin */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan Verifikasi Admin (Tercetak di Kuitansi):
                </label>
                <input
                  type="text"
                  value={inputCatatanAdmin}
                  onChange={(e) => setInputCatatanAdmin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-emerald-500"
                  placeholder="Contoh: Dana masuk kas klub, pembayaran disahkan."
                />
              </div>

              {/* Info Notice */}
              <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-[11px] space-y-1 border border-slate-200">
                <p className="font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Penyimpanan Sisi Admin & Siswa:
                </p>
                <p>
                  Status iuran bulan <strong>{FULL_MONTH_NAMES[adminInputProofModal.bulan - 1]} {adminInputProofModal.tahun}</strong> akan otomatis menjadi <strong>LUNAS</strong>, bukti pembayaran tersimpan di admin, dan langsung ditampilkan di portal akun siswa sebagai bukti lunas.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdminInputProofModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Simpan Pembayaran & Bukti Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
