import React, { useState, useMemo } from 'react';
import { Student, ClassGroup, MonthlyDueRecord, FeeStatus } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { Search, ChevronDown, Check, Filter } from 'lucide-react';

interface IuranRutinViewProps {
  students: Student[];
  classes: ClassGroup[];
  monthlyDues: MonthlyDueRecord[];
  initialClassId?: string;
  onOpenPaymentModal: (due: MonthlyDueRecord, student: Student, classGroup: ClassGroup) => void;
  onSelectStudent: (studentId: string) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

export const IuranRutinView: React.FC<IuranRutinViewProps> = ({
  students,
  classes,
  monthlyDues,
  initialClassId,
  onOpenPaymentModal,
  onSelectStudent,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || classes[0]?.id || 'ku-10');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Filter students by selected class & search query
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = s.kelasId === selectedClassId;
      const matchQuery = s.nama.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchQuery && s.status !== 'Calon';
    });
  }, [students, selectedClassId, searchQuery]);

  const getCellBg = (status: FeeStatus) => {
    switch (status) {
      case 'lunas':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'belum_lunas':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'belum_bayar':
        return 'bg-red-600 hover:bg-red-700 text-white cursor-pointer';
      case 'belum_bergabung':
        return 'bg-slate-700 text-slate-400';
      case 'cuti':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  const handleCellClick = (std: Student, monthNumber: number) => {
    const due = monthlyDues.find(
      (d) => d.siswaId === std.id && d.tahun === selectedYear && d.bulan === monthNumber
    );

    if (!due) return;

    if (due.status === 'belum_bergabung') {
      alert(`Siswa ${std.nama} belum bergabung pada bulan ini.`);
      return;
    }

    if (due.status === 'lunas') {
      alert(`Iuran bulan ${MONTH_NAMES[monthNumber - 1]} untuk ${std.nama} sudah lunas.`);
      return;
    }

    onOpenPaymentModal(due, std, currentClass);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls (matching video timestamp 02:27) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              IURAN RUTIN
            </h1>
            <p className="text-xs text-slate-500">
              Pantau status pembayaran iuran bulanan seluruh siswa kelas secara sekilas (at a glance)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
              Iuran: {formatRupiah(currentClass.iuranBulanan)} / bulan
            </span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Tahun */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun</label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Cari Nama Siswa */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cari</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nama Siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Matrix Table (matching video timestamp 02:27 - 02:46) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold">
                <th className="py-3 px-4 border border-slate-800 w-56 sticky left-0 bg-slate-900 z-10">
                  Nama Siswa ({filteredStudents.length})
                </th>
                {MONTH_NAMES.map((m) => (
                  <th key={m} className="py-3 px-1 border border-slate-800 text-center font-bold text-xs min-w-[42px]">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-xs text-slate-500">
                    Tidak ada siswa ditemukan di kelas {currentClass.nama}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                    {/* Student Name column */}
                    <td className="py-2.5 px-4 font-bold text-xs text-slate-900 border border-slate-200 sticky left-0 bg-white z-10 whitespace-nowrap">
                      <button
                        onClick={() => onSelectStudent(std.id)}
                        className="text-left hover:text-blue-600 hover:underline flex items-center justify-between w-full"
                        title="Klik untuk buka profil siswa"
                      >
                        <span>{std.nama}</span>
                      </button>
                    </td>

                    {/* 12 Months Cells */}
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => {
                      const due = monthlyDues.find(
                        (d) => d.siswaId === std.id && d.tahun === selectedYear && d.bulan === monthNum
                      );
                      const status: FeeStatus = due ? due.status : 'belum_bayar';

                      return (
                        <td
                          key={monthNum}
                          onClick={() => handleCellClick(std, monthNum)}
                          className={`p-1 border border-slate-200 text-center transition-all ${getCellBg(
                            status
                          )}`}
                          title={`${std.nama} - Bulan ${MONTH_NAMES[monthNum - 1]}: ${status}`}
                        >
                          <div className="w-full h-7 flex items-center justify-center font-bold text-[11px] select-none">
                            {status === 'lunas' && '✓'}
                            {status === 'belum_lunas' && '½'}
                            {status === 'belum_bayar' && ''}
                            {status === 'belum_bergabung' && ''}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600"></span>
            <span className="font-semibold">Lunas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-amber-500"></span>
            <span className="font-semibold">Belum Lunas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-red-600"></span>
            <span className="font-semibold">Belum Bayar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-slate-700"></span>
            <span className="font-semibold">Belum Bergabung</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-yellow-200 border border-yellow-300"></span>
            <span className="font-semibold">Cuti</span>
          </div>
        </div>
      </div>
    </div>
  );
};
