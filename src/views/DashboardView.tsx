import React, { useState } from 'react';
import { Student, ClassGroup, ClubEvent, PaymentTransaction } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { 
  Users, 
  UserPlus, 
  Wallet, 
  CreditCard, 
  CalendarCheck, 
  Search, 
  ChevronRight, 
  Receipt,
  ArrowUpRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  classes: ClassGroup[];
  events: ClubEvent[];
  transactions: PaymentTransaction[];
  onSelectStudent: (studentId: string) => void;
  onSelectClassIuran: (classId: string) => void;
  onSelectEventIuran: (eventId: string) => void;
  onNavigateNewRegistration: () => void;
  onNavigateCalonSiswa: () => void;
  onNavigateKelas: () => void;
  onViewReceipt: (transaction: PaymentTransaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  classes,
  events,
  transactions,
  onSelectStudent,
  onSelectClassIuran,
  onSelectEventIuran,
  onNavigateNewRegistration,
  onNavigateCalonSiswa,
  onNavigateKelas,
  onViewReceipt,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const activeStudents = students.filter((s) => s.status === 'Aktif');
  const calonStudents = students.filter((s) => s.status === 'Calon');

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
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0b294a] via-[#103b68] to-[#144b82] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-400/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-sky-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem Administrasi Klub Berbasis Website</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Selamat Datang di SportKit Club Administration
          </h1>
          <p className="mt-2 text-sm text-slate-200 leading-relaxed">
            Platform modern untuk mencatat pendaftaran siswa baru, iuran rutin bulanan, iuran insidentil turnamen, serta absensi latihan harian secara instan.
          </p>
        </div>
      </div>

      {/* Two Hero Main Cards (matching exact video layout timestamp 00:02 & 01:10) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: SISWA */}
        <div className="bg-gradient-to-b from-[#0d345c] to-[#092542] rounded-2xl p-6 text-white shadow-xl border border-blue-900/60 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Art / Illustration Silhouette */}
          <div className="absolute right-4 top-4 opacity-15 pointer-events-none">
            <Users className="w-40 h-40 text-blue-300" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Siswa</span>
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/30 text-sky-200 border border-blue-400/30">
                Pusat Siswa
              </span>
            </div>

            {/* Dropdown: Cari Siswa Aktif */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Cari Siswa Aktif</span>
                <span className="text-[11px] text-sky-300 font-normal">Pilih profil siswa</span>
              </label>
              <div className="relative">
                <select
                  value={selectedStudentId}
                  onChange={(e) => handleStudentChange(e.target.value)}
                  className="w-full bg-[#133f6d] border border-blue-400/40 text-white rounded-xl px-4 py-3 text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer shadow-inner"
                >
                  <option value="" className="bg-slate-900 text-slate-300">
                    Nama
                  </option>
                  {activeStudents.map((std) => (
                    <option key={std.id} value={std.id} className="bg-slate-900 text-white">
                      {std.nama} ({std.kelasId.toUpperCase()})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-3.5 pointer-events-none text-sky-300">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons: Pendaftaran Baru & Calon Siswa */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-800/60">
            <button
              onClick={onNavigateNewRegistration}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#144272] hover:bg-[#1b5591] text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/20 border border-blue-400/30"
            >
              <UserPlus className="w-4 h-4 text-sky-300" />
              <span>Pendaftaran Baru</span>
            </button>

            <button
              onClick={onNavigateCalonSiswa}
              className="relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#144272] hover:bg-[#1b5591] text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/20 border border-blue-400/30"
            >
              <Users className="w-4 h-4 text-sky-300" />
              <span>Calon Siswa</span>
              {calonStudents.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {calonStudents.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* CARD 2: STATUS IURAN */}
        <div className="bg-gradient-to-b from-[#0d345c] to-[#092542] rounded-2xl p-6 text-white shadow-xl border border-blue-900/60 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Background Art */}
          <div className="absolute right-4 top-4 opacity-15 pointer-events-none">
            <Wallet className="w-40 h-40 text-blue-300" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Status Iuran</span>
              </h2>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center font-bold text-xs">
                Rp
              </div>
            </div>

            {/* Dropdown 1: Iuran Rutin by Kelas */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Iuran Rutin</span>
                <span className="text-[11px] text-sky-300 font-normal">Lihat matriks kelas</span>
              </label>
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full bg-[#133f6d] border border-blue-400/40 text-white rounded-xl px-4 py-3 text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer shadow-inner"
                >
                  <option value="" className="bg-slate-900 text-slate-300">
                    Kelas
                  </option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id} className="bg-slate-900 text-white">
                      {cls.nama}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-3.5 pointer-events-none text-sky-300">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
            </div>

            {/* Dropdown 2: Iuran Insidentil by Event */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
                <span>Iuran Insidentil</span>
                <span className="text-[11px] text-sky-300 font-normal">Turnamen & kegiatan</span>
              </label>
              <div className="relative">
                <select
                  value={selectedEventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full bg-[#133f6d] border border-blue-400/40 text-white rounded-xl px-4 py-3 text-sm font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer shadow-inner"
                >
                  <option value="" className="bg-slate-900 text-slate-300">
                    Event
                  </option>
                  {events.map((evt) => (
                    <option key={evt.id} value={evt.id} className="bg-slate-900 text-white">
                      {evt.nama} ({formatRupiah(evt.nominal)})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-3.5 pointer-events-none text-sky-300">
                  <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-blue-800/60 flex items-center justify-between text-xs text-slate-300">
            <span>Visualisasi status warna:</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Lunas
              </span>
              <span className="inline-flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Belum Bayar
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Summary Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          onClick={onNavigateKelas}
          className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
          title="Klik untuk kelola & buat kelompok kelas baru"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
              Kelompok Kelas
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 group-hover:text-blue-700 transition-colors">
            {classes.length} Kelas
          </div>
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
            <span>+ Buat / Atur Kelas</span>
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calon Siswa</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {calonStudents.length}
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Menunggu verifikasi</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Iuran Masuk</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {formatRupiah(transactions.reduce((sum, t) => sum + t.nominal, 0))}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Tercatat di sistem</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Event Aktif</span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {events.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Turnamen & kejuaraan</p>
        </div>
      </div>

      {/* Recent Payment Receipts */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Transaksi Pembayaran Terbaru</h3>
            <p className="text-xs text-slate-500">Kuitansi resmi yang telah diterbitkan otomatis</p>
          </div>
          <span className="text-xs font-semibold text-blue-600">
            {transactions.length} Kuitansi
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Belum ada transaksi pembayaran.</p>
              <p className="text-slate-400 mt-0.5">
                Kuitansi resmi akan otomatis tercatat di sini setelah pendaftaran siswa baru atau pembayaran iuran dilakukan.
              </p>
            </div>
          ) : (
            transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{tx.siswaNama}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {tx.kelasNama}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tx.tipe} • <span className="font-mono text-slate-600">{tx.nomorKuitansi}</span> • {tx.tanggal}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{formatRupiah(tx.nominal)}</p>
                  <p className="text-[11px] text-slate-500">{tx.metodePembayaran}</p>
                </div>
                <button
                  onClick={() => onViewReceipt(tx)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Cetak Kuitansi</span>
                </button>
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
};
