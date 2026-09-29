import React, { useState } from 'react';
import { AttendanceSession, Student, ClassGroup } from '../types/sportkit';
import { Search, Plus, Edit2, CheckSquare, Square, Check, X, ArrowLeft, Trash2, CalendarCheck, UserCheck, Clock } from 'lucide-react';

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

  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'ku-10');
  const [catatan, setCatatan] = useState<string>('Latihan teknik dasar & game simulation');
  const [kehadiranMap, setKehadiranMap] = useState<{ [sid: string]: boolean }>({});

  const classStudents = students.filter(
    (s) => s.kelasId === selectedClassId && s.status === 'Aktif'
  );

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
      {!isAdding ? (
        <>
          {/* Header */}
          <div className="sports-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
                  Sesi Latihan & Presensi
                </h1>
                <p className="text-xs text-slate-500">
                  Daftar rekaman sesi latihan harian dan pencatatan kehadiran atlet oleh pelatih
                </p>
              </div>
            </div>

            <button
              onClick={handleStartAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buka Sesi Latihan Baru</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="sports-card rounded-2xl p-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari sesi latihan, tanggal, kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Sessions List */}
          <div className="sports-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Tanggal Latihan</th>
                    <th className="py-3 px-4">Kelompok Kelas</th>
                    <th className="py-3 px-4">Materi / Catatan Sesi</th>
                    <th className="py-3 px-4">Pelatih</th>
                    <th className="py-3 px-4 text-center">Hadir</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Belum ada sesi latihan yang tercatat. Silakan klik tombol "+ Buka Sesi Latihan Baru".
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session, idx) => {
                      const cls = classes.find((c) => c.id === session.kelasId);
                      const presentCount = Object.values(session.kehadiran).filter(Boolean).length;
                      const totalMarked = Object.keys(session.kehadiran).length;

                      return (
                        <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                            {session.tanggal}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">
                              {cls?.nama || session.kelasId.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                            {session.catatan}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {session.pelatih}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-200">
                              {presentCount} / {totalMarked} Siswa
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                if (confirm(`Hapus sesi latihan tanggal ${session.tanggal}?`)) {
                                  onDeleteSession(session.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus sesi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
        /* Form Tambah Sesi Absensi Baru */
        <div className="sports-card rounded-2xl p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900">
                Pencatatan Presensi Sesi Latihan
              </h2>
              <p className="text-xs text-slate-500">
                Tandai kehadiran murid yang hadir pada sesi latihan ini
              </p>
            </div>
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Batal</span>
            </button>
          </div>

          <form onSubmit={handleSaveSession} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Latihan
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelompok Kelas
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materi Latihan / Catatan Pelatih
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dribbling drill, passing accuracy, 5v5 small sided game"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Checklist Siswa Hadir */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Murid Kelas ({classStudents.length} Siswa)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Hadir Semua
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="mt-3 divide-y divide-slate-100 max-h-80 overflow-y-auto border border-slate-200 rounded-xl">
                {classStudents.map((std) => {
                  const isPresent = kehadiranMap[std.id] === true;
                  return (
                    <div
                      key={std.id}
                      onClick={() => toggleStudentPresence(std.id)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                        isPresent ? 'bg-emerald-50/30' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            isPresent
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isPresent && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-slate-900">{std.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {std.id}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          isPresent
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isPresent ? 'Hadir' : 'Tidak Hadir'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Simpan Rekap Sesi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
