import React, { useState } from 'react';
import { Student, ClassGroup, StudentStatus } from '../types/sportkit';
import { Search, Plus, Phone, User, Edit3, Trash2, ArrowRight } from 'lucide-react';

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
        return 'bg-emerald-100 text-emerald-800';
      case 'Cuti':
        return 'bg-yellow-100 text-yellow-800';
      case 'Nonaktif':
        return 'bg-slate-200 text-slate-700';
      case 'Calon':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Siswa {status}
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${getStatusBadge(status)}`}>
              {filteredStudents.length} Siswa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar siswa dengan status {status.toLowerCase()} di seluruh kelas akademi
          </p>
        </div>

        <button
          onClick={onNavigateNewRegistration}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Siswa Baru</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Cari nama atau nomor HP siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        <div>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-white font-bold">
                <th className="py-3 px-4 border border-slate-800 w-16 text-center">No</th>
                <th className="py-3 px-4 border border-slate-800">Nama Siswa</th>
                <th className="py-3 px-4 border border-slate-800">Kelas</th>
                <th className="py-3 px-4 border border-slate-800">Kontak Siswa / Orang Tua</th>
                <th className="py-3 px-4 border border-slate-800">Alamat</th>
                <th className="py-3 px-4 border border-slate-800 text-center w-36">Status</th>
                <th className="py-3 px-4 border border-slate-800 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada siswa ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => {
                  const cls = classes.find((c) => c.id === std.kelasId);
                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-600 text-center border-r border-slate-200">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 border-r border-slate-200">
                        <button
                          onClick={() => onSelectStudent(std.id)}
                          className="hover:text-blue-600 hover:underline text-left text-sm"
                        >
                          {std.nama}
                        </button>
                        <p className="text-[11px] text-slate-500 font-normal">
                          {std.jenisKelamin} • Gabung: {std.tanggalBergabung}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 border-r border-slate-200">
                        <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 font-bold">
                          {cls ? cls.nama : std.kelasId.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{std.noHp}</div>
                        <div className="text-[11px] text-slate-500">
                          Ortu: {std.orangTua.namaAyah} ({std.orangTua.noHpAyah})
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 border-r border-slate-200 max-w-xs truncate">
                        {std.alamat}
                      </td>
                      <td className="py-3 px-4 text-center border-r border-slate-200">
                        <select
                          value={std.status}
                          onChange={(e) =>
                            onUpdateStatus(std.id, e.target.value as StudentStatus)
                          }
                          className="text-[11px] font-bold rounded-lg border border-slate-300 px-2 py-1 bg-white text-slate-800"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Cuti">Cuti</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onSelectStudent(std.id)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs inline-flex items-center gap-1 transition-colors"
                        >
                          <span>Profil</span>
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
