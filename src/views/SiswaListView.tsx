import React, { useState } from 'react';
import { Student, ClassGroup, StudentStatus } from '../types/sportkit';
import { Search, Plus, Phone, User, Edit3, Trash2, ArrowRight, MessageCircle, ChevronDown, Users } from 'lucide-react';

interface SiswaListViewProps {
  status: StudentStatus;
  students: Student[];
  classes: ClassGroup[];
  onSelectStudent: (studentId: string) => void;
  onNavigateNewRegistration: () => void;
  onUpdateStatus: (studentId: string, newStatus: StudentStatus) => void;
}

export const SiswaListView: React.FC<SiswaListViewProps> = ({
  status,
  students,
  classes,
  onSelectStudent,
  onNavigateNewRegistration,
  onUpdateStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  const filteredStudents = students.filter((s) => {
    const matchStatus = s.status === status;
    const matchClass = selectedClassId === 'all' || s.kelasId === selectedClassId;
    const matchQuery =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.noHp.includes(searchQuery);
    return matchStatus && matchClass && matchQuery;
  });

  const getStatusBadge = (st: StudentStatus) => {
    switch (st) {
      case 'Aktif':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Cuti':
        return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Nonaktif':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'Calon':
        return 'bg-rose-50 text-rose-700 border border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sports-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
              Daftar Siswa {status}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs font-mono ${getStatusBadge(status)}`}>
              {filteredStudents.length} Siswa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen direktori murid dengan status {status.toLowerCase()} di seluruh kelas akademi
          </p>
        </div>

        <button
          onClick={onNavigateNewRegistration}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Siswa Baru</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="sports-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama atau nomor HP siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-white px-3.5 py-2 pr-9 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
          >
            <option value="all">Semua Kelompok Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nama}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Students List Table */}
      <div className="sports-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Kontak Siswa / Ortu</th>
                <th className="py-3 px-4">Tgl Bergabung</th>
                <th className="py-3 px-4 text-center">Ubah Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ada siswa berstatus {status} yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => {
                  const cls = classes.find((c) => c.id === std.kelasId);
                  const cleanedPhone = std.noHp.replace(/[^0-9]/g, '');
                  const waPhone = cleanedPhone.startsWith('0') ? '62' + cleanedPhone.slice(1) : cleanedPhone;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectStudent(std.id)}
                          className="font-bold text-slate-900 hover:text-emerald-600 transition-colors text-left"
                        >
                          {std.nama}
                        </button>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {std.id} · {std.jenisKelamin}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {cls?.nama || std.kelasId.toUpperCase()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700">{std.noHp}</span>
                          {std.noHp && (
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded"
                              title="Kirim pesan WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Ortu: {std.orangTua.namaAyah} ({std.orangTua.noHpAyah})
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {std.tanggalBergabung}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={std.status}
                          onChange={(e) => onUpdateStatus(std.id, e.target.value as StudentStatus)}
                          className="text-[11px] font-bold rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Cuti">Cuti</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectStudent(std.id)}
                          className="px-3 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors ml-auto cursor-pointer"
                        >
                          <span>Buka Profil</span>
                          <ArrowRight className="w-3 h-3" />
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
    </div>
  );
};
