/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Student, 
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
  clearDatabaseToZero,
  resetToSeedData,
  SAMPLE_TRANSFER_PROOF_SVG,
} from './services/storage';
import { numberToWordsId } from './utils/numberToWordsId';

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

export default function App() {
  // Global Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [monthlyDues, setMonthlyDues] = useState<MonthlyDueRecord[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [eventParticipants, setEventParticipants] = useState<EventParticipant[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [profile, setProfile] = useState<ClubProfile>(getClubProfile());

  // UI Navigation & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [currentNav, setCurrentNav] = useState<ActiveNav>('dashboard');
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
  const [selectedClassId, setSelectedClassId] = useState<string>('ku-10');
  const [selectedEventId, setSelectedEventId] = useState<string>('evt-familia-cup');

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

  // Initial Data Load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    const stds = getStudents();
    const cls = getClasses();
    const dues = getMonthlyDues();
    const evts = getEvents();
    const parts = getEventParticipants();
    const atts = getAttendanceSessions();
    const txs = getTransactions();
    const prof = getClubProfile();
    const subs = getPaymentSubmissions();

    setStudents(stds);
    setClasses(cls);
    setMonthlyDues(dues);
    setEvents(evts);
    setEventParticipants(parts);
    setAttendanceSessions(atts);
    setTransactions(txs);
    setProfile(prof);
    setSubmissions(subs);

    if (stds.length > 0 && !selectedStudentId) {
      // Default to Kamila Syahira or first student
      const kamila = stds.find((s) => s.nama === 'Kamila Syahira');
      setSelectedStudentId(kamila ? kamila.id : stds[0].id);
    }
  };

  const handleClearToZero = () => {
    if (confirm('Mulai database dari nol? Semua data murid, transaksi, absensi, dan iuran akan dikosongkan.')) {
      clearDatabaseToZero();
      loadAllData();
      setSelectedStudentId('');
      setSubmissions([]);
      alert('Database sekarang telah kosong (mulai dari nol). Anda siap menginput data baru.');
    }
  };

  const handleLoadSeedData = () => {
    if (confirm('Muat data contoh demo SportKit (30+ murid KU-10, transaksi, dan absensi)?')) {
      resetToSeedData();
      loadAllData();
      alert('Data contoh demo berhasil dimuat!');
    }
  };

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'coach') {
      setCurrentNav('sesi-absensi');
    } else if (newRole === 'public') {
      setCurrentNav('pendaftaran-baru');
    } else if (newRole === 'student') {
      setCurrentNav('student-portal');
    } else {
      setCurrentNav('dashboard');
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
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

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
      keterangan: `Iuran Rutin ${monthNames[due.bulan - 1]} ${due.tahun}`,
      periodeInfo: `${monthNames[due.bulan - 1]} ${due.tahun}`,
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
    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toTimeString().slice(0, 5);

    // 1. Save Transaction
    const updatedTxs = [tx, ...transactions];
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    // 2. If it was Monthly Due (or Iuran Rutin)
    const targetBulan = proofData?.bulan || paymentModalState.bulan;
    const targetTahun = proofData?.tahun || paymentModalState.tahun || 2024;

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
        kelasId: studentClass?.id || paymentModalState.kelasId || 'ku-10',
        kelasNama: tx.kelasNama,
        tipe: 'Iuran Rutin',
        bulan: targetBulan,
        tahun: targetTahun,
        nominal: tx.nominal,
        metodePembayaran: tx.metodePembayaran,
        tanggalTransfer: tx.tanggal || today,
        buktiGambarUrl: proofData?.buktiGambarUrl || SAMPLE_TRANSFER_PROOF_SVG,
        pesanSiswa: proofData?.pesanPembayaran || tx.keterangan,
        status: 'verified',
        tanggalKirim: `${today} ${time}`,
        tanggalVerifikasi: today,
        diverifikasiOleh: 'Super Admin',
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

      // Also ensure student has monthly dues initialized for November
      const newDue: MonthlyDueRecord = {
        id: `due-${tx.siswaId}-2024-11`,
        siswaId: tx.siswaId,
        tahun: 2024,
        bulan: 11,
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
  const handleRegisterSubmit = (newStudent: Student, autoPayDirectly: boolean) => {
    const updated = [newStudent, ...students];
    setStudents(updated);
    saveStudents(updated);

    if (autoPayDirectly) {
      const cls = classes.find((c) => c.id === newStudent.kelasId) || classes[0];
      handleOpenApplicantPaymentModal(newStudent, cls);
    } else {
      if (currentRole !== 'public') {
        setCurrentNav('calon-siswa');
      }
    }
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

  // Submit payment proof from student account
  const handleSubmitPaymentProof = (
    newSub: Omit<PaymentSubmission, 'id' | 'status' | 'tanggalKirim'>
  ) => {
    const id = `sub-${Date.now()}`;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5);
    const submissionItem: PaymentSubmission = {
      ...newSub,
      id,
      status: 'pending',
      tanggalKirim: `${dateStr} ${timeStr}`,
    };

    const updated = [submissionItem, ...submissions];
    setSubmissions(updated);
    savePaymentSubmissions(updated);
  };

  // Verify payment submission by admin
  const handleVerifySubmission = (submissionId: string, catatanAdmin: string) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    const receiptNo = generateReceiptNumber();
    const txId = `tx-${Date.now()}`;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const periodLabel = sub.bulan && sub.tahun 
      ? `Iuran Rutin ${monthNames[sub.bulan - 1]} ${sub.tahun}`
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
      terbilang: numberToWordsId(sub.nominal) + ' Rupiah',
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
        // Create new monthly due record
        const newDue: MonthlyDueRecord = {
          id: `due-${sub.siswaId}-${sub.bulan}-${sub.tahun}`,
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
          diverifikasiOleh: 'Super Admin',
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
    const today = new Date().toISOString().slice(0, 10);
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
    const today = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const periodLabel = `Iuran Rutin ${monthNames[bulan - 1]} ${tahun}`;

    // 1. Transaction
    const newTx: PaymentTransaction = {
      id: txId,
      nomorKuitansi: receiptNo,
      siswaId,
      siswaNama,
      kelasNama,
      tanggal: tanggalTransfer || today,
      nominal,
      terbilang: numberToWordsId(nominal) + ' Rupiah',
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
      buktiGambarUrl: buktiGambarUrl || SAMPLE_TRANSFER_PROOF_SVG,
      pesanSiswa: pesanPembayaran || `Pembayaran iuran ${monthNames[bulan - 1]} ${tahun}`,
      status: 'verified',
      tanggalKirim: `${today} ${time}`,
      tanggalVerifikasi: today,
      diverifikasiOleh: 'Super Admin',
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
        clubProfile={profile}
        calonCount={calonCount}
        pendingVerificationsCount={pendingSubmissionsCount}
        activeStudentName={activeStudent?.nama}
        onToggleSidebar={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        onNavigateCalon={() => setCurrentNav('calon-siswa')}
        onNavigateVerifikasi={() => setCurrentNav('verifikasi-pembayaran')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation (hidden in public mode) */}
        {currentRole !== 'public' && (
          <Sidebar
            currentNav={currentNav}
            onSelectNav={setCurrentNav}
            calonCount={calonCount}
            pendingVerificationsCount={pendingSubmissionsCount}
            currentRole={currentRole}
            isOpenMobile={sidebarMobileOpen}
            onCloseMobile={() => setSidebarMobileOpen(false)}
          />
        )}

        {/* Main Workspace Body */}
        <main
          className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 transition-all ${
            currentRole !== 'public' ? 'lg:ml-64' : 'max-w-5xl mx-auto w-full'
          }`}
        >
          {/* Public Mode Helper Switcher Bar */}
          {currentRole === 'public' && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-md">
              <div>
                <p className="text-xs font-bold text-sky-400">Mode Simulasi Link Publik / Bio IG</p>
                <p className="text-[11px] text-slate-300">
                  Ini adalah halaman pendaftaran online yang dapat disematkan di bio Instagram atau WhatsApp klub.
                </p>
              </div>
              <button
                onClick={() => handleRoleChange('admin')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
              >
                Kembali ke Dashboard Admin
              </button>
            </div>
          )}

          {/* VIEW SWITCHER */}
          {currentRole === 'public' ? (
            <PendaftaranView
              classes={classes}
              isPublicMode={true}
              onRegisterSubmit={handleRegisterSubmit}
            />
          ) : currentRole === 'student' || currentNav === 'student-portal' ? (
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
                <p className="text-sm font-bold text-slate-700">Belum ada data siswa dalam database.</p>
                <button
                  onClick={handleLoadSeedData}
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Muat Data Demo Siswa
                </button>
              </div>
            )
          ) : (
            <>
              {currentNav === 'dashboard' && (
                <DashboardView
                  students={students}
                  classes={classes}
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
                  onAddClass={handleAddClass}
                  onUpdateClass={handleUpdateClass}
                  onDeleteClass={handleDeleteClass}
                  onNavigateNewRegistration={(classId) => {
                    if (classId) setSelectedClassId(classId);
                    setCurrentNav('pendaftaran-baru');
                  }}
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
                  onClearToZero={handleClearToZero}
                  onLoadSeedData={handleLoadSeedData}
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
