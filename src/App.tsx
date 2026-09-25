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
  clearDatabaseToZero,
  resetToSeedData,
} from './services/storage';

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

export default function App() {
  // Global Data State
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGroup[]>([]);
  const [monthlyDues, setMonthlyDues] = useState<MonthlyDueRecord[]>([]);
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [eventParticipants, setEventParticipants] = useState<EventParticipant[]>([]);
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [profile, setProfile] = useState<ClubProfile>(getClubProfile());

  // UI Navigation & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [currentNav, setCurrentNav] = useState<ActiveNav>('dashboard');
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState<boolean>(false);

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

    setStudents(stds);
    setClasses(cls);
    setMonthlyDues(dues);
    setEvents(evts);
    setEventParticipants(parts);
    setAttendanceSessions(atts);
    setTransactions(txs);
    setProfile(prof);

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
      kelasNama: classGroup.nama,
      noHp: student.noHp,
      nominalAwal: due.nominal - (due.terbayar || 0),
      tipe: 'Iuran Rutin',
      keterangan: `Iuran Rutin ${monthNames[due.bulan - 1]} ${due.tahun}`,
      periodeInfo: `${monthNames[due.bulan - 1]} ${due.tahun}`,
      targetDueId: due.id,
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
  const handlePaymentSuccess = (tx: PaymentTransaction) => {
    // 1. Save Transaction
    const updatedTxs = [tx, ...transactions];
    setTransactions(updatedTxs);
    saveTransactions(updatedTxs);

    // 2. If it was Monthly Due
    if (paymentModalState.targetDueId) {
      const updatedDues = monthlyDues.map((d) => {
        if (d.id === paymentModalState.targetDueId) {
          return {
            ...d,
            status: 'lunas' as const,
            terbayar: d.nominal,
            tanggalBayar: tx.tanggal,
            kuitansiId: tx.nomorKuitansi,
          };
        }
        return d;
      });
      setMonthlyDues(updatedDues);
      saveMonthlyDues(updatedDues);
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
    if (confirm('Hapus riwayat sesi absensi ini?')) {
      const updated = attendanceSessions.filter((s) => s.id !== sessionId);
      setAttendanceSessions(updated);
      saveAttendanceSessions(updated);
    }
  };

  // Update student biodata
  const handleUpdateStudent = (updatedStudent: Student) => {
    const updated = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
    setStudents(updated);
    saveStudents(updated);
  };

  const handleUpdateStudentStatus = (studentId: string, newStatus: StudentStatus) => {
    const updated = students.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s));
    setStudents(updated);
    saveStudents(updated);
  };

  // Count pending calon siswa
  const calonCount = students.filter((s) => s.status === 'Calon').length;

  // View Receipt Handler
  const handleViewReceipt = (tx: PaymentTransaction) => {
    setReceiptModalTx(tx);
  };

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-800 font-sans flex flex-col antialiased">
      {/* Top Header */}
      <Header
        currentRole={currentRole}
        onChangeRole={handleRoleChange}
        clubProfile={profile}
        calonCount={calonCount}
        onResetData={handleClearToZero}
        onToggleSidebar={() => setSidebarMobileOpen(!sidebarMobileOpen)}
        onNavigateCalon={() => setCurrentNav('calon-siswa')}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Navigation (hidden in public mode) */}
        {currentRole !== 'public' && (
          <Sidebar
            currentNav={currentNav}
            onSelectNav={setCurrentNav}
            calonCount={calonCount}
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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-colors"
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
          ) : (
            <>
              {currentNav === 'dashboard' && (
                <DashboardView
                  students={students}
                  classes={classes}
                  events={events}
                  transactions={transactions}
                  onSelectStudent={handleSelectStudent}
                  onSelectClassIuran={handleSelectClassIuran}
                  onSelectEventIuran={handleSelectEventIuran}
                  onNavigateNewRegistration={() => setCurrentNav('pendaftaran-baru')}
                  onNavigateCalonSiswa={() => setCurrentNav('calon-siswa')}
                  onViewReceipt={handleViewReceipt}
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
                  onSelectStudent={setSelectedStudentId}
                  onOpenPaymentModal={handleOpenMonthlyPaymentModal}
                  onOpenEventPaymentModal={handleOpenEventPaymentModal}
                  onUpdateStudent={handleUpdateStudent}
                />
              )}

              {currentNav === 'iuran-rutin' && (
                <IuranRutinView
                  students={students}
                  classes={classes}
                  monthlyDues={monthlyDues}
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
                />
              )}

              {currentNav === 'pendaftaran-baru' && (
                <PendaftaranView
                  classes={classes}
                  isPublicMode={false}
                  onRegisterSubmit={handleRegisterSubmit}
                  onCancel={() => setCurrentNav('dashboard')}
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
        kelasNama={paymentModalState.kelasNama}
        noHp={paymentModalState.noHp}
        nominalAwal={paymentModalState.nominalAwal}
        tipe={paymentModalState.tipe}
        keterangan={paymentModalState.keterangan}
        biayaPendaftaran={paymentModalState.biayaPendaftaran}
        iuranBulanan={paymentModalState.iuranBulanan}
        periodeInfo={paymentModalState.periodeInfo}
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
