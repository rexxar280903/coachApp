import React, { useState, useMemo } from 'react';
import { getCurrentYear, getCurrentMonth, getYearOptions } from '../utils/constants';
import { AttendanceSession, Student, ClassGroup } from '../types/sportkit';
import { FileSpreadsheet, Printer, ChevronDown, Check, X, Calendar, FileText } from 'lucide-react';

interface LaporanAbsensiViewProps {
  sessions: AttendanceSession[];
  students: Student[];
  classes: ClassGroup[];
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const LaporanAbsensiView: React.FC<LaporanAbsensiViewProps> = ({
  sessions,
  students,
  classes,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'ku-10');
  const [selectedYear, setSelectedYear] = useState<number>(getCurrentYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(getCurrentMonth());
  const [showCuti, setShowCuti] = useState<boolean>(false);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const monthlySessions = useMemo(() => {
    return sessions
      .filter((s) => {
        const parts = s.tanggal.split('-');
        const matchYear = Number(parts[0]) === selectedYear;
        const matchMonth = Number(parts[1]) === selectedMonth;
        const matchClass = s.kelasId === selectedClassId;
        return matchYear && matchMonth && matchClass;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [sessions, selectedYear, selectedMonth, selectedClassId]);

  const sessionDays = monthlySessions.map((s) => Number(s.tanggal.split('-')[2]));

  const classStudents = students.filter(
    (s) => s.kelasId === selectedClassId && (showCuti ? true : s.status === 'Aktif')
  );

  const handleExportCSV = () => {
    const headers = ['Nama Siswa', ...sessionDays.map((d) => `Tgl ${d}`), 'Total Hadir', '% Hadir'];
    const rows = classStudents.map((std) => {
      let presentCount = 0;
      const dayValues = monthlySessions.map((s) => {
        const isPresent = s.kehadiran[std.id] === true;
        if (isPresent) presentCount++;
        return isPresent ? 'Hadir' : 'Absen';
      });
      const pct = monthlySessions.length > 0 ? Math.round((presentCount / monthlySessions.length) * 100) : 0;
      return [std.nama, ...dayValues, presentCount, `${pct}%`];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Absensi_${currentClass?.nama || 'Kelas'}_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="sports-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
                Rekapitulasi Presensi Atlet
              </h1>
              <p className="text-xs text-slate-500">
                Laporan kehadiran siswa per sesi latihan bulanan untuk evaluasi pelatih & wali murid
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Export ke file Excel / Spreadsheet CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export CSV / Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Print atau Cetak PDF Laporan"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer pr-8"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bulan</label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer pr-8"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun</label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer pr-8"
              >
                {getYearOptions(selectedYear).map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showCuti}
                onChange={(e) => setShowCuti(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Tampilkan Siswa Cuti</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Report Table */}
      <div className="sports-card rounded-2xl overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            <span className="font-bold text-slate-900">{currentClass?.nama}</span>
            <span className="mx-2">·</span>
            <span>Periode {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</span>
            <span className="mx-2">·</span>
            <span>Total {monthlySessions.length} Sesi Latihan</span>
          </div>
          <span className="font-mono">{classStudents.length} Siswa</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4 w-12 text-center border-r border-slate-800">No</th>
                <th className="py-3 px-4 min-w-[200px] border-r border-slate-800">Nama Siswa</th>
                {sessionDays.length === 0 ? (
                  <th className="py-3 px-4 text-center text-slate-400">Tidak ada sesi latihan pada bulan ini</th>
                ) : (
                  sessionDays.map((d) => (
                    <th key={d} className="py-3 px-2 text-center border-r border-slate-800 min-w-[36px]">
                      Tgl {d}
                    </th>
                  ))
                )}
                <th className="py-3 px-4 text-center min-w-[90px] border-r border-slate-800">Hadir</th>
                <th className="py-3 px-4 text-right min-w-[90px]">% Presensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={sessionDays.length + 4} className="py-12 text-center text-slate-400">
                    Belum ada data siswa di kelas ini.
                  </td>
                </tr>
              ) : (
                classStudents.map((std, idx) => {
                  let presentCount = 0;
                  const dayElements = monthlySessions.map((session) => {
                    const isPresent = session.kehadiran[std.id] === true;
                    if (isPresent) presentCount++;
                    return (
                      <td
                        key={session.id}
                        className={`p-1 text-center border-r border-slate-100 font-bold ${
                          isPresent ? 'text-emerald-600 bg-emerald-50/40' : 'text-slate-300'
                        }`}
                      >
                        {isPresent ? '✓' : '-'}
                      </td>
                    );
                  });

                  const pct = monthlySessions.length > 0 ? Math.round((presentCount / monthlySessions.length) * 100) : 0;

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 text-center font-mono text-slate-400 border-r border-slate-100">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 border-r border-slate-100">
                        {std.nama}
                      </td>
                      {sessionDays.length === 0 ? (
                        <td className="py-2.5 px-4 text-center text-slate-400">-</td>
                      ) : (
                        dayElements
                      )}
                      <td className="py-2.5 px-4 text-center font-bold text-slate-800 font-mono border-r border-slate-100">
                        {presentCount} / {monthlySessions.length}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            pct >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : pct >= 50
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {pct}%
                        </span>
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
