/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Student, 
  Coach,
  ClassGroup, 
  MonthlyDueRecord, 
  ClubEvent, 
  EventParticipant, 
  AttendanceSession, 
  PaymentTransaction, 
  PaymentSubmission,
  PaymentMethod,
  ClubProfile, 
  UserRole,
  StudentStatus 
} from './types/sportkit';
import {
  getStudents,
  saveStudents,
  getClasses,
  saveClasses,
  getCoaches,
  saveCoaches,
  getMonthlyDues,
  saveMonthlyDues,
  getEvents,
  saveEvents,
  getEventParticipants,
  saveEventParticipants,
  getAttendanceSessions,
  saveAttendanceSessions,
  getTransactions,
  saveTransactions,
  getClubProfile,
  saveClubProfile,
  getPaymentSubmissions,
  savePaymentSubmissions,
  generateReceiptNumber,
  registerPublic,
  portalLogin,
  portalSubmitPayment,
  setSyncErrorHandler,
  PortalCredentials,
} from './services/storage';
import { StaffUser } from './services/auth';
import { generateKodeAkses } from './utils/kodeAkses';
import { numberToWordsId } from './utils/numberToWordsId';
import { MONTH_NAMES, getCurrentYear, getCurrentMonth, getTodayISO, getCurrentTime } from './utils/constants';
import { useToast } from './components/Toast';
import { migrateCoachLinks, syncClassSnapshots, getCoachClasses } from './utils/coaches';

import { Header } from './components/Header';
import { Sidebar, ActiveNav } from './components/Sidebar';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';

import { DashboardView } from './views/DashboardView';
import { ProfilSiswaView } from './views/ProfilSiswaView';
import { IuranRutinView } from './views/IuranRutinView';
import { IuranInsidentilView } from './views/IuranInsidentilView';
import { CalonSiswaView } from './views/CalonSiswaView';
import { PendaftaranView } from './views/PendaftaranView';
import { SesiAbsensiView } from './views/SesiAbsensiView';
import { LaporanAbsensiView } from './views/LaporanAbsensiView';
import { SiswaListView } from './views/SiswaListView';
import { PengaturanView } from './views/PengaturanView';
import { AngsuranLaporanView } from './views/AngsuranLaporanView';
import { KelasManagerView } from './views/KelasManagerView';
import { VerifikasiPembayaranView } from './views/VerifikasiPembayaranView';
import { StudentPortalView } from './views/StudentPortalView';
import { PelatihView } from './views/PelatihView';

// Map URL paths to ActiveNav keys
const PATH_TO_NAV: Record<string, ActiveNav> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/kelas': 'kelas',
  '/pelatih': 'pelatih',
  '/iuran-rutin': 'iuran-rutin',
  '/iuran-insidentil': 'iuran-insidentil',
  '/verifikasi-pembayaran': 'verifikasi-pembayaran',
  '/angsuran': 'angsuran',
  '/laporan-iuran': 'laporan-iuran',
  '/calon-siswa': 'calon-siswa',
  '/siswa-aktif': 'siswa-aktif',
  '/siswa-cuti': 'siswa-cuti',
  '/siswa-nonaktif': 'siswa-nonaktif',
  '/pendaftaran-baru': 'pendaftaran-baru',
  '/profil-siswa': 'profil-siswa',
  '/sesi-absensi': 'sesi-absensi',
  '/laporan-absensi': 'laporan-absensi',
  '/pengaturan': 'pengaturan',
};

const NAV_TO_PATH: Record<ActiveNav, string> = {
  'dashboard': '/dashboard',
  'kelas': '/kelas',
  'pelatih': '/pelatih',
  'iuran-rutin': '/iuran-rutin',
  'iuran-insidentil': '/iuran-insidentil',
  'verifikasi-pembayaran': '/verifikasi-pembayaran',
  'angsuran': '/angsuran',
  'laporan-iuran': '/laporan-iuran',
  'calon-siswa': '/calon-siswa',
  'siswa-aktif': '/siswa-aktif',
  'siswa-cuti': '/siswa-cuti',
  'siswa-nonaktif': '/siswa-nonaktif',
  'pendaftaran-baru': '/pendaftaran-baru',
  'profil-siswa': '/profil-siswa',
  'sesi-absensi': '/sesi-absensi',
  'laporan-absensi': '/laporan-absensi',
  'student-portal': '/student-portal',
  'pengaturan': '/pengaturan',
};

const EMPTY_PROFILE: ClubProfile = {
  namaKlub: '',
  cabangOlahraga: '',
  alamat: '',
  kota: '',
  noHp: '',
  email: '',
  noWhatsApp: '',
};

// Halaman yang boleh dibuka pelatih (selebihnya khusus admin).
const COACH_NAVS: ActiveNav[] = ['sesi-absensi', 'laporan-absensi'];

export type WorkspaceMode = 'staff' | 'public' | 'student';

interface WorkspaceProps {
  mode: WorkspaceMode;
  /** Wajib untuk mode 'staff'. */
  staff?: StaffUser;
  /** Wajib untuk mode 'student'. */
  portal?: PortalCredentials;
  onLogout: () => void;
}

export default function Workspace({ mode, staff, portal, onLogout }: WorkspaceProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, confirm } = useToast();

  // Global Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [monthlyDues, setMonthlyDues] = useState<MonthlyDueRecord[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [eventParticipants, setEventParticipants] = useState<EventParticipant[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [profile, setProfile] = useState<ClubProfile>(EMPTY_PROFILE);
  const hasLoadedRef = useRef(false);
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadError, setLoadError] = useState<string>('');

  // Peran ditentukan oleh login (bukan lagi saklar di UI).
  const currentRole: UserRole = mode === 'staff' ? staff?.role ?? 'admin' : mode;
  const actorName = staff?.nama || 'Admin';

  // Derive currentNav from URL (pelatih dibatasi ke halaman absensi)
  const urlNav: ActiveNav = PATH_TO_NAV[location.pathname] ?? 'dashboard';
  const currentNav: ActiveNav =
    currentRole === 'coach' && !COACH_NAVS.includes(urlNav) ? 'sesi-absensi' : urlNav;

  // Helper to navigate both state + URL
  const setCurrentNav = useCallback((nav: ActiveNav) => {
    navigate(NAV_TO_PATH[nav]);
  }, [navigate]);

  // Sidebar State
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState<boolean>(false);

  // Ensure default signature palette from photo 2 is always active
  useEffect(() => {
    try {
      localStorage.removeItem('sportkit_theme');
      document.documentElement.removeAttribute('data-theme');
    } catch (e) {
      // Ignore
    }
  }, []);

  // Selected Entities
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  // Modal States
  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    title: string;
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
    targetDueId?: string;
    targetParticipantId?: string;
    isApplicantApproval?: boolean;
    bulan?: number;
    tahun?: number;
  }>({
    isOpen: false,
    title: '',
    siswaNama: '',
    siswaId: '',
    kelasNama: '',
    nominalAwal: 0,
    tipe: 'Iuran Rutin',
    keterangan: '',
  });

  const [receiptModalTx, setReceiptModalTx] = useState<PaymentTransaction | null>(null);

  // Kegagalan menyimpan ke server: beri tahu pengguna lalu muat ulang agar tampilan kembali sesuai server.
  useEffect(() => {
    if (mode !== 'staff') return;
    setSyncErrorHandler((table, error) => {
      toast.error('Gagal menyimpan ke server', `${error.message} (${table}). Data dimuat ulang dari server.`);
      loadAllData();
    });
    return () => setSyncErrorHandler(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Initial Data Load
  useEffect(() => {
    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, staff?.id, portal?.hp, portal?.kode]);

  const loadAllData = async () => {
    try {
      if (mode === 'public') {
        // Halaman pendaftaran publik hanya butuh daftar kelas & profil klub.
        const [cls, prof] = await Promise.all([getClasses(), getClubProfile()]);
        setClasses(cls);
        setProfile(prof);
        setSelectedClassId((prev) => prev || cls[0]?.id || '');
      } else if (mode === 'student') {
        if (!portal) throw new Error('Sesi portal tidak ditemukan.');
        const bundle = await portalLogin(portal);
        if (!bundle) throw new Error('Nomor HP atau kode akses tidak lagi valid.');
        setStudents([bundle.student]);
        setClasses(bundle.classes);
        setMonthlyDues(bundle.monthlyDues);
        setAttendanceSessions(bundle.attendanceSessions);
        setTransactions(bundle.transactions);
        setSubmissions(bundle.submissions);
        setProfile(bundle.profile);
        setSelectedStudentId(bundle.student.id);
      } else {
        const isAdmin = staff?.role === 'admin';
        // Pelatih hanya diizinkan membaca data dasar (lihat RLS); tabel keuangan tidak dimuat.
        const [stds, coachs, loadedClasses, loadedSessions, prof] = await Promise.all([
          getStudents(),
          getCoaches(),
          getClasses(),
          getAttendanceSessions(),
          getClubProfile(),
        ]);
        let cls = loadedClasses;
        let atts = loadedSessions;
        if (isAdmin) {
          const migrated = migrateCoachLinks(cls, atts, coachs);
          cls = migrated.classes;
          atts = migrated.sessions;
          if (migrated.changed) {
            saveClasses(cls);
            saveAttendanceSessions(atts);
          }
        }
        const [dues, evts, parts, txs, subs] = isAdmin
          ? await Promise.all([
              getMonthlyDues(),
              getEvents(),
              getEventParticipants(),
              getTransactions(),
              getPaymentSubmissions(),
            ])
          : [[], [], [], [], []];

        setStudents(stds);
        setCoaches(coachs);
        setClasses(cls);
        setMonthlyDues(dues as MonthlyDueRecord[]);
        setEvents(evts as ClubEvent[]);
        setEventParticipants(parts as EventParticipant[]);
        setAttendanceSessions(atts);
        setTransactions(txs as PaymentTransaction[]);
        setProfile(prof);
        setSubmissions(subs as PaymentSubmission[]);

        setSelectedStudentId((prev) => prev || stds[0]?.id || '');
        setSelectedClassId((prev) => prev || cls[0]?.id || '');
      }
      hasLoadedRef.current = true;
      setDataStatus('ready');
    } catch (e) {
      const message = (e as Error).message;
      if (hasLoadedRef.current) {
        // Muat ulang gagal setelah tampilan sudah terisi: pertahankan tampilan, beri tahu pengguna.
        toast.error('Gagal memuat data', message);
      } else {
        setLoadError(message);
        setDataStatus('error');
      }
    }
  };

  // Navigations from Cards
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setCurrentNav('profil-siswa');
  };

  const handleSelectClassIuran = (classId: string) => {
    setSelectedClassId(classId);
    setCurrentNav('iuran-rutin');
  };

  const handleSelectEventIuran = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentNav('iuran-insidentil');
  };

  // Open Payment for Monthly Due (from Profile or Class Matrix)
  const handleOpenMonthlyPaymentModal = (
    due: MonthlyDueRecord,
    student: Student,
    classGroup: ClassGroup
  ) => {

    setPaymentModalState({
      isOpen: true,
      title: 'Pembayaran Iuran Rutin',
      siswaNama: student.nama,
      siswaId: student.id,
      kelasId: classGroup.id,
      kelasNama: classGroup.nama,
      noHp: student.noHp,
      nominalAwal: due.nominal - (due.terbayar || 0),
      tipe: 'Iuran Rutin',
      keterangan: `Iuran Rutin ${MONTH_NAMES[due.bulan - 1]} ${due.tahun}`,
      periodeInfo: `${MONTH_NAMES[due.bulan - 1]} ${due.tahun}`,
      targetDueId: due.id,
      bulan: due.bulan,
      tahun: due.tahun,
    });
  };

  // Open Payment for Event (from Incident view)
  const handleOpenEventPaymentModal = (
    event: ClubEvent,
    participant: EventParticipant,
    student: Student,
    classGroup: ClassGroup
  ) => {
    setPaymentModalState({
      isOpen: true,
      title: 'Pembayaran Iuran Insidentil',
      siswaNama: student.nama,
      siswaId: student.id,
      kelasNama: classGroup.nama,
      noHp: student.noHp,
      nominalAwal: participant.nominal - (participant.terbayar || 0),
      tipe: 'Iuran Insidentil',
      keterangan: `Keikutsertaan ${event.nama}`,
      targetParticipantId: participant.id,
    });
  };

  // Open Payment for Calon Siswa (Registration payment)
  const handleOpenApplicantPaymentModal = (student: Student, classGroup: ClassGroup) => {
    setPaymentModalState({
      isOpen: true,
      title: 'Pembayaran Iuran Rutin',
      siswaNama: student.nama,
      siswaId: student.id,
      kelasNama: classGroup.nama,
      noHp: student.noHp,
      nominalAwal: student.totalBiayaPendaftaran,
      biayaPendaftaran: student.biayaPendaftaran,
      iuranBulanan: student.iuranBulanan,
      tipe: 'Pendaftaran Siswa Baru',
      keterangan: 'Pendaftaran Siswa Baru & Iuran Perdana',
      isApplicantApproval: true,
    });
  };

  // On Successful Payment Submission in Modal
  const handlePaymentSuccess = (
    tx: PaymentTransaction,
    proofData?: {
      buktiGambarUrl?: string;
      pesanPembayaran?: string;
      catatanAdmin?: string;
      bulan?: number;
      tahun?: number;
    }
  ) => {
    const today = getTodayISO();
    const time = getCurrentTime();

    // 1. Save Transaction
    const updatedTxs = [tx, ...transactions];
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    // 2. If it was Monthly Due (or Iuran Rutin)
    const targetBulan = proofData?.bulan || paymentModalState.bulan;
    const targetTahun = proofData?.tahun || paymentModalState.tahun || getCurrentYear();

    if (paymentModalState.targetDueId || paymentModalState.tipe === 'Iuran Rutin' || targetBulan) {
      let found = false;
      const updatedDues = monthlyDues.map((d) => {
        if (
          (paymentModalState.targetDueId && d.id === paymentModalState.targetDueId) ||
          (d.siswaId === tx.siswaId && d.bulan === targetBulan && d.tahun === targetTahun)
        ) {
          found = true;
          return {
            ...d,
            status: 'lunas' as const,
            nominal: tx.nominal,
            terbayar: tx.nominal,
            tanggalBayar: tx.tanggal || today,
            kuitansiId: tx.nomorKuitansi,
          };
        }
        return d;
      });

      if (!found && targetBulan) {
        const newDue: MonthlyDueRecord = {
          id: `due-${tx.siswaId}-${targetTahun}-${targetBulan}`,
          siswaId: tx.siswaId,
          bulan: targetBulan,
          tahun: targetTahun,
          nominal: tx.nominal,
          terbayar: tx.nominal,
          status: 'lunas',
          tanggalBayar: tx.tanggal || today,
          kuitansiId: tx.nomorKuitansi,
        };
        updatedDues.push(newDue);
      }

      setMonthlyDues(updatedDues);
      saveMonthlyDues(updatedDues);

      // Create & Save verified submission proof record
      const studentClass = classes.find((c) => c.nama === tx.kelasNama || c.id === paymentModalState.kelasId);
      const subId = `sub-${Date.now()}`;
      const newSub: PaymentSubmission = {
        id: subId,
        siswaId: tx.siswaId,
        siswaNama: tx.siswaNama,
        kelasId: studentClass?.id || paymentModalState.kelasId || classes[0]?.id || '',
        kelasNama: tx.kelasNama,
        tipe: 'Iuran Rutin',
        bulan: targetBulan,
        tahun: targetTahun,
        nominal: tx.nominal,
        metodePembayaran: tx.metodePembayaran,
        tanggalTransfer: tx.tanggal || today,
        buktiGambarUrl: proofData?.buktiGambarUrl || '',
        pesanSiswa: proofData?.pesanPembayaran || tx.keterangan,
        status: 'verified',
        tanggalKirim: `${today} ${time}`,
        tanggalVerifikasi: today,
        diverifikasiOleh: actorName,
        catatanAdmin: proofData?.catatanAdmin || 'Diinput & diverifikasi langsung oleh Admin.',
        kuitansiId: tx.nomorKuitansi,
        transactionId: tx.id,
      };

      const updatedSubs = [newSub, ...submissions];
      setSubmissions(updatedSubs);
      savePaymentSubmissions(updatedSubs);
    }

    // 3. If it was Event Participant
    if (paymentModalState.targetParticipantId) {
      const updatedParts = eventParticipants.map((p) => {
        if (p.id === paymentModalState.targetParticipantId) {
          return {
            ...p,
            status: 'lunas' as const,
            terbayar: p.nominal,
            tanggalBayar: tx.tanggal,
            kuitansiId: tx.nomorKuitansi,
          };
        }
        return p;
      });
      setEventParticipants(updatedParts);
      saveEventParticipants(updatedParts);

      // Update event lunas count
      const part = eventParticipants.find((p) => p.id === paymentModalState.targetParticipantId);
      if (part) {
        const updatedEvents = events.map((e) => {
          if (e.id === part.eventId) {
            return { ...e, pesertaLunas: e.pesertaLunas + 1 };
          }
          return e;
        });
        setEvents(updatedEvents);
        saveEvents(updatedEvents);
      }
    }

    // 4. If it was Applicant approval
    if (paymentModalState.isApplicantApproval) {
      const updatedStudents = students.map((s) => {
        if (s.id === tx.siswaId) {
          return { ...s, status: 'Aktif' as StudentStatus };
        }
        return s;
      });
      setStudents(updatedStudents);
      saveStudents(updatedStudents);

      // Also ensure student has monthly dues initialized for the current month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const newDue: MonthlyDueRecord = {
        id: `due-${tx.siswaId}-${currentYear}-${currentMonth}`,
        siswaId: tx.siswaId,
        tahun: currentYear,
        bulan: currentMonth,
        status: 'lunas',
        nominal: 100000,
        terbayar: 100000,
        tanggalBayar: tx.tanggal,
        kuitansiId: tx.nomorKuitansi,
      };
      const updatedDues = [...monthlyDues, newDue];
      setMonthlyDues(updatedDues);
      saveMonthlyDues(updatedDues);
    }
  };

  // Add new student from form
  const handleRegisterSubmit = async (newStudent: Student, autoPayDirectly: boolean): Promise<boolean> => {
    // Pendaftar publik tidak login: kirim lewat fungsi database yang memaksa status "Calon"
    // dan menghitung biaya dari kelas (bukan dari input).
    if (currentRole === 'public') {
      try {
        await registerPublic(newStudent);
        return true;
      } catch (e) {
        toast.error('Pendaftaran gagal', (e as Error).message);
        return false;
      }
    }

    const student: Student = { ...newStudent, kodeAkses: newStudent.kodeAkses || generateKodeAkses() };
    const updated = [student, ...students];
    setStudents(updated);
    saveStudents(updated);

    if (autoPayDirectly) {
      const cls = classes.find((c) => c.id === student.kelasId) || classes[0];
      handleOpenApplicantPaymentModal(student, cls);
    } else {
      setCurrentNav('calon-siswa');
    }
    return true;
  };

  // Add Attendance Session
  const handleAddSession = (newSession: AttendanceSession) => {
    const updated = [newSession, ...attendanceSessions];
    setAttendanceSessions(updated);
    saveAttendanceSessions(updated);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = attendanceSessions.filter((s) => s.id !== sessionId);
    setAttendanceSessions(updated);
    saveAttendanceSessions(updated);
  };

  // Update student biodata
  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    saveStudents(updated);
  };

  // Class Management Handlers
  const handleAddClass = (newClass: ClassGroup) => {
    const updated = [...classes, newClass];
    setClasses(updated);
    saveClasses(updated);
  };

  const handleUpdateClass = (updatedClass: ClassGroup) => {
    const updated = classes.map((c) => (c.id === updatedClass.id ? updatedClass : c));
    setClasses(updated);
    saveClasses(updated);
  };

  const handleDeleteClass = (classId: string, reassignClassId?: string) => {
    let updatedStudents = [...students];
    if (reassignClassId) {
      updatedStudents = updatedStudents.map((s) =>
        s.kelasId === classId ? { ...s, kelasId: reassignClassId } : s
      );
    } else {
      updatedStudents = updatedStudents.filter((s) => s.kelasId !== classId);
    }
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    const updatedClasses = classes.filter((c) => c.id !== classId);
    setClasses(updatedClasses);
    saveClasses(updatedClasses);

    if (selectedClassId === classId) {
      setSelectedClassId(reassignClassId || (updatedClasses.length > 0 ? updatedClasses[0].id : ''));
    }
  };

  // Delete single applicant
  const handleDeleteApplicant = (studentId: string) => {
    const updatedStudents = students.filter((s) => s.id !== studentId);
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    const updatedDues = monthlyDues.filter((d) => d.siswaId !== studentId);
    setMonthlyDues(updatedDues);
    saveMonthlyDues(updatedDues);

    const updatedParticipants = eventParticipants.filter((p) => p.siswaId !== studentId);
    setEventParticipants(updatedParticipants);
    saveEventParticipants(updatedParticipants);
  };

  // Delete multiple applicants (bulk)
  const handleDeleteBulkApplicants = (studentIds: string[]) => {
    const idSet = new Set(studentIds);
    const updatedStudents = students.filter((s) => !idSet.has(s.id));
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    const updatedDues = monthlyDues.filter((d) => !idSet.has(d.siswaId));
    setMonthlyDues(updatedDues);
    saveMonthlyDues(updatedDues);

    const updatedParticipants = eventParticipants.filter((p) => !idSet.has(p.siswaId));
    setEventParticipants(updatedParticipants);
    saveEventParticipants(updatedParticipants);
  };

  const handleUpdateStudentStatus = (studentId: string, newStatus: StudentStatus) => {
    const updated = students.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s));
    setStudents(updated);
    saveStudents(updated);
  };

  // Coach CRUD Handlers
  const handleAddCoach = (newCoach: Coach) => {
    const updated = [...coaches, newCoach];
    setCoaches(updated);
    saveCoaches(updated);
    toast.success('Pelatih ditambahkan', `${newCoach.nama} berhasil didaftarkan ke sistem.`);
  };

  const handleUpdateCoach = (updatedCoach: Coach) => {
    const updated = coaches.map((c) => (c.id === updatedCoach.id ? updatedCoach : c));
    setCoaches(updated);
    saveCoaches(updated);
    const syncedClasses = syncClassSnapshots(classes, updated);
    setClasses(syncedClasses);
    saveClasses(syncedClasses);
    toast.success('Data pelatih diperbarui', `${updatedCoach.nama} berhasil disimpan.`);
  };

  const handleDeleteCoach = async (coachId: string) => {
    const coach = coaches.find((c) => c.id === coachId);
    const affected = getCoachClasses(coachId, classes);
    const ok = await confirm(
      'Hapus Data Pelatih?',
      affected.length > 0
        ? `${coach?.nama || 'Pelatih ini'} akan dihapus dan dilepas dari kelas: ${affected.map((c) => c.nama).join(', ')}. Kelas tersebut akan berstatus "Belum ada pelatih" sampai Anda menetapkan pelatih baru.`
        : `Data ${coach?.nama || 'pelatih ini'} akan dihapus dari sistem.`
    );
    if (ok) {
      const updated = coaches.filter((c) => c.id !== coachId);
      setCoaches(updated);
      saveCoaches(updated);
      if (affected.length > 0) {
        const syncedClasses = syncClassSnapshots(classes, updated);
        setClasses(syncedClasses);
        saveClasses(syncedClasses);
      }
      toast.success('Pelatih dihapus', `${coach?.nama} telah dihapus dari sistem.`);
    }
  };

  // Submit payment proof from student account (portal): dikirim lewat fungsi database
  const handleSubmitPaymentProof = async (
    newSub: Omit<PaymentSubmission, 'id' | 'status' | 'tanggalKirim'>
  ) => {
    if (!portal) throw new Error('Sesi portal tidak ditemukan. Silakan masuk kembali.');
    await portalSubmitPayment(portal, {
      bulan: newSub.bulan,
      tahun: newSub.tahun,
      nominal: newSub.nominal,
      metodePembayaran: newSub.metodePembayaran,
      tanggalTransfer: newSub.tanggalTransfer,
      pesanSiswa: newSub.pesanSiswa,
      buktiGambarUrl: newSub.buktiGambarUrl,
    });
    await loadAllData();
  };

  // Verify payment submission by admin
  const handleVerifySubmission = (submissionId: string, catatanAdmin: string) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    const receiptNo = generateReceiptNumber();
    const txId = `tx-${Date.now()}`;
    const now = new Date();
    const today = getTodayISO();

    const periodLabel = sub.bulan && sub.tahun 
      ? `Iuran Rutin ${MONTH_NAMES[sub.bulan - 1]} ${sub.tahun}`
      : sub.tipe;

    // Create official transaction
    const newTx: PaymentTransaction = {
      id: txId,
      nomorKuitansi: receiptNo,
      siswaId: sub.siswaId,
      siswaNama: sub.siswaNama,
      kelasNama: sub.kelasNama,
      tanggal: today,
      nominal: sub.nominal,
      terbilang: numberToWordsId(sub.nominal),
      metodePembayaran: sub.metodePembayaran,
      tipe: 'Iuran Rutin',
      keterangan: `${periodLabel} (Verifikasi Bukti Transfer Siswa)`,
      catatan: catatanAdmin,
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    // Update monthly due record if it is a monthly due
    if (sub.bulan && sub.tahun) {
      let found = false;
      const updatedDues = monthlyDues.map((d) => {
        if (d.siswaId === sub.siswaId && d.bulan === sub.bulan && d.tahun === sub.tahun) {
          found = true;
          return {
            ...d,
            status: 'lunas' as const,
            terbayar: sub.nominal,
            tanggalBayar: sub.tanggalTransfer || today,
            kuitansiId: receiptNo,
          };
        }
        return d;
      });

      if (!found) {
        const newDue: MonthlyDueRecord = {
          id: `due-${sub.siswaId}-${sub.tahun}-${sub.bulan}`,
          siswaId: sub.siswaId,
          bulan: sub.bulan,
          tahun: sub.tahun,
          nominal: sub.nominal,
          terbayar: sub.nominal,
          status: 'lunas',
          tanggalBayar: sub.tanggalTransfer || today,
          kuitansiId: receiptNo,
        };
        updatedDues.push(newDue);
      }

      setMonthlyDues(updatedDues);
      saveMonthlyDues(updatedDues);
    }

    // Update submission record
    const updatedSubs = submissions.map((s) => {
      if (s.id === submissionId) {
        return {
          ...s,
          status: 'verified' as const,
          tanggalVerifikasi: today,
          diverifikasiOleh: actorName,
          catatanAdmin: catatanAdmin,
          kuitansiId: receiptNo,
          transactionId: txId,
        };
      }
      return s;
    });

    setSubmissions(updatedSubs);
    savePaymentSubmissions(updatedSubs);

    // Show instant receipt confirmation
    setReceiptModalTx(newTx);
  };

  // Reject payment submission by admin
  const handleRejectSubmission = (submissionId: string, alasan: string) => {
    const today = getTodayISO();
    const updatedSubs = submissions.map((s) => {
      if (s.id === submissionId) {
        return {
          ...s,
          status: 'rejected' as const,
          catatanAdmin: alasan,
          tanggalVerifikasi: today,
        };
      }
      return s;
    });

    setSubmissions(updatedSubs);
    savePaymentSubmissions(updatedSubs);
  };

  // Admin directly records payment with uploaded proof & message
  const handleAdminRecordPaymentWithProof = ({
    siswaId,
    siswaNama,
    kelasId,
    kelasNama,
    bulan,
    tahun,
    nominal,
    metodePembayaran,
    tanggalTransfer,
    buktiGambarUrl,
    pesanPembayaran,
    catatanAdmin,
  }: {
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
  }) => {
    const receiptNo = generateReceiptNumber();
    const txId = `tx-${Date.now()}`;
    const now = new Date();
    const today = getTodayISO();
    const time = getCurrentTime();

    const periodLabel = `Iuran Rutin ${MONTH_NAMES[bulan - 1]} ${tahun}`;

    // 1. Transaction
    const newTx: PaymentTransaction = {
      id: txId,
      nomorKuitansi: receiptNo,
      siswaId,
      siswaNama,
      kelasNama,
      tanggal: tanggalTransfer || today,
      nominal,
      terbilang: numberToWordsId(nominal),
      metodePembayaran,
      tipe: 'Iuran Rutin',
      keterangan: `${periodLabel} (Diinput oleh Admin)`,
      catatan: catatanAdmin || pesanPembayaran || 'Pembayaran dicatat & disahkan Admin.',
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    // 2. Update or Create Monthly Due
    let found = false;
    const updatedDues = monthlyDues.map((d) => {
      if (d.siswaId === siswaId && d.bulan === bulan && d.tahun === tahun) {
        found = true;
        return {
          ...d,
          status: 'lunas' as const,
          nominal: nominal,
          terbayar: nominal,
          tanggalBayar: tanggalTransfer || today,
          kuitansiId: receiptNo,
        };
      }
      return d;
    });

    if (!found) {
      const newDue: MonthlyDueRecord = {
        id: `due-${siswaId}-${tahun}-${bulan}`,
        siswaId,
        bulan,
        tahun,
        nominal,
        terbayar: nominal,
        status: 'lunas',
        tanggalBayar: tanggalTransfer || today,
        kuitansiId: receiptNo,
      };
      updatedDues.push(newDue);
    }
    setMonthlyDues(updatedDues);
    saveMonthlyDues(updatedDues);

    // 3. Create Submission record (status: 'verified')
    const subId = `sub-${Date.now()}`;
    const newSub: PaymentSubmission = {
      id: subId,
      siswaId,
      siswaNama,
      kelasId,
      kelasNama,
      tipe: 'Iuran Rutin',
      bulan,
      tahun,
      nominal,
      metodePembayaran,
      tanggalTransfer: tanggalTransfer || today,
      buktiGambarUrl: buktiGambarUrl || '',
      pesanSiswa: pesanPembayaran || `Pembayaran iuran ${MONTH_NAMES[bulan - 1]} ${tahun}`,
      status: 'verified',
      tanggalKirim: `${today} ${time}`,
      tanggalVerifikasi: today,
      diverifikasiOleh: actorName,
      catatanAdmin: catatanAdmin || 'Pembayaran diinput & diverifikasi langsung oleh Admin.',
      kuitansiId: receiptNo,
      transactionId: txId,
    };

    const updatedSubs = [newSub, ...submissions];
    setSubmissions(updatedSubs);
    savePaymentSubmissions(updatedSubs);

    // 4. Pop up official receipt
    setReceiptModalTx(newTx);
  };

  // Count pending calon siswa
  const calonCount = students.filter((s) => s.status === 'Calon').length;

  // Count pending submissions
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'pending').length;

  // Active student for student portal
  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // View Receipt Handler
  const handleViewReceipt = (tx: PaymentTransaction) => {
    setReceiptModalTx(tx);
  };

  if (dataStatus !== 'ready') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 px-6 text-center font-sans">
        {dataStatus === 'loading' ? (
          <>
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-slate-600">Memuat data…</p>
          </>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-800">Data tidak dapat dimuat</p>
            <p className="text-xs text-slate-500 max-w-sm">{loadError}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDataStatus('loading');
                  loadAllData();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                Coba lagi
              </button>
              {mode !== 'public' && (
                <button onClick={onLogout} className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer">
                  Keluar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        userName={mode === 'student' ? activeStudent?.nama : staff?.nama}
        onLogout={mode === 'public' ? undefined : onLogout}
        clubProfile={profile}
        calonCount={calonCount}
        pendingVerificationsCount={pendingSubmissionsCount}
        onToggleSidebar={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        onNavigateCalon={() => setCurrentNav('calon-siswa')}
        onNavigateVerifikasi={() => setCurrentNav('verifikasi-pembayaran')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation (hanya untuk pengurus) */}
        {mode === 'staff' && (
          <Sidebar
            currentNav={currentNav}
            onSelectNav={setCurrentNav}
            calonCount={calonCount}
            pendingVerificationsCount={pendingSubmissionsCount}
            currentRole={currentRole}
            supportPhone={profile.noWhatsApp || profile.noHp}
            isOpenMobile={sidebarMobileOpen}
            onCloseMobile={() => setSidebarMobileOpen(false)}
          />
        )}

        {/* Main Workspace Body */}
        <main
          className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-all ${
            mode === 'staff' ? 'lg:ml-64' : mode === 'student' ? 'max-w-6xl mx-auto w-full' : 'max-w-5xl mx-auto w-full'
          }`}
        >
          {/* VIEW SWITCHER */}
          {currentRole === 'public' ? (
            <PendaftaranView
              classes={classes}
              isPublicMode={true}
              onRegisterSubmit={handleRegisterSubmit}
            />
          ) : mode === 'student' ? (
            activeStudent ? (
              <StudentPortalView
                currentStudent={activeStudent}
                students={students}
                classes={classes}
                monthlyDues={monthlyDues}
                attendanceSessions={attendanceSessions}
                transactions={transactions}
                submissions={submissions}
                clubProfile={profile}
                onSelectStudent={(id) => setSelectedStudentId(id)}
                onSubmitPaymentProof={handleSubmitPaymentProof}
                onViewReceipt={handleViewReceipt}
              />
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <p className="text-sm font-bold text-slate-700">Data siswa tidak ditemukan.</p>
              </div>
            )
          ) : (
            <>
              {currentNav === 'dashboard' && (
                <DashboardView
                  students={students}
                  classes={classes}
                  coaches={coaches}
                  events={events}
                  transactions={transactions}
                  pendingSubmissionsCount={pendingSubmissionsCount}
                  onNavigateVerifikasi={() => setCurrentNav('verifikasi-pembayaran')}
                  onSelectStudent={handleSelectStudent}
                  onSelectClassIuran={handleSelectClassIuran}
                  onSelectEventIuran={handleSelectEventIuran}
                  onNavigateNewRegistration={() => setCurrentNav('pendaftaran-baru')}
                  onNavigateCalonSiswa={() => setCurrentNav('calon-siswa')}
                  onNavigateKelas={() => setCurrentNav('kelas')}
                  onNavigatePelatih={() => setCurrentNav('pelatih')}
                  onViewReceipt={handleViewReceipt}
                />
              )}

              {currentNav === 'verifikasi-pembayaran' && (
                <VerifikasiPembayaranView
                  submissions={submissions}
                  students={students}
                  classes={classes}
                  monthlyDues={monthlyDues}
                  onVerifySubmission={handleVerifySubmission}
                  onRejectSubmission={handleRejectSubmission}
                  onViewReceipt={handleViewReceipt}
                  transactions={transactions}
                />
              )}

              {currentNav === 'kelas' && (
                <KelasManagerView
                  classes={classes}
                  students={students}
                  coaches={coaches}
                  onAddClass={handleAddClass}
                  onUpdateClass={handleUpdateClass}
                  onDeleteClass={handleDeleteClass}
                  onNavigateNewRegistration={(classId) => {
                    if (classId) setSelectedClassId(classId);
                    setCurrentNav('pendaftaran-baru');
                  }}
                />
              )}

              {currentNav === 'pelatih' && (
                <PelatihView
                  coaches={coaches}
                  classes={classes}
                  students={students}
                  onAddCoach={handleAddCoach}
                  onUpdateCoach={handleUpdateCoach}
                  onDeleteCoach={handleDeleteCoach}
                />
              )}

              {currentNav === 'profil-siswa' && (
                <ProfilSiswaView
                  students={students}
                  classes={classes}
                  monthlyDues={monthlyDues}
                  events={events}
                  eventParticipants={eventParticipants}
                  attendanceSessions={attendanceSessions}
                  selectedStudentId={selectedStudentId}
                  submissions={submissions}
                  transactions={transactions}
                  onSelectStudent={setSelectedStudentId}
                  onOpenPaymentModal={handleOpenMonthlyPaymentModal}
                  onOpenEventPaymentModal={handleOpenEventPaymentModal}
                  onUpdateStudent={handleUpdateStudent}
                  onVerifySubmission={handleVerifySubmission}
                  onRejectSubmission={handleRejectSubmission}
                  onViewReceipt={handleViewReceipt}
                  onAdminRecordPaymentWithProof={handleAdminRecordPaymentWithProof}
                />
              )}

              {currentNav === 'iuran-rutin' && (
                <IuranRutinView
                  students={students}
                  classes={classes}
                  monthlyDues={monthlyDues}
                  submissions={submissions}
                  initialClassId={selectedClassId}
                  onOpenPaymentModal={handleOpenMonthlyPaymentModal}
                  onSelectStudent={handleSelectStudent}
                />
              )}

              {currentNav === 'iuran-insidentil' && (
                <IuranInsidentilView
                  events={events}
                  eventParticipants={eventParticipants}
                  students={students}
                  classes={classes}
                  initialEventId={selectedEventId}
                  onOpenEventPaymentModal={handleOpenEventPaymentModal}
                  onAddNewEvent={(evt) => {
                    const up = [evt, ...events];
                    setEvents(up);
                    saveEvents(up);
                  }}
                />
              )}

              {currentNav === 'calon-siswa' && (
                <CalonSiswaView
                  students={students}
                  classes={classes}
                  onOpenApplicantPaymentModal={handleOpenApplicantPaymentModal}
                  onNavigateNewRegistration={() => setCurrentNav('pendaftaran-baru')}
                  onDeleteApplicant={handleDeleteApplicant}
                  onDeleteBulkApplicants={handleDeleteBulkApplicants}
                />
              )}

              {currentNav === 'pendaftaran-baru' && (
                <PendaftaranView
                  classes={classes}
                  isPublicMode={false}
                  initialClassId={selectedClassId}
                  onRegisterSubmit={handleRegisterSubmit}
                  onCancel={() => setCurrentNav('dashboard')}
                  onNavigateKelas={() => setCurrentNav('kelas')}
                />
              )}

              {currentNav === 'sesi-absensi' && (
                <SesiAbsensiView
                  sessions={attendanceSessions}
                  students={students}
                  classes={classes}
                  coaches={coaches}
                  onAddSession={handleAddSession}
                  onDeleteSession={handleDeleteSession}
                />
              )}

              {currentNav === 'laporan-absensi' && (
                <LaporanAbsensiView
                  sessions={attendanceSessions}
                  students={students}
                  classes={classes}
                />
              )}

              {currentNav === 'siswa-aktif' && (
                <SiswaListView
                  status="Aktif"
                  students={students}
                  classes={classes}
                  onSelectStudent={handleSelectStudent}
                  onNavigateNewRegistration={() => setCurrentNav('pendaftaran-baru')}
                  onUpdateStatus={handleUpdateStudentStatus}
                />
              )}

              {currentNav === 'siswa-cuti' && (
                <SiswaListView
                  status="Cuti"
                  students={students}
                  classes={classes}
                  onSelectStudent={handleSelectStudent}
                  onNavigateNewRegistration={() => setCurrentNav('pendaftaran-baru')}
                  onUpdateStatus={handleUpdateStudentStatus}
                />
              )}

              {currentNav === 'siswa-nonaktif' && (
                <SiswaListView
                  status="Nonaktif"
                  students={students}
                  classes={classes}
                  onSelectStudent={handleSelectStudent}
                  onNavigateNewRegistration={() => setCurrentNav('pendaftaran-baru')}
                  onUpdateStatus={handleUpdateStudentStatus}
                />
              )}

              {currentNav === 'angsuran' && (
                <AngsuranLaporanView
                  mode="angsuran"
                  students={students}
                  classes={classes}
                  monthlyDues={monthlyDues}
                  transactions={transactions}
                  onOpenPaymentModal={handleOpenMonthlyPaymentModal}
                  onViewReceipt={handleViewReceipt}
                />
              )}

              {currentNav === 'laporan-iuran' && (
                <AngsuranLaporanView
                  mode="laporan"
                  students={students}
                  classes={classes}
                  monthlyDues={monthlyDues}
                  transactions={transactions}
                  onOpenPaymentModal={handleOpenMonthlyPaymentModal}
                  onViewReceipt={handleViewReceipt}
                />
              )}

              {currentNav === 'pengaturan' && (
                <PengaturanView
                  profile={profile}
                  classes={classes}
                  onUpdateProfile={(p) => {
                    setProfile(p);
                    saveClubProfile(p);
                  }}
                  onUpdateClasses={(c) => {
                    setClasses(c);
                    saveClasses(c);
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Payment Processing Modal */}
      <PaymentModal
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState((prev) => ({ ...prev, isOpen: false }))}
        title={paymentModalState.title}
        siswaNama={paymentModalState.siswaNama}
        siswaId={paymentModalState.siswaId}
        kelasId={paymentModalState.kelasId}
        kelasNama={paymentModalState.kelasNama}
        noHp={paymentModalState.noHp}
        nominalAwal={paymentModalState.nominalAwal}
        tipe={paymentModalState.tipe}
        keterangan={paymentModalState.keterangan}
        biayaPendaftaran={paymentModalState.biayaPendaftaran}
        iuranBulanan={paymentModalState.iuranBulanan}
        periodeInfo={paymentModalState.periodeInfo}
        bulan={paymentModalState.bulan}
        tahun={paymentModalState.tahun}
        onSuccess={handlePaymentSuccess}
        onViewReceipt={(tx) => setReceiptModalTx(tx)}
      />

      {/* Official Receipt Modal (Print & Share WhatsApp) */}
      <ReceiptModal
        transaction={receiptModalTx}
        profile={profile}
        isOpen={!!receiptModalTx}
        onClose={() => setReceiptModalTx(null)}
      />
    </div>
  );
}
