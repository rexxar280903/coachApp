import React, { useState } from 'react';
import { Student, ClassGroup, StudentStatus } from '../types/sportkit';
import { toWhatsAppNumber } from '../utils/kodeAkses';
import { useToast } from '../components/Toast';
import { Search, Plus, Phone, User, Edit3, Trash2, ArrowRight, MessageCircle, ChevronDown, Users, AlertTriangle } from 'lucide-react';

interface SiswaListViewProps {
  status: StudentStatus;
  students: Student[];
  classes: ClassGroup[];
  onSelectStudent: (studentId: string) => void;
  onNavigateNewRegistration: () => void;
  onUpdateStatus: (studentId: string, newStatus: StudentStatus) => void;
  onDeleteStudent?: (studentId: string) => void;
}

export const SiswaListView: React.FC<SiswaListViewProps> = ({
  status,
  students,
  classes,
  onSelectStudent,
  onNavigateNewRegistration,
  onUpdateStatus,
  onDeleteStudent,
}) => {
  const { confirm } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  const STATUS_EFFECT: Record<StudentStatus, string> = {
    Aktif: 'Iuran bulanan kembali ditagih mulai bulan ini.',
    Cuti: 'Iuran tidak ditagih selama cuti, mulai bulan ini.',
    Nonaktif: 'Iuran tidak ditagih lagi dan siswa disembunyikan dari matriks iuran.',
    Calon: '',
  };

  const handleChangeStatus = async (std: Student, next: StudentStatus) => {
    if (next === std.status) return;
    const ok = await confirm(`Ubah status menjadi ${next}?`, `${std.nama}: ${STATUS_EFFECT[next]}`);
    if (ok) onUpdateStatus(std.id, next);
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredStudents = students
    .filter((s) => {
      const matchStatus = s.status === status;
      const matchClass = selectedClassId === 'all' || s.kelasId === selectedClassId;
      const matchQuery = s.nama.toLowerCase().includes(query) || s.noHp.includes(query);
      return matchStatus && matchClass && matchQuery;
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

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
                  const waPhone = toWhatsAppNumber(std.noHp);
                  // '-' dipakai sebagai penanda "tidak diisi" pada data orang tua
                  const filled = (v?: string) => (v && v.trim() !== '-' ? v.trim() : '');
                  const ortuNama = filled(std.orangTua?.namaAyah) || filled(std.orangTua?.namaIbu) || '-';
                  const ortuHp = filled(std.orangTua?.noHpAyah) || filled(std.orangTua?.noHpIbu);

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
                          {waPhone && (
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
                          Ortu: {ortuNama}
                          {ortuHp && ` (${ortuHp})`}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {std.tanggalBergabung}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={std.status}
                          onChange={(e) => handleChangeStatus(std, e.target.value as StudentStatus)}
                          className="text-[11px] font-bold rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="Aktif">Aktif</option>
                          <option value="Cuti">Cuti</option>
                          <option value="Nonaktif">Nonaktif</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectStudent(std.id)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Buka Profil</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          {onDeleteStudent && (
                            <button
                              onClick={() => setStudentToDelete(std)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              title={`Hapus data ${std.nama}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Modal Konfirmasi Hapus Siswa */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex overflow-y-auto p-4">
          <div className="m-auto sports-card rounded-2xl max-w-md w-full p-6 space-y-4 bg-white shadow-xl animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-slate-900">
                  Hapus Data Siswa?
                </h3>
                <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-900 text-sm">{studentToDelete.nama}</p>
              <p className="text-slate-600">
                Kelas: <span className="font-semibold">{classes.find((c) => c.id === studentToDelete.kelasId)?.nama || studentToDelete.kelasId}</span> · Status: <span className="font-semibold">{studentToDelete.status}</span>
              </p>
              <p className="text-slate-500 font-mono text-[11px]">ID: {studentToDelete.id} · Kontak: {studentToDelete.noHp}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Data siswa <strong>{studentToDelete.nama}</strong> beserta riwayat iuran bulanan, absensi, rapor, dan pendaftaran event akan dihapus permanen dari sistem.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStudent && studentToDelete) {
                    onDeleteStudent(studentToDelete.id);
                  }
                  setStudentToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
