import React, { useState } from 'react';
import { Student, ClassGroup, PaymentTransaction } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { Search, UserCheck, DollarSign, Plus, ArrowRight } from 'lucide-react';

interface CalonSiswaViewProps {
  students: Student[];
  classes: ClassGroup[];
  onOpenApplicantPaymentModal: (student: Student, classGroup: ClassGroup) => void;
  onNavigateNewRegistration: () => void;
}

export const CalonSiswaView: React.FC<CalonSiswaViewProps> = ({
  students,
  classes,
  onOpenApplicantPaymentModal,
  onNavigateNewRegistration,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const applicants = students.filter(
    (s) =>
      s.status === 'Calon' &&
      s.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePayClick = (applicant: Student) => {
    const cls = classes.find((c) => c.id === applicant.kelasId) || classes[0];
    onOpenApplicantPaymentModal(applicant, cls);
  };

  return (
    <div className="space-y-6">
      {/* Header (matching video timestamp 00:51) */}
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

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Cari nama calon siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Table (matching video timestamp 00:51) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold">
                <th className="py-3 px-4 border border-slate-800 w-16 text-center">No</th>
                <th className="py-3 px-4 border border-slate-800">Nama</th>
                <th className="py-3 px-4 border border-slate-800">Kelas</th>
                <th className="py-3 px-4 border border-slate-800">Total Pembayaran</th>
                <th className="py-3 px-4 border border-slate-800 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <UserCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                    <p className="font-semibold text-slate-700">Tidak ada antrian calon siswa saat ini.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Semua pendaftar telah terverifikasi lunas.</p>
                  </td>
                </tr>
              ) : (
                applicants.map((app, index) => {
                  const cls = classes.find((c) => c.id === app.kelasId);
                  return (
                    <tr key={app.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-600 text-center border-r border-slate-200">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4 font-bold text-blue-900 border-r border-slate-200 text-sm">
                        <span>{app.nama}</span>
                        <div className="text-[11px] text-slate-400 font-normal">
                          📞 {app.noHp} • Didaftarkan: {app.tanggalBergabung}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-800 border-r border-slate-200">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold">
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
                        <button
                          onClick={() => handlePayClick(app)}
                          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white flex items-center justify-center mx-auto shadow-md hover:scale-105 active:scale-95 transition-all"
                          title="Proses Pembayaran & Aktivasi Siswa"
                        >
                          <span className="font-black text-xs">Rp</span>
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
