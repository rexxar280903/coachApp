import React, { useState } from 'react';
import { getTodayISO } from '../utils/constants';
import { AttendanceSession, Student, ClassGroup, Coach } from '../types/sportkit';
import { Search, Plus, Edit2, CheckSquare, Square, Check, X, ArrowLeft, Trash2, CalendarCheck, UserCheck, Clock } from 'lucide-react';
import { useToast } from '../components/Toast';
import { getClassCoaches, getSessionCoachLabel } from '../utils/coaches';

interface SesiAbsensiViewProps {
  sessions: AttendanceSession[];
  students: Student[];
  classes: ClassGroup[];
  coaches: Coach[];
  onAddSession: (session: AttendanceSession) => void;
  onUpdateSession: (session: AttendanceSession) => void;
  onDeleteSession: (sessionId: string) => void;
}

export const SesiAbsensiView: React.FC<SesiAbsensiViewProps> = ({
  sessions,
  students,
  classes,
  coaches,
  onAddSession,
  onUpdateSession,
  onDeleteSession,
}) => {
  const { confirm, toast } = useToast();
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [tanggal, setTanggal] = useState<string>(getTodayISO());
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'ku-10');
  const activeCoaches = coaches.filter((c) => c.status === 'Aktif');
  const [selectedCoachId, setSelectedCoachId] = useState<string>(activeCoaches[0]?.id || '');
  const [manualCoachNama, setManualCoachNama] = useState<string>('');

  // Saat kelas dipilih, otomatis pilih pelatih pengampu kelas tersebut
  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    const cls = classes.find((c) => c.id === classId);
    const firstCoach = cls && getClassCoaches(cls, activeCoaches)[0];
    if (firstCoach) setSelectedCoachId(firstCoach.id);
    // Daftar hadir harus mengikuti siswa kelas yang baru dipilih
    setKehadiranMap(buildDefaultMap(classId));
  };
  const [catatan, setCatatan] = useState<string>('Latihan teknik dasar & game simulation');
  const [kehadiranMap, setKehadiranMap] = useState<{ [sid: string]: boolean }>({});

  const studentsOfClass = (classId: string) =>
    students.filter((s) => s.kelasId === classId && s.status === 'Aktif');

  const buildDefaultMap = (classId: string) => {
    const map: { [sid: string]: boolean } = {};
    studentsOfClass(classId).forEach((std) => {
      map[std.id] = true;
    });
    return map;
  };

  // Saat mengedit, siswa yang tercatat di sesi tetap ditampilkan walau statusnya sudah berubah
  const editingSession = editingSessionId ? sessions.find((s) => s.id === editingSessionId) : undefined;
  // (termasuk siswa yang sudah pindah kelas, agar catatan kehadirannya tidak hilang saat disimpan ulang).
  const recordedInEdit = (s: Student) =>
    !!editingSession && editingSession.kelasId === selectedClassId && editingSession.kehadiran[s.id] !== undefined;
  const classStudents = students.filter(
    (s) => recordedInEdit(s) || (s.kelasId === selectedClassId && s.status === 'Aktif')
  );

  const handleStartAdd = () => {
    const classId = classes.some((c) => c.id === selectedClassId) ? selectedClassId : classes[0]?.id || '';
    setEditingSessionId(null);
    setTanggal(getTodayISO());
    setCatatan('Latihan teknik dasar & game simulation');
    handleSelectClass(classId);
    setIsAdding(true);
  };

  const handleStartEdit = (session: AttendanceSession) => {
    setEditingSessionId(session.id);
    setTanggal(session.tanggal);
    setSelectedClassId(session.kelasId);
    setCatatan(session.catatan);
    setSelectedCoachId(session.pelatihId || '');
    setManualCoachNama(session.pelatihId ? '' : session.pelatih === '-' ? '' : session.pelatih);
    const map: { [sid: string]: boolean } = { ...session.kehadiran };
    studentsOfClass(session.kelasId).forEach((std) => {
      if (map[std.id] === undefined) map[std.id] = false;
    });
    setKehadiranMap(map);
    setIsAdding(true);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingSessionId(null);
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

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error('Kelas belum dipilih', 'Buat atau pilih kelompok kelas terlebih dahulu.');
      return;
    }
    // Simpan hanya siswa kelas ini (hindari sisa data kelas lain)
    const classIds = new Set(classStudents.map((s) => s.id));
    const kehadiran: { [sid: string]: boolean } = {};
    Object.entries(kehadiranMap).forEach(([sid, hadir]) => {
      if (classIds.has(sid)) kehadiran[sid] = hadir;
    });

    const duplicate = sessions.find(
      (s) => s.id !== editingSessionId && s.tanggal === tanggal && s.kelasId === selectedClassId
    );
    if (duplicate) {
      const ok = await confirm(
        'Sesi Sudah Ada',
        'Sudah ada sesi untuk kelas ini pada tanggal yang sama. Tetap simpan sebagai sesi terpisah?'
      );
      if (!ok) return;
    }

    const coach = coaches.find((c) => c.id === selectedCoachId);
    const session: AttendanceSession = {
      id: editingSessionId || 'att-' + Date.now(),
      tanggal,
      kelasId: selectedClassId,
      catatan,
      pelatihId: coach?.id,
      pelatih: coach?.nama || manualCoachNama.trim() || '-',
      kehadiran,
    };

    if (editingSessionId) {
      onUpdateSession(session);
      toast.success('Sesi diperbarui', `Presensi tanggal ${tanggal} berhasil disimpan.`);
    } else {
      onAddSession(session);
      toast.success('Sesi tersimpan', `Presensi tanggal ${tanggal} berhasil dicatat.`);
    }
    setIsAdding(false);
    setEditingSessionId(null);
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
                            {getSessionCoachLabel(session, coaches)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-200">
                              {presentCount} / {totalMarked} Siswa
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleStartEdit(session)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Edit sesi"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                const ok = await confirm(`Hapus Sesi Latihan?`, `Sesi latihan tanggal ${session.tanggal} untuk kelas ${classes.find(c => c.id === session.kelasId)?.nama || ''} akan dihapus permanen.`);
                                if (ok) onDeleteSession(session.id);
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
                {editingSessionId ? 'Edit Presensi Sesi Latihan' : 'Pencatatan Presensi Sesi Latihan'}
              </h2>
              <p className="text-xs text-slate-500">
                Tandai kehadiran murid yang hadir pada sesi latihan ini
              </p>
            </div>
            <button
              onClick={handleCancelForm}
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
                  onChange={(e) => handleSelectClass(e.target.value)}
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
                  Pelatih Pencatat Absensi
                </label>
                {activeCoaches.length > 0 ? (
                  <select
                    value={selectedCoachId}
                    onChange={(e) => setSelectedCoachId(e.target.value)}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer bg-white"
                  >
                    <option value="">-- Pilih Pelatih --</option>
                    {[
                      ...activeCoaches,
                      // Pelatih nonaktif yang tercatat di sesi yang sedang diedit tetap bisa dipilih
                      ...coaches.filter((c) => c.id === selectedCoachId && c.status !== 'Aktif'),
                    ].map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama} — {c.spesialisasi}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={manualCoachNama}
                    onChange={(e) => setManualCoachNama(e.target.value)}
                    placeholder="Nama pelatih pencatat absensi"
                    className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
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
                onClick={handleCancelForm}
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
