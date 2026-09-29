import React, { useState, useMemo } from 'react';
import { Student, ClassGroup, MonthlyDueRecord, FeeStatus, PaymentSubmission } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { Search, ChevronDown, ChevronLeft, ChevronRight, Check, Filter, Layers, CreditCard, Sparkles, Clock } from 'lucide-react';

interface IuranRutinViewProps {
  students: Student[];
  classes: ClassGroup[];
  monthlyDues: MonthlyDueRecord[];
  submissions?: PaymentSubmission[];
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
  submissions = [],
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
        return 'bg-rose-500 hover:bg-rose-600 text-white cursor-pointer';
      case 'belum_bergabung':
        return 'bg-slate-200 text-slate-400';
      case 'cuti':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const handleCellClick = (std: Student, monthNumber: number) => {
    const due = monthlyDues.find(
      (d) => d.siswaId === std.id && d.tahun === selectedYear && d.bulan === monthNumber
    );

    if (due && due.status === 'belum_bergabung') {
      alert(`Siswa ${std.nama} belum bergabung pada bulan ini.`);
      return;
    }

    if (due && due.status === 'lunas') {
      alert(`Iuran bulan ${MONTH_NAMES[monthNumber - 1]} untuk ${std.nama} sudah lunas.`);
      return;
    }

    const targetDue: MonthlyDueRecord = due || {
      id: `due-${std.id}-${selectedYear}-${monthNumber}`,
      siswaId: std.id,
      tahun: selectedYear,
      bulan: monthNumber,
      nominal: currentClass?.iuranBulanan || 100000,
      terbayar: 0,
      status: 'belum_bayar',
    };

    onOpenPaymentModal(targetDue, std, currentClass);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="sports-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CreditCard className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
                Matriks Iuran Rutin
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pantau status pembayaran iuran bulanan seluruh siswa kelas secara sekilas. Klik kotak merah untuk bayar.
            </p>
          </div>

          {/* Class and Year Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 pr-9 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nama} ({formatRupiah(cls.iuranBulanan)}/bln)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {/* Year Selector with Prev & Next */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y - 1)}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Tahun Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-mono"
              >
                {[2022, 2023, 2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSelectedYear((y) => y + 1)}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Tahun Berikutnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Search bar & Quick Statistics */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>
              Menampilkan <span className="font-bold text-slate-900 font-mono">{filteredStudents.length}</span> siswa aktif di kelas {currentClass?.nama}
            </span>
          </div>
        </div>
      </div>

      {/* Main Matrix Table */}
      <div className="sports-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4 border-r border-slate-800 w-12 text-center">No</th>
                <th className="py-3 px-4 border-r border-slate-800 min-w-[200px]">Nama Siswa</th>
                {MONTH_NAMES.map((m) => (
                  <th key={m} className="py-3 px-2 text-center border-r border-slate-800 min-w-[48px]">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    Tidak ditemukan siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-center font-mono text-slate-400 border-r border-slate-100">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 border-r border-slate-100">
                      <button
                        onClick={() => onSelectStudent(std.id)}
                        className="hover:text-emerald-600 transition-colors text-left font-semibold"
                      >
                        {std.nama}
                      </button>
                    </td>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => {
                      const due = monthlyDues.find(
                        (d) => d.siswaId === std.id && d.tahun === selectedYear && d.bulan === monthNum
                      );
                      const status: FeeStatus = due ? due.status : 'belum_bayar';
                      const sub = submissions?.find(
                        (s) => s.siswaId === std.id && s.bulan === monthNum && (!s.tahun || s.tahun === selectedYear)
                      );

                      return (
                        <td
                          key={monthNum}
                          onClick={() => handleCellClick(std, monthNum)}
                          className={`p-1 text-center border-r border-slate-100 font-mono text-[10px] font-bold transition-all relative ${
                            sub && sub.status === 'pending'
                              ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 ring-inset cursor-pointer'
                              : getCellBg(status)
                          }`}
                          title={`${std.nama} - Bulan ${MONTH_NAMES[monthNum - 1]} (${status.replace('_', ' ')})${
                            sub ? ` - Bukti: ${sub.status}` : ''
                          }`}
                        >
                          <div className="h-7 flex flex-col items-center justify-center leading-none">
                            {sub && sub.status === 'pending' ? (
                              <span className="text-[10px] font-black animate-pulse flex items-center gap-0.5">
                                ⏳
                              </span>
                            ) : (
                              <>
                                <span>
                                  {status === 'lunas' && '✓'}
                                  {status === 'belum_lunas' && '½'}
                                  {status === 'belum_bayar' && 'Rp'}
                                  {status === 'belum_bergabung' && '-'}
                                  {status === 'cuti' && 'C'}
                                </span>
                                {sub && sub.status === 'verified' && (
                                  <span className="text-[8px] opacity-80 leading-none">📎</span>
                                )}
                              </>
                            )}
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
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 shadow-xs" />
              <span className="font-semibold text-slate-800">Lunas (✓)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-500 shadow-xs" />
              <span className="font-semibold text-slate-800">Sebagian (½)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-rose-500 shadow-xs" />
              <span className="font-semibold text-slate-800">Belum Bayar (Rp)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-200" />
              <span className="font-semibold text-slate-500">Belum Bergabung (-)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-amber-400 text-slate-900 font-bold text-[10px] flex items-center justify-center animate-pulse">
                ⏳
              </span>
              <span className="font-bold text-amber-900">Ada Bukti Transfer Menunggu Verifikasi</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400">
            * Klik nama siswa untuk membuka detail profil kartu iuran individual
          </span>
        </div>
      </div>
    </div>
  );
};
