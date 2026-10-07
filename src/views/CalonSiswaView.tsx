import React, { useState } from 'react';
import { Student, ClassGroup } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { 
  Search, 
  UserCheck, 
  Plus, 
  Trash2, 
  AlertCircle, 
  X, 
  CheckSquare, 
  Square,
  Phone,
  Calendar,
  AlertTriangle,
  UserPlus,
  CreditCard
} from 'lucide-react';

interface CalonSiswaViewProps {
  students: Student[];
  classes: ClassGroup[];
  onOpenApplicantPaymentModal: (student: Student, classGroup: ClassGroup) => void;
  onNavigateNewRegistration: () => void;
  onDeleteApplicant: (studentId: string) => void;
  onDeleteBulkApplicants?: (studentIds: string[]) => void;
}

export const CalonSiswaView: React.FC<CalonSiswaViewProps> = ({
  students,
  classes,
  onOpenApplicantPaymentModal,
  onNavigateNewRegistration,
  onDeleteApplicant,
  onDeleteBulkApplicants,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Deletion modal state
  const [applicantToDelete, setApplicantToDelete] = useState<Student | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

  const query = searchQuery.trim().toLowerCase();
  const applicants = students.filter(
    (s) =>
      s.status === 'Calon' &&
      (s.nama.toLowerCase().includes(query) || s.noHp.includes(query))
  );

  // Pilihan yang berlaku hanya calon yang sedang tampil (calon yang sudah diaktifkan / tersaring
  // pencarian tidak ikut terhapus walau sebelumnya dicentang).
  const visibleSelectedIds = selectedIds.filter((id) => applicants.some((a) => a.id === id));
  const allVisibleSelected = applicants.length > 0 && visibleSelectedIds.length === applicants.length;

  const handlePayClick = (applicant: Student) => {
    const cls = classes.find((c) => c.id === applicant.kelasId) || classes[0];
    if (!cls) return;
    onOpenApplicantPaymentModal(applicant, cls);
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applicants.map((a) => a.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleConfirmSingleDelete = () => {
    if (applicantToDelete) {
      onDeleteApplicant(applicantToDelete.id);
      setSelectedIds((prev) => prev.filter((id) => id !== applicantToDelete.id));
      setApplicantToDelete(null);
    }
  };

  const handleConfirmBulkDelete = () => {
    if (onDeleteBulkApplicants) {
      onDeleteBulkApplicants(visibleSelectedIds);
    } else {
      visibleSelectedIds.forEach((id) => onDeleteApplicant(id));
    }
    setSelectedIds([]);
    setShowBulkDeleteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sports-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
              Verifikasi Calon Siswa
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200 font-mono">
              {applicants.length} Menunggu
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data pendaftaran mandiri atau baru. Klik tombol "Verifikasi & Bayar" untuk mengaktifkan siswa dan menerbitkan kuitansi perdana.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateNewRegistration}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Pendaftaran Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Bulk Action Bar */}
      <div className="sports-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama atau No. HP calon siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {visibleSelectedIds.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus ({visibleSelectedIds.length}) Terpilih</span>
            </button>
          )}

          {applicants.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {allVisibleSelected ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Batal Pilih Semua</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pilih Semua</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main List */}
      <div className="sports-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-700 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Calon Siswa</th>
                <th className="py-3 px-4">Kelompok Kelas</th>
                <th className="py-3 px-4">Total Biaya Masuk</th>
                <th className="py-3 px-4">Tanggal Daftar</th>
                <th className="py-3 px-4 text-right">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">Tidak ada calon siswa menunggu verifikasi.</p>
                    <p className="text-slate-400 mt-1">Semua pendaftaran telah aktif atau belum ada formulir masuk.</p>
                  </td>
                </tr>
              ) : (
                applicants.map((app) => {
                  const isChecked = selectedIds.includes(app.id);
                  const cls = classes.find((c) => c.id === app.kelasId);

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(app.id)}
                          className="rounded border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 text-sm">{app.nama}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" />
                            {app.noHp}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Ortu: {app.orangTua?.namaAyah || app.orangTua?.namaIbu || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {cls?.nama || app.kelasId.toUpperCase()}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Iuran: {formatRupiah(cls?.iuranBulanan ?? app.iuranBulanan ?? 0)}/bln
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 font-mono tabular-nums">
                          {formatRupiah(app.totalBiayaPendaftaran)}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Termasuk pendaftaran & SPP bulan pertama
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {app.tanggalBergabung}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePayClick(app)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Verifikasi & Bayar</span>
                          </button>
                          <button
                            onClick={() => setApplicantToDelete(app)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus calon siswa"
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

      {/* Delete Single Confirmation Modal */}
      {applicantToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex overflow-y-auto p-4">
          <div className="m-auto bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-display font-bold text-slate-900 text-center mb-1">
              Hapus Data Calon Siswa?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              Data pendaftaran <span className="font-bold text-slate-800">{applicantToDelete.nama}</span> akan dihapus permanen dari sistem.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setApplicantToDelete(null)}
                className="w-1/2 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex overflow-y-auto p-4">
          <div className="m-auto bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-display font-bold text-slate-900 text-center mb-1">
              Hapus {visibleSelectedIds.length} Calon Siswa Terpilih?
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">
              Semua calon siswa yang dicentang akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="w-1/2 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmBulkDelete}
                className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Hapus Terpilih
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
