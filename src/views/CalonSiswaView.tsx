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
  AlertTriangle
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

  const applicants = students.filter(
    (s) =>
      s.status === 'Calon' &&
      (s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
       s.noHp.includes(searchQuery))
  );

  const handlePayClick = (applicant: Student) => {
    const cls = classes.find((c) => c.id === applicant.kelasId) || classes[0];
    onOpenApplicantPaymentModal(applicant, cls);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applicants.length) {
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
      onDeleteBulkApplicants(selectedIds);
    } else {
      selectedIds.forEach((id) => onDeleteApplicant(id));
    }
    setSelectedIds([]);
    setShowBulkDeleteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              CALON SISWA
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-xs">
              {applicants.length} Baru
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar pendaftar baru yang mendaftar mandiri via web atau datang ke loket yang belum melunasi biaya pendaftaran
          </p>
        </div>

        <button
          onClick={onNavigateNewRegistration}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Calon Baru</span>
        </button>
      </div>

      {/* Filter and Bulk Action Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Cari nama atau nomor HP calon siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 px-3.5 py-2 rounded-xl text-xs">
            <span className="font-bold text-red-800">
              {selectedIds.length} calon terpilih
            </span>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Terpilih</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold">
                <th className="py-3 px-3 border border-slate-800 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={applicants.length === 0}
                    className="text-slate-400 hover:text-white transition-colors"
                    title={selectedIds.length === applicants.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  >
                    {applicants.length > 0 && selectedIds.length === applicants.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 border border-slate-800 w-12 text-center">No</th>
                <th className="py-3 px-4 border border-slate-800">Nama Calon Siswa</th>
                <th className="py-3 px-4 border border-slate-800">Kelas</th>
                <th className="py-3 px-4 border border-slate-800">Total Pembayaran</th>
                <th className="py-3 px-4 border border-slate-800 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <UserCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-slate-700">Tidak ada antrian calon siswa saat ini.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Semua pendaftar telah terverifikasi lunas atau belum ada data calon.</p>
                  </td>
                </tr>
              ) : (
                applicants.map((app, index) => {
                  const cls = classes.find((c) => c.id === app.kelasId);
                  const isChecked = selectedIds.includes(app.id);

                  return (
                    <tr 
                      key={app.id} 
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isChecked ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <td className="py-4 px-3 text-center border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(app.id)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-3 font-bold text-slate-600 text-center border-r border-slate-200">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4 font-bold text-blue-900 border-r border-slate-200 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{app.nama}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal mt-0.5 space-y-0.5">
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{app.noHp}</span>
                            {app.orangTua.namaAyah && (
                              <span className="text-slate-400"> (Ortu: {app.orangTua.namaAyah})</span>
                            )}
                          </p>
                          <p className="flex items-center gap-1 text-[10px]">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Didaftarkan: {app.tanggalBergabung}</span>
                            {app.catatan && (
                              <span className="italic text-slate-500 truncate max-w-xs"> • "{app.catatan}"</span>
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800 border-r border-slate-200">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold inline-block">
                          {cls ? cls.nama : app.kelasId.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-black text-slate-900 border-r border-slate-200 text-sm">
                        {formatRupiah(app.totalBiayaPendaftaran)}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          (Pendaftaran + Iuran 1 Bln)
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePayClick(app)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white flex items-center justify-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all text-xs font-bold"
                            title="Proses Pembayaran & Aktivasi Siswa"
                          >
                            <span className="font-black text-xs">Rp</span>
                            <span>Aktivasi</span>
                          </button>
                          <button
                            onClick={() => setApplicantToDelete(app)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 shadow-xs hover:scale-105 active:scale-95 transition-all"
                            title="Hapus Calon Siswa"
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

      {/* Single Applicant Delete Confirmation Modal */}
      {applicantToDelete && (() => {
        const cls = classes.find((c) => c.id === applicantToDelete.kelasId);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Hapus Calon Siswa</h3>
                    <p className="text-[11px] text-slate-400 font-normal">Batalkan berkas pendaftaran</p>
                  </div>
                </div>
                <button
                  onClick={() => setApplicantToDelete(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Details box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-black text-slate-900 text-sm">{applicantToDelete.nama}</span>
                      <p className="text-[11px] text-slate-500">
                        Kelas: <span className="font-bold text-slate-700">{cls ? cls.nama : applicantToDelete.kelasId.toUpperCase()}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                      Calon Siswa
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nomor Kontak:</span>
                      <span className="font-medium text-slate-800">{applicantToDelete.noHp}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Biaya:</span>
                      <span className="font-black text-slate-900">{formatRupiah(applicantToDelete.totalBiayaPendaftaran)}</span>
                    </div>
                  </div>

                  {applicantToDelete.alamat && (
                    <div className="text-[11px] text-slate-600 pt-1">
                      <span className="text-slate-400 block text-[10px]">Alamat:</span>
                      <span className="text-slate-700">{applicantToDelete.alamat}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Konfirmasi Pembatalan Pendaftaran</p>
                    <p className="text-[11px] text-red-700 mt-0.5">
                      Apakah Anda yakin ingin menghapus data calon siswa ini? Formulir pendaftaran akan dihapus secara permanen dari antrian.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setApplicantToDelete(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSingleDelete}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Ya, Hapus Calon Siswa</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Hapus Masal Calon Siswa</h3>
                  <p className="text-[11px] text-slate-400 font-normal">Hapus beberapa berkas sekaligus</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Hapus {selectedIds.length} Calon Siswa Terpilih</p>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Apakah Anda yakin ingin menghapus sebanyak <span className="font-bold">{selectedIds.length} berkas pendaftaran calon siswa</span>?
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkDelete}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus {selectedIds.length} Calon Siswa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
