import React, { useState } from 'react';
import { AttendanceSession, Student, ClassGroup } from '../types/sportkit';
import { Search, Plus, Edit2, CheckSquare, Square, Check, X, ArrowLeft, Trash2 } from 'lucide-react';

interface SesiAbsensiViewProps {
  sessions: AttendanceSession[];
  students: Student[];
  classes: ClassGroup[];
  onAddSession: (session: AttendanceSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const SesiAbsensiView: React.FC<SesiAbsensiViewProps> = ({
  sessions,
  students,
  classes,
  onAddSession,
  onDeleteSession,
}) => {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states for adding session (matching video timestamp 03:36)
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState<string>('ku-10');
  const [catatan, setCatatan] = useState<string>('Latihan teknik dasar & game simulation');
  const [kehadiranMap, setKehadiranMap] = useState<{ [sid: string]: boolean }>({});

  const classStudents = students.filter(
    (s) => s.kelasId === selectedClassId && s.status === 'Aktif'
  );

  // Initialize all students as present by default when entering add mode
  const handleStartAdd = () => {
    const initialMap: { [sid: string]: boolean } = {};
    classStudents.forEach((std) => {
      initialMap[std.id] = true;
    });
    setKehadiranMap(initialMap);
    setIsAdding(true);
  };

  const toggleStudentPresence = (sid: string) => {
    setKehadiranMap((prev) => ({
      ...prev,
      [sid]: !prev[sid],
    }));
  };

  const handleSelectAll = (val: boolean) => {
    const newMap: { [sid: string]: boolean } = {};
    classStudents.forEach((std) => {
      newMap[std.id] = val;
    });
    setKehadiranMap(newMap);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    const newSession: AttendanceSession = {
      id: 'att-' + Date.now(),
      tanggal,
      kelasId: selectedClassId,
      catatan,
      pelatih: 'Coach Dimas',
      kehadiran: kehadiranMap,
    };

    onAddSession(newSession);
    setIsAdding(false);
  };

  const filteredSessions = sessions.filter((s) => {
    const cls = classes.find((c) => c.id === s.kelasId);
    const text = `${s.tanggal} ${cls?.nama || ''} ${s.catatan}`.toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* View Mode: Session List */}
      {!isAdding ? (
        <>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                SESI
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar rekaman sesi latihan dan absensi kehadiran murid oleh pelatih
              </p>
            </div>

            <button
              onClick={handleStartAdd}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sesi Absensi</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Cari sesi latihan berdasarkan tanggal atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Session Table (matching video timestamp 03:34) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-3 px-4 border border-slate-800 w-16 text-center">No</th>
                    <th className="py-3 px-4 border border-slate-800">Tanggal</th>
                    <th className="py-3 px-4 border border-slate-800">Kelas</th>
                    <th className="py-3 px-4 border border-slate-800">Catatan Latihan</th>
                    <th className="py-3 px-4 border border-slate-800 text-center">Kehadiran</th>
                    <th className="py-3 px-4 border border-slate-800 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Tidak ada riwayat sesi ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session, index) => {
                      const cls = classes.find((c) => c.id === session.kelasId);
                      const presentCount = Object.values(session.kehadiran).filter(Boolean).length;
                      const totalStudents = Object.keys(session.kehadiran).length;

                      return (
                        <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-600 text-center border-r border-slate-200">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-800 border-r border-slate-200">
                            {session.tanggal}
                          </td>
                          <td className="py-3 px-4 font-semibold text-blue-900 border-r border-slate-200">
                            <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-bold">
                              {cls ? cls.nama : session.kelasId.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 border-r border-slate-200">
                            {session.catatan || '-'}
                          </td>
                          <td className="py-3 px-4 text-center border-r border-slate-200">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              {presentCount} / {totalStudents} Hadir
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onDeleteSession(session.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Hapus sesi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Add Session Form (matching video timestamp 03:36) */
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                TAMBAH ABSENSI SISWA
              </h2>
              <p className="text-xs text-slate-500">
                Pilih tanggal, kelas, dan checklist daftar murid yang hadir dalam sesi latihan
              </p>
            </div>
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          </div>

          <form onSubmit={handleSaveSession} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kelas</label>
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    setSelectedClassId(e.target.value);
                    // Reset kehadiran map for new class
                    const newClassStudents = students.filter(
                      (s) => s.kelasId === e.target.value && s.status === 'Aktif'
                    );
                    const initMap: { [sid: string]: boolean } = {};
                    newClassStudents.forEach((s) => (initMap[s.id] = true));
                    setKehadiranMap(initMap);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 font-bold bg-white"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Catatan materi atau catatan pelatih untuk sesi ini..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900"
                />
              </div>
            </div>

            {/* Checklist Siswa Hadir (matching video timestamp 03:41) */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Pilih Siswa Hadir</h4>
                  <p className="text-[11px] text-slate-500">
                    Centang siswa yang hadir. Siswa yang tidak dicentang akan otomatis tercatat absen.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                  >
                    Pilih Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                  >
                    Hapus Pilihan
                  </button>
                </div>
              </div>

              {/* Student Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-2 pt-2">
                {classStudents.map((std) => {
                  const isChecked = !!kehadiranMap[std.id];
                  return (
                    <div
                      key={std.id}
                      onClick={() => toggleStudentPresence(std.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleStudentPresence(std.id);
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs truncate font-medium">{std.nama}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md hover:shadow-lg transition-all"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
