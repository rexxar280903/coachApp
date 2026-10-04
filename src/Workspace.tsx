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
import {
  applyMonthlyPayment,
  applyEventPayment,
  findMonthlyDue,
  recountEvents,
  effectiveDueStatus,
  isNonBillable,
  freezeInactiveMonths,
  FEE_STATUS_LABEL,
  remainingMonthlyDue,
  describePaymentOutcome,
} from './utils/payments';

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

// Halaman yang boleh diakses tiap role (sidebar hanya menyembunyikan menu,
// guard ini mencegah akses langsung lewat URL).
const ROLE_ALLOWED_NAV: Record<UserRole, ActiveNav[] | 'all'> = {
  admin: 'all',
  coach: ['sesi-absensi', 'laporan-absensi'],
  student: ['student-portal'],
  public: ['pendaftaran-baru'],
};

const ROLE_HOME_NAV: Record<UserRole, ActiveNav> = {
  admin: 'dashboard',
  coach: 'sesi-absensi',
  student: 'student-portal',
  public: 'pendaftaran-baru',
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
  const allowedNavs = mode === 'staff' ? ROLE_ALLOWED_NAV[currentRole] : 'all';
  const currentNav: ActiveNav =
    allowedNavs !== 'all' && !allowedNavs.includes(urlNav) ? ROLE_HOME_NAV[currentRole] : urlNav;

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

  // Route guard (pengurus): alihkan ke halaman utama role bila URL tidak dikenal / tidak diizinkan.
  // Halaman publik (/daftar) dan portal (/portal) punya gerbangnya sendiri di App.tsx.
  useEffect(() => {
    if (mode !== 'staff') return;
    const allowed = ROLE_ALLOWED_NAV[currentRole];
    const isKnownPath = location.pathname in PATH_TO_NAV;
    if (!isKnownPath || (allowed !== 'all' && !allowed.includes(urlNav))) {
      navigate(NAV_TO_PATH[ROLE_HOME_NAV[currentRole]], { replace: true });
    }
  }, [mode, currentRole, urlNav, location.pathname, navigate]);

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
    dueNominal?: number;
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
      dueNominal: due.nominal,
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
      kelasId: classGroup.id,
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
    const feeDaftar = Number(classGroup?.biayaPendaftaran ?? student.biayaPendaftaran ?? 0);
    const feeIuran = Number(classGroup?.iuranBulanan ?? student.iuranBulanan ?? 0);
    const total = feeDaftar + feeIuran;
    setPaymentModalState({
      isOpen: true,
      title: 'Pembayaran Pendaftaran Siswa Baru',
      siswaNama: student.nama,
      siswaId: student.id,
      kelasId: classGroup.id,
      kelasNama: classGroup.nama,
      noHp: student.noHp,
      nominalAwal: total > 0 ? total : student.totalBiayaPendaftaran,
      biayaPendaftaran: feeDaftar,
      iuranBulanan: feeIuran,
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
    const tanggalBayar = tx.tanggal || today;
    const modal = paymentModalState;
    const student = students.find((s) => s.id === tx.siswaId);

    // 1. Save Transaction
    const updatedTxs = [tx, ...transactions];
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    // 2. Iuran Rutin → tagihan bulanan (pembayaran kumulatif / cicilan)
    if (tx.tipe === 'Iuran Rutin' || tx.tipe === 'Angsuran') {
      const bulan = proofData?.bulan ?? modal.bulan;
      const tahun = proofData?.tahun ?? modal.tahun;
      if (bulan && tahun) {
        const studentClass = classes.find((c) => c.id === (modal.kelasId || student?.kelasId));
        const samePeriod = modal.bulan === bulan && modal.tahun === tahun;
        const nominalTagihan =
          (samePeriod && modal.dueNominal) ||
          studentClass?.iuranBulanan ||
          student?.iuranBulanan ||
          tx.nominal;

        const updatedDues = applyMonthlyPayment(monthlyDues, {
          siswaId: tx.siswaId,
          bulan,
          tahun,
          nominalTagihan,
          jumlah: tx.nominal,
          tanggalBayar,
          kuitansiId: tx.nomorKuitansi,
        });
        setMonthlyDues(updatedDues);
        saveMonthlyDues(updatedDues);

        // Arsip bukti pembayaran (langsung terverifikasi karena diinput admin)
        const newSub: PaymentSubmission = {
          id: `sub-${Date.now()}`,
          siswaId: tx.siswaId,
          siswaNama: tx.siswaNama,
          kelasId: studentClass?.id || modal.kelasId || student?.kelasId || '',
          kelasNama: tx.kelasNama,
          tipe: 'Iuran Rutin',
          bulan,
          tahun,
          nominal: tx.nominal,
          metodePembayaran: tx.metodePembayaran,
          tanggalTransfer: tanggalBayar,
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
    }

    // 3. Iuran Insidentil → peserta event
    if (tx.tipe === 'Iuran Insidentil' && modal.targetParticipantId) {
      const part = eventParticipants.find((p) => p.id === modal.targetParticipantId);
      const updatedParts = applyEventPayment(
        eventParticipants,
        modal.targetParticipantId,
        tx.nominal,
        tanggalBayar,
        tx.nomorKuitansi
      );
      setEventParticipants(updatedParts);
      saveEventParticipants(updatedParts);

      if (part) {
        const updatedEvents = recountEvents(events, updatedParts, [part.eventId]);
        setEvents(updatedEvents);
        saveEvents(updatedEvents);
      }
    }

    // 4. Pendaftaran calon siswa → aktifkan siswa & catat iuran bulan pertama
    if (tx.tipe === 'Pendaftaran Siswa Baru' && modal.isApplicantApproval) {
      // Tanggal bergabung = tanggal aktif (iuran mulai dihitung dari bulan ini)
      const updatedStudents = students.map((s) =>
        s.id === tx.siswaId
          ? { ...s, status: 'Aktif' as StudentStatus, tanggalBergabung: tanggalBayar, tanggalStatus: tanggalBayar }
          : s
      );
      setStudents(updatedStudents);
      saveStudents(updatedStudents);

      const biayaDaftar = modal.biayaPendaftaran ?? student?.biayaPendaftaran ?? 0;
      const iuran = modal.iuranBulanan ?? student?.iuranBulanan ?? 0;
      const untukIuran = Math.min(Math.max(0, tx.nominal - biayaDaftar), iuran);
      if (iuran > 0 && untukIuran > 0) {
        const updatedDues = applyMonthlyPayment(monthlyDues, {
          siswaId: tx.siswaId,
          bulan: getCurrentMonth(),
          tahun: getCurrentYear(),
          nominalTagihan: iuran,
          jumlah: untukIuran,
          tanggalBayar,
          kuitansiId: tx.nomorKuitansi,
        });
        setMonthlyDues(updatedDues);
        saveMonthlyDues(updatedDues);
      }
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
      // Siswa tetap 'Calon' sampai pembayaran benar-benar dicatat di modal.
      const cls = classes.find((c) => c.id === student.kelasId) || classes[0];
      handleOpenApplicantPaymentModal(student, cls);
      toast.info('Menunggu pembayaran', `${student.nama} akan aktif setelah pembayaran pendaftaran dicatat.`);
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

  const handleUpdateSession = (updatedSession: AttendanceSession) => {
    const updated = attendanceSessions.map((s) => (s.id === updatedSession.id ? updatedSession : s));
    setAttendanceSessions(updated);
    saveAttendanceSessions(updated);
  };

  // Event participants
  const handleAddEventParticipants = (eventId: string, siswaIds: string[]) => {
    const event = events.find((e) => e.id === eventId);
    if (!event || siswaIds.length === 0) return;
    const existing = new Set(eventParticipants.filter((p) => p.eventId === eventId).map((p) => p.siswaId));
    const stamp = Date.now();
    const newParts: EventParticipant[] = siswaIds
      .filter((id) => !existing.has(id))
      .map((siswaId, i) => ({
        id: `ep-${stamp}-${i}`,
        eventId,
        siswaId,
        status: 'belum_bayar',
        nominal: event.nominal,
        terbayar: 0,
      }));
    if (newParts.length === 0) return;

    const updatedParts = [...eventParticipants, ...newParts];
    setEventParticipants(updatedParts);
    saveEventParticipants(updatedParts);
    const updatedEvents = recountEvents(events, updatedParts, [eventId]);
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
    toast.success('Peserta ditambahkan', `${newParts.length} siswa didaftarkan ke ${event.nama}.`);
  };

  const handleRemoveEventParticipant = async (participantId: string) => {
    const part = eventParticipants.find((p) => p.id === participantId);
    if (!part) return;
    if ((part.terbayar || 0) > 0) {
      toast.error('Tidak bisa dihapus', 'Peserta ini sudah melakukan pembayaran.');
      return;
    }
    const std = students.find((s) => s.id === part.siswaId);
    const ok = await confirm('Hapus Peserta?', `${std?.nama || 'Siswa ini'} akan dikeluarkan dari daftar peserta event.`);
    if (!ok) return;
    const updatedParts = eventParticipants.filter((p) => p.id !== participantId);
    setEventParticipants(updatedParts);
    saveEventParticipants(updatedParts);
    const updatedEvents = recountEvents(events, updatedParts, [part.eventId]);
    setEvents(updatedEvents);
    saveEvents(updatedEvents);
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

  // Tarif siswa mengikuti kelasnya. Biaya pendaftaran hanya relevan bagi calon siswa.
  const withClassFees = (s: Student, cls: ClassGroup): Student => {
    const feeDaftar = Number(cls.biayaPendaftaran ?? 0);
    const feeIuran = Number(cls.iuranBulanan ?? 0);
    return {
      ...s,
      iuranBulanan: feeIuran,
      ...(s.status === 'Calon'
        ? { biayaPendaftaran: feeDaftar, totalBiayaPendaftaran: feeDaftar + feeIuran }
        : {}),
    };
  };

  // Class Management Handlers
  const handleAddClass = (newClass: ClassGroup) => {
    const updated = [...classes, newClass];
    setClasses(updated);
    saveClasses(updated);
  };

  const handleUpdateClass = (updatedClass: ClassGroup) => {
    const old = classes.find((c) => c.id === updatedClass.id);
    const updated = classes.map((c) => (c.id === updatedClass.id ? updatedClass : c));
    setClasses(updated);
    saveClasses(updated);

    // Tarif berubah → samakan tarif siswa di kelas ini. Record iuran yang sudah ada tidak diubah.
    if (
      old &&
      (old.iuranBulanan !== updatedClass.iuranBulanan || old.biayaPendaftaran !== updatedClass.biayaPendaftaran)
    ) {
      const updatedStudents = students.map((s) =>
        s.kelasId === updatedClass.id ? withClassFees(s, updatedClass) : s
      );
      setStudents(updatedStudents);
      saveStudents(updatedStudents);
      toast.info(
        'Tarif kelas diperbarui',
        'Tarif baru berlaku untuk calon siswa dan tagihan berikutnya. Iuran yang sudah tercatat tidak berubah.'
      );
    }
  };

  const handleDeleteClass = (classId: string, reassignClassId?: string) => {
    const removedIds = new Set(
      reassignClassId ? [] : students.filter((s) => s.kelasId === classId).map((s) => s.id)
    );

    const targetClass = classes.find((c) => c.id === reassignClassId);
    const updatedStudents = reassignClassId
      ? students.map((s) =>
          s.kelasId === classId
            ? targetClass
              ? withClassFees({ ...s, kelasId: reassignClassId }, targetClass)
              : { ...s, kelasId: reassignClassId }
            : s
        )
      : students.filter((s) => !removedIds.has(s.id));
    setStudents(updatedStudents);
    saveStudents(updatedStudents);

    // Sesi absensi kelas ini ikut dipindah / dihapus agar tidak yatim
    const updatedSessions = reassignClassId
      ? attendanceSessions.map((a) => (a.kelasId === classId ? { ...a, kelasId: reassignClassId } : a))
      : attendanceSessions.filter((a) => a.kelasId !== classId);
    setAttendanceSessions(updatedSessions);
    saveAttendanceSessions(updatedSessions);

    if (removedIds.size > 0) {
      // Bersihkan data milik siswa yang ikut terhapus (transaksi tetap disimpan sebagai arsip keuangan)
      const updatedDues = monthlyDues.filter((d) => !removedIds.has(d.siswaId));
      setMonthlyDues(updatedDues);
      saveMonthlyDues(updatedDues);

      const updatedParts = eventParticipants.filter((p) => !removedIds.has(p.siswaId));
      setEventParticipants(updatedParts);
      saveEventParticipants(updatedParts);

      const touchedEvents = Array.from(
        new Set(eventParticipants.filter((p) => removedIds.has(p.siswaId)).map((p) => p.eventId))
      );
      const updatedEvents = recountEvents(events, updatedParts, touchedEvents);
      setEvents(updatedEvents);
      saveEvents(updatedEvents);

      const updatedSubs = submissions.filter((s) => !(removedIds.has(s.siswaId) && s.status === 'pending'));
      setSubmissions(updatedSubs);
      savePaymentSubmissions(updatedSubs);
    }

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
    const std = students.find((s) => s.id === studentId);
    if (!std || std.status === newStatus) return;
    const today = getTodayISO();

    // Keluar dari Cuti/Nonaktif: kunci bulan-bulan selama status itu agar tidak jadi tunggakan
    const updatedDues = freezeInactiveMonths(monthlyDues, std);
    if (updatedDues !== monthlyDues) {
      setMonthlyDues(updatedDues);
      saveMonthlyDues(updatedDues);
    }

    const updated = students.map((s) =>
      s.id === studentId ? { ...s, status: newStatus, tanggalStatus: today } : s
    );
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

  // Submit payment proof from student account (portal): dikirim lewat fungsi database.
  // Mengembalikan false (dan menampilkan pesan) bila pembayaran akan dobel / bulan tidak ditagih.
  const handleSubmitPaymentProof = async (
    newSub: Omit<PaymentSubmission, 'id' | 'status' | 'tanggalKirim'>
  ): Promise<boolean> => {
    if (!portal) throw new Error('Sesi portal tidak ditemukan. Silakan masuk kembali.');
    if (newSub.tipe === 'Iuran Rutin' && newSub.bulan && newSub.tahun) {
      const periode = `${MONTH_NAMES[newSub.bulan - 1]} ${newSub.tahun}`;
      const due = findMonthlyDue(monthlyDues, newSub.siswaId, newSub.bulan, newSub.tahun);
      if (due?.status === 'lunas') {
        toast.warning('Iuran sudah lunas', `Iuran ${periode} sudah tercatat lunas, tidak perlu mengirim bukti lagi.`);
        return false;
      }
      const std = students.find((s) => s.id === newSub.siswaId);
      const status = std ? effectiveDueStatus(std, due, newSub.bulan, newSub.tahun) : 'belum_bayar';
      if (isNonBillable(status)) {
        toast.warning('Bulan tidak ditagih', `Iuran ${periode} berstatus "${FEE_STATUS_LABEL[status]}", tidak perlu dibayar.`);
        return false;
      }
      const pendingSame = submissions.some(
        (s) =>
          s.status === 'pending' &&
          s.siswaId === newSub.siswaId &&
          s.tipe === 'Iuran Rutin' &&
          s.bulan === newSub.bulan &&
          s.tahun === newSub.tahun
      );
      if (pendingSame) {
        toast.warning('Bukti sudah dikirim', `Bukti pembayaran ${periode} masih menunggu verifikasi admin.`);
        return false;
      }
    }

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
    return true;
  };

  // Verify payment submission by admin
  const handleVerifySubmission = (submissionId: string, catatanAdmin: string) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub || sub.status !== 'pending') return;

    const student = students.find((s) => s.id === sub.siswaId);
    const isRutin = sub.tipe === 'Iuran Rutin' && !!sub.bulan && !!sub.tahun;

    // Cegah pembayaran ganda untuk bulan yang sudah lunas
    if (isRutin) {
      const due = findMonthlyDue(monthlyDues, sub.siswaId, sub.bulan!, sub.tahun!);
      if (due?.status === 'lunas') {
        toast.error(
          'Tagihan sudah lunas',
          `Iuran ${MONTH_NAMES[sub.bulan! - 1]} ${sub.tahun} untuk ${sub.siswaNama} sudah lunas. Tolak bukti ini jika merupakan pembayaran ganda.`
        );
        return;
      }
    }

    const receiptNo = generateReceiptNumber();
    const txId = `tx-${Date.now()}`;
    const today = getTodayISO();

    const txTipe: PaymentTransaction['tipe'] =
      sub.tipe === 'Pendaftaran' ? 'Pendaftaran Siswa Baru' : sub.tipe;
    const periodLabel = isRutin
      ? `Iuran Rutin ${MONTH_NAMES[sub.bulan! - 1]} ${sub.tahun}`
      : sub.tipe === 'Iuran Insidentil'
        ? `Iuran Insidentil${sub.eventNama ? ` ${sub.eventNama}` : ''}`
        : txTipe;

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
      tipe: txTipe,
      keterangan: `${periodLabel} (Verifikasi Bukti Transfer Siswa)`,
      catatan: catatanAdmin,
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    if (isRutin) {
      const cls = classes.find((c) => c.id === (student?.kelasId || sub.kelasId));
      const tarif = cls?.iuranBulanan || student?.iuranBulanan || sub.nominal;
      const outcome = describePaymentOutcome(
        sub.nominal,
        remainingMonthlyDue(monthlyDues, sub.siswaId, sub.bulan!, sub.tahun!, tarif)
      );
      if (outcome.kind === 'lebih') toast.warning('Kelebihan bayar', `${sub.siswaNama}: ${outcome.text}.`);
      if (outcome.kind === 'cicilan') toast.info('Dicatat sebagai cicilan', `${sub.siswaNama}: ${outcome.text}.`);
      const updatedDues = applyMonthlyPayment(monthlyDues, {
        siswaId: sub.siswaId,
        bulan: sub.bulan!,
        tahun: sub.tahun!,
        nominalTagihan: cls?.iuranBulanan || student?.iuranBulanan || sub.nominal,
        jumlah: sub.nominal,
        tanggalBayar: sub.tanggalTransfer || today,
        kuitansiId: receiptNo,
      });
      setMonthlyDues(updatedDues);
      saveMonthlyDues(updatedDues);
    }

    if (sub.tipe === 'Iuran Insidentil' && sub.eventId) {
      const part = eventParticipants.find((p) => p.eventId === sub.eventId && p.siswaId === sub.siswaId);
      if (part) {
        const updatedParts = applyEventPayment(
          eventParticipants,
          part.id,
          sub.nominal,
          sub.tanggalTransfer || today,
          receiptNo
        );
        setEventParticipants(updatedParts);
        saveEventParticipants(updatedParts);
        const updatedEvents = recountEvents(events, updatedParts, [part.eventId]);
        setEvents(updatedEvents);
        saveEvents(updatedEvents);
      }
    }

    if (sub.tipe === 'Pendaftaran' && student?.status === 'Calon') {
      const updatedStudents = students.map((s) =>
        s.id === sub.siswaId
          ? { ...s, status: 'Aktif' as StudentStatus, tanggalBergabung: today, tanggalStatus: today }
          : s
      );
      setStudents(updatedStudents);
      saveStudents(updatedStudents);
    }

    // Update submission record
    const updatedSubs = submissions.map((s) =>
      s.id === submissionId
        ? {
            ...s,
            status: 'verified' as const,
            tanggalVerifikasi: today,
            diverifikasiOleh: actorName,
            catatanAdmin: catatanAdmin,
            kuitansiId: receiptNo,
            transactionId: txId,
          }
        : s
    );
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
    const existingDue = findMonthlyDue(monthlyDues, siswaId, bulan, tahun);
    if (existingDue?.status === 'lunas') {
      toast.warning('Iuran sudah lunas', `Iuran ${MONTH_NAMES[bulan - 1]} ${tahun} untuk ${siswaNama} sudah lunas.`);
      return;
    }

    const receiptNo = generateReceiptNumber();
    const txId = `tx-${Date.now()}`;
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

    // 2. Update or Create Monthly Due (kumulatif, mendukung cicilan)
    const student = students.find((s) => s.id === siswaId);
    const cls = classes.find((c) => c.id === (student?.kelasId || kelasId));
    const outcome = describePaymentOutcome(
      nominal,
      remainingMonthlyDue(monthlyDues, siswaId, bulan, tahun, cls?.iuranBulanan || student?.iuranBulanan || nominal)
    );
    if (outcome.kind === 'lebih') toast.warning('Kelebihan bayar', `${siswaNama}: ${outcome.text}.`);
    if (outcome.kind === 'cicilan') toast.info('Dicatat sebagai cicilan', `${siswaNama}: ${outcome.text}.`);
    const updatedDues = applyMonthlyPayment(monthlyDues, {
      siswaId,
      bulan,
      tahun,
      nominalTagihan: existingDue?.nominal || cls?.iuranBulanan || student?.iuranBulanan || nominal,
      jumlah: nominal,
      tanggalBayar: tanggalTransfer || today,
      kuitansiId: receiptNo,
    });
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
  const activeStudent =
    students.find((s) => s.id === selectedStudentId) ||
    students.find((s) => s.status !== 'Calon') ||
    students[0];

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
                  onAddParticipants={handleAddEventParticipants}
                  onRemoveParticipant={handleRemoveEventParticipant}
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
                  onUpdateSession={handleUpdateSession}
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
