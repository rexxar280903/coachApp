import React, { useMemo, useState } from 'react';
import { Student, ClassGroup, MonthlyDueRecord, PaymentTransaction } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { MONTH_NAMES, getCurrentMonth, getCurrentYear, getYearOptions } from '../utils/constants';
import { effectiveDueStatus, findMonthlyDue } from '../utils/payments';
import { BarChart3, Clock, CheckCircle } from 'lucide-react';

interface AngsuranLaporanViewProps {
  mode: 'angsuran' | 'laporan';
  students: Student[];
  classes: ClassGroup[];
  monthlyDues: MonthlyDueRecord[];
  transactions: PaymentTransaction[];
  onOpenPaymentModal: (due: MonthlyDueRecord, student: Student, classGroup: ClassGroup) => void;
  onViewReceipt: (tx: PaymentTransaction) => void;
}

export const AngsuranLaporanView: React.FC<AngsuranLaporanViewProps> = ({
  mode,
  students,
  classes,
  monthlyDues,
  transactions,
  onOpenPaymentModal,
  onViewReceipt,
}) => {
  const [year, setYear] = useState<number>(getCurrentYear());

  const partialDues = monthlyDues
    .filter((d) => d.status === 'belum_lunas' && students.some((s) => s.id === d.siswaId))
    .sort((a, b) => b.tahun - a.tahun || b.bulan - a.bulan);

  // Bulan yang sudah jatuh tempo pada tahun terpilih (tahun berjalan: s/d bulan ini).
  const lastDueMonth = year < getCurrentYear() ? 12 : year === getCurrentYear() ? getCurrentMonth() : 0;

  const classStats = useMemo(
    () =>
      classes.map((cls) => {
        const members = students.filter((s) => s.kelasId === cls.id && s.status !== 'Calon');
        const memberIds = new Set(members.map((s) => s.id));
        const totalTerbayar = monthlyDues
          .filter((d) => d.tahun === year && memberIds.has(d.siswaId))
          .reduce((sum, d) => sum + (d.terbayar || 0), 0);

        // Tunggakan dihitung dari status efektif tiap bulan, termasuk bulan yang belum punya catatan
        // (bulan yang belum dibayar sama sekali memang tidak punya record di database).
        let totalPiutang = 0;
        for (const std of members) {
          const tarif = cls.iuranBulanan || std.iuranBulanan || 0;
          for (let bulan = 1; bulan <= lastDueMonth; bulan++) {
            const due = findMonthlyDue(monthlyDues, std.id, bulan, year);
            const status = effectiveDueStatus(std, due, bulan, year);
            if (status === 'belum_bayar') totalPiutang += due && due.nominal > 0 ? due.nominal - (due.terbayar || 0) : tarif;
            else if (status === 'belum_lunas' && due) totalPiutang += Math.max(0, due.nominal - (due.terbayar || 0));
          }
        }

        return {
          class: cls,
          studentCount: members.filter((s) => s.status === 'Aktif').length,
          totalTerbayar,
          totalPiutang,
        };
      }),
    [classes, students, monthlyDues, year, lastDueMonth],
  );

  const yearTransactions = transactions.filter((tx) => (tx.tanggal || '').startsWith(`${year}-`));
  const methodStats: { [method: string]: number } = {};
  yearTransactions.forEach((tx) => {
    methodStats[tx.metodePembayaran] = (methodStats[tx.metodePembayaran] || 0) + tx.nominal;
  });

  const totalCollected = yearTransactions.reduce((sum, tx) => sum + tx.nominal, 0);
  const grandTerbayar = classStats.reduce((sum, s) => sum + s.totalTerbayar, 0);
  const grandPiutang = classStats.reduce((sum, s) => sum + s.totalPiutang, 0);

  return (
    <div className="space-y-6">
      {mode === 'angsuran' ? (
        /* ANGSURAN VIEW */
        <>
          <div className="sports-card rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
                  Data Angsuran & Tagihan Berjalan
                </h1>
                <p className="text-xs text-slate-500">
                  Daftar siswa dengan status pembayaran sebagian (belum lunas) atau pembayaran bertahap
                </p>
              </div>
            </div>
          </div>

          <div className="sports-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Bulan / Periode</th>
                    <th className="py-3 px-4">Total Tagihan</th>
                    <th className="py-3 px-4">Telah Dibayar</th>
                    <th className="py-3 px-4 text-rose-300">Sisa Kurang</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {partialDues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                        <p className="font-semibold text-slate-700 text-sm">Tidak ada tunggakan angsuran aktif.</p>
                        <p className="text-xs text-slate-400 mt-1">Semua pembayaran yang masuk telah terlunasi penuh.</p>
                      </td>
                    </tr>
                  ) : (
                    partialDues.map((due, idx) => {
                      const std = students.find((s) => s.id === due.siswaId);
                      const cls = classes.find((c) => c.id === std?.kelasId);
                      const sisa = Math.max(0, due.nominal - (due.terbayar || 0));

                      return (
                        <tr key={due.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {std?.nama}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {cls?.nama ?? '-'}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {MONTH_NAMES[due.bulan - 1]} {due.tahun}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {formatRupiah(due.nominal)}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-600 font-bold">
                            {formatRupiah(due.terbayar || 0)}
                          </td>
                          <td className="py-3 px-4 font-mono text-rose-600 font-bold">
                            {formatRupiah(sisa)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {std && cls && (
                              <button
                                onClick={() => onOpenPaymentModal(due, std, cls)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                              >
                                Lunasi Sisa
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* LAPORAN KEUANGAN IURAN VIEW */
        <>
          <div className="sports-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
                  Laporan Rekapitulasi Kas & Iuran
                </h1>
                <p className="text-xs text-slate-500">
                  Ringkasan penerimaan dana kas, total terbayar per kelas, dan tunggakan SPP
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              Tahun:
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 font-mono cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {getYearOptions(year).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="sports-card rounded-2xl p-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Kas Masuk {year}
              </span>
              <p className="text-2xl font-display font-bold text-emerald-600 font-mono mt-2 tabular-nums">
                {formatRupiah(totalCollected)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Dari {yearTransactions.length} kuitansi resmi (semua jenis pembayaran)
              </p>
            </div>

            <div className="sports-card rounded-2xl p-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Metode Pembayaran {year}
              </span>
              <div className="mt-2 space-y-1.5 text-xs">
                {Object.entries(methodStats).length === 0 ? (
                  <p className="text-slate-400">Belum ada transaksi</p>
                ) : (
                  Object.entries(methodStats).map(([method, amount]) => (
                    <div key={method} className="flex justify-between items-center">
                      <span className="text-slate-600">{method}:</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="sports-card rounded-2xl p-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Siswa Aktif
              </span>
              <p className="text-2xl font-display font-bold text-slate-900 font-mono mt-2 tabular-nums">
                {students.filter((s) => s.status === 'Aktif').length}{' '}
                <span className="text-xs font-medium text-slate-400">Siswa</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tersebar di {classes.length} kelompok kelas aktif
              </p>
            </div>
          </div>

          {/* Summary Table by Class */}
          <div className="sports-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Rekap Iuran Rutin per Kelompok Kelas ({year})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {lastDueMonth === 0
                    ? 'Tahun ini belum berjalan, belum ada tunggakan.'
                    : `Tunggakan dihitung dari bulan bergabung s/d ${MONTH_NAMES[lastDueMonth - 1]} ${year} (bulan cuti/nonaktif tidak dihitung).`}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-semibold">
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Siswa Aktif</th>
                    <th className="py-3 px-4">Tarif SPP</th>
                    <th className="py-3 px-4 text-emerald-300">Iuran Terbayar</th>
                    <th className="py-3 px-4 text-rose-300">Tunggakan Belum Terbayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStats.map((stat) => (
                    <tr key={stat.class.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {stat.class.nama}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                        {stat.studentCount} Siswa
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {formatRupiah(stat.class.iuranBulanan)}/bln
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        {formatRupiah(stat.totalTerbayar)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-600">
                        {formatRupiah(stat.totalPiutang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {classStats.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="py-3 px-4 text-slate-900" colSpan={3}>
                        Total
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700">{formatRupiah(grandTerbayar)}</td>
                      <td className="py-3 px-4 font-mono text-rose-700">{formatRupiah(grandPiutang)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
