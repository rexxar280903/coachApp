import React, { useState } from 'react';
import { Student, ClassGroup, ClubEvent, PaymentTransaction, Coach } from '../types/sportkit';
import { getCoachClasses } from '../utils/coaches';
import { formatRupiah } from '../utils/numberToWordsId';
import { 
  Users, 
  UserPlus, 
  Wallet, 
  CreditCard, 
  ChevronRight, 
  Receipt,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  UserCheck,
  Award,
  Phone
} from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  classes: ClassGroup[];
  coaches: Coach[];
  events: ClubEvent[];
  transactions: PaymentTransaction[];
  pendingSubmissionsCount?: number;
  onNavigateVerifikasi?: () => void;
  onSelectStudent: (studentId: string) => void;
  onSelectClassIuran: (classId: string) => void;
  onSelectEventIuran: (eventId: string) => void;
  onNavigateNewRegistration: () => void;
  onNavigateCalonSiswa: () => void;
  onNavigateKelas: () => void;
  onNavigatePelatih?: () => void;
  onViewReceipt: (transaction: PaymentTransaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  classes,
  coaches,
  events,
  transactions,
  pendingSubmissionsCount = 0,
  onNavigateVerifikasi,
  onSelectStudent,
  onSelectClassIuran,
  onSelectEventIuran,
  onNavigateNewRegistration,
  onNavigateCalonSiswa,
  onNavigateKelas,
  onNavigatePelatih,
  onViewReceipt,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const activeStudents = students.filter((s) => s.status === 'Aktif');
  const calonStudents = students.filter((s) => s.status === 'Calon');
  const totalRevenue = transactions.reduce((sum, t) => sum + t.nominal, 0);

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(id);
    if (id) {
      onSelectStudent(id);
    }
  };

  const handleClassChange = (cid: string) => {
    setSelectedClassId(cid);
    if (cid) {
      onSelectClassIuran(cid);
    }
  };

  const handleEventChange = (eid: string) => {
    setSelectedEventId(eid);
    if (eid) {
      onSelectEventIuran(eid);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner: Modern Athletic Obsidian / Pitch Canvas */}
      <div className="bg-[#090e17] border border-slate-800/80 rounded-2xl p-6 text-white shadow-sm relative overflow-hidden">
        {/* Subtle Pitch Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-pitch-pattern opacity-40 pointer-events-none" />
        
        {/* Dynamic Glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800/90 text-emerald-400 text-xs font-semibold mb-3 border border-slate-700/60">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sistem Manajemen Akademi & Keuangan Klub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
              Dashboard Administrasi Klub
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Pencatatan data siswa, penerbitan kuitansi resmi pendaftaran, iuran rutin bulanan, iuran insidentil kejuaraan, serta absensi presensi latihan.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <button
              onClick={onNavigateNewRegistration}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Pendaftaran Baru</span>
            </button>
            <button
              onClick={onNavigateKelas}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Kelola Kelas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Card: Pending Payment Verifications */}
      {pendingSubmissionsCount > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/40 p-4 sm:p-5 rounded-2xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono">
                  {pendingSubmissionsCount} MENUNGGU
                </span>
                <h3 className="font-display font-bold text-sm text-slate-100">
                  Bukti Pembayaran Siswa Menunggu Verifikasi
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Ada bukti transfer yang telah dikirim dari akun siswa. Cek mutasi bank dan verifikasi ceklist lunas.
              </p>
            </div>
          </div>
          {onNavigateVerifikasi && (
            <button
              onClick={onNavigateVerifikasi}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Buka Verifikasi Bukti</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Two Main Action Cards: Siswa & Status Iuran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: PUSAT DATA SISWA */}
        <div className="sports-card sports-card-hover rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900">
                    Pusat Data Siswa
                  </h2>
                  <p className="text-xs text-slate-500">Pencarian & manajemen profil atlet</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                {activeStudents.length} Siswa Aktif
              </span>
            </div>

            {/* Quick Selector */}
            <div className="mt-5 mb-6">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Pilih Profil Siswa:
              </label>
              <div className="relative">
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="">-- Pilih Siswa untuk Buka Profil --</option>
                  {activeStudents.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.nama} — Kelas {std.kelasId.toUpperCase()}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-3.5 pointer-events-none text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Pilih siswa untuk langsung memeriksa kartu iuran, kuitansi, riwayat hadir, dan kontak orang tua.
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={onNavigateNewRegistration}
              className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 text-xs font-semibold transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Input Siswa Baru</span>
            </button>

            <button
              onClick={onNavigateCalonSiswa}
              className="relative flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Calon Siswa</span>
              {calonStudents.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-mono font-bold flex items-center justify-center shadow-xs">
                  {calonStudents.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* CARD 2: STATUS & KEUANGAN IURAN */}
        <div className="sports-card sports-card-hover rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900">
                    Status Matriks Iuran
                  </h2>
                  <p className="text-xs text-slate-500">Iuran bulanan & partisipasi turnamen</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span>Lunas</span>
                <span className="text-slate-300">·</span>
                <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                <span>Belum</span>
              </div>
            </div>

            {/* Matrix Selectors */}
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Matriks Iuran Rutin (Per Kelas)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Pilih kelompok</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="">-- Pilih Kelas untuk Buka Matriks --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.nama} — {formatRupiah(cls.iuranBulanan)}/bln
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-3 pointer-events-none text-slate-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Iuran Insidentil (Turnamen / Jersey)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Pilih kegiatan</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedEventId}
                    onChange={(e) => handleEventChange(e.target.value)}
                    className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="">-- Pilih Event / Kejuaraan --</option>
                    {events.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.nama} ({formatRupiah(evt.nominal)})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-3 pointer-events-none text-slate-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Sistem Kuitansi: Cetak PDF & Bagikan ke WhatsApp</span>
            <button
              onClick={() => onSelectClassIuran(classes[0]?.id || 'ku-10')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Buka Matriks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div 
          onClick={onNavigateKelas}
          className="sports-card sports-card-hover rounded-xl p-4 cursor-pointer group"
          title="Klik untuk kelola kelompok kelas"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
              Kelompok Kelas
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums">
            {classes.length} <span className="text-xs font-medium text-slate-500">Kelas</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <span>Atur kelompok kelas →</span>
          </p>
        </div>

        {/* KPI 2 */}
        <div 
          onClick={onNavigateCalonSiswa}
          className="sports-card sports-card-hover rounded-xl p-4 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Calon Siswa
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums">
            {calonStudents.length} <span className="text-xs font-medium text-slate-500">Siswa</span>
          </div>
          <p className="text-[11px] text-amber-600 font-medium mt-0.5">
            {calonStudents.length > 0 ? 'Menunggu konfirmasi pembayaran' : 'Semua sudah diverifikasi'}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="sports-card sports-card-hover rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Kas Iuran Masuk
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-display font-bold text-slate-900 tabular-nums">
            {formatRupiah(totalRevenue)}
          </div>
          <p className="text-[11px] text-teal-600 font-medium mt-0.5">
            {transactions.length} transaksi resmi
          </p>
        </div>

        {/* KPI 4 */}
        <div className="sports-card sports-card-hover rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Event Turnamen
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-display font-bold text-slate-900 tabular-nums">
            {events.length} <span className="text-xs font-medium text-slate-500">Event</span>
          </div>
          <p className="text-[11px] text-indigo-600 font-medium mt-0.5">
            Kejuaraan & kompetisi aktif
          </p>
        </div>
      </div>

      {/* Coaches Strip */}
      {coaches.length > 0 && (
        <div className="sports-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">Tim Pelatih Aktif</h3>
                <p className="text-xs text-slate-500">{coaches.filter(c => c.status === 'Aktif').length} pelatih aktif terdaftar</p>
              </div>
            </div>
            {onNavigatePelatih && (
              <button
                onClick={onNavigatePelatih}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {coaches.filter(c => c.status === 'Aktif').slice(0, 6).map((coach) => {
              const coachClasses = getCoachClasses(coach.id, classes);
              return (
                <div key={coach.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {coach.nama.split(' ').slice(-1)[0]?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 truncate">{coach.nama}</p>
                    <p className="text-xs text-sky-600 font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" />{coach.spesialisasi}
                    </p>
                    {coachClasses.length > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {coachClasses.map(c => c.nama).join(', ')}
                      </p>
                    )}
                    <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-2.5 h-2.5" />{coach.noHp}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Payment Receipts */}
      <div className="sports-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm">
              Transaksi Pembayaran & Kuitansi Terbaru
            </h3>
            <p className="text-xs text-slate-500">
              Riwayat kuitansi resmi yang tercatat dan siap dicetak atau dikirim ke WhatsApp
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
            {transactions.length} Kuitansi
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">Belum ada riwayat transaksi pembayaran.</p>
              <p className="text-slate-400 mt-1 max-w-sm mx-auto">
                Kuitansi resmi akan tercatat di sini setelah pendaftaran siswa disetujui atau iuran dibayarkan.
              </p>
            </div>
          ) : (
            transactions.slice(0, 8).map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <Receipt className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{tx.siswaNama}</span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {tx.kelasNama}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{tx.tipe}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-600">{tx.nomorKuitansi}</span>
                      <span aria-hidden="true">·</span>
                      <span>{tx.tanggal}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                      {formatRupiah(tx.nominal)}
                    </p>
                    <p className="text-[11px] text-slate-500">{tx.metodePembayaran}</p>
                  </div>
                  <button
                    onClick={() => onViewReceipt(tx)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Lihat Kuitansi</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
