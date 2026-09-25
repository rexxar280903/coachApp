import React, { useState, useMemo } from 'react';
import { AttendanceSession, Student, ClassGroup } from '../types/sportkit';
import { FileSpreadsheet, Printer, ChevronDown, Check, X, Calendar } from 'lucide-react';

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
  const [selectedClassId, setSelectedClassId] = useState<string>('ku-10');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // Default October as in video
  const [showCuti, setShowCuti] = useState<boolean>(false);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Filter sessions in this year, month, and class
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

  // Unique session days
  const sessionDays = monthlySessions.map((s) => Number(s.tanggal.split('-')[2]));

  // Active students in class
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
      `Laporan_Absensi_${currentClass.nama}_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner (matching video timestamp 03:52) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              LAPORAN ABSENSI
            </h1>
            <p className="text-xs text-slate-500">
              Rekapitulasi visual kehadiran siswa per tanggal latihan dalam satu bulan
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-colors"
              title="Export ke file Excel / Spreadsheet CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shadow-xs transition-colors"
              title="Print atau Cetak PDF Laporan"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Filters (matching video timestamp 03:53) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {/* Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 appearance-none pr-8"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama}
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
                className="w-full text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 appearance-none pr-8"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Bulan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bulan</label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 appearance-none pr-8"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Cuti filter checkbox */}
          <div className="flex items-end pb-1.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showCuti}
                onChange={(e) => setShowCuti(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>Tampilkan Siswa Cuti</span>
            </label>
          </div>
        </div>
      </div>

      {/* Grid Report (matching video timestamp 03:56 to 04:05) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {monthlySessions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-700">Tidak ada sesi latihan pada bulan ini.</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Silakan pilih bulan lain atau tambahkan sesi absensi baru melalui menu Sesi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-bold">
                  <th className="py-3 px-4 border border-slate-800 w-52 sticky left-0 bg-slate-900 z-10">
                    Nama Siswa
                  </th>
                  {sessionDays.map((day) => (
                    <th
                      key={day}
                      className="py-3 px-1 border border-slate-800 text-center w-9 min-w-[34px]"
                    >
                      {day}
                    </th>
                  ))}
                  <th className="py-3 px-3 border border-slate-800 text-center w-24">
                    Kehadiran
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {classStudents.map((std) => {
                  let presentCount = 0;
                  return (
                    <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900 border border-slate-200 sticky left-0 bg-white z-10 whitespace-nowrap">
                        {std.nama}
                      </td>

                      {monthlySessions.map((session) => {
                        const isPresent = session.kehadiran[std.id] === true;
                        if (isPresent) presentCount++;

                        return (
                          <td
                            key={session.id}
                            className={`p-1 border border-slate-200 text-center font-bold text-sm ${
                              isPresent
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-red-50 text-red-500'
                            }`}
                          >
                            <div className="w-full h-6 flex items-center justify-center">
                              {isPresent ? (
                                <Check className="w-4 h-4 stroke-[3]" />
                              ) : (
                                <X className="w-4 h-4 stroke-[3]" />
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Percentage & Count Summary */}
                      <td className="py-2 px-3 border border-slate-200 text-center font-bold text-slate-800 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px]">
                          {presentCount}/{monthlySessions.length} (
                          {Math.round((presentCount / monthlySessions.length) * 100)}%)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
