import React, { useState } from 'react';
import { Student, ClassGroup, MonthlyDueRecord, PaymentTransaction } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { BarChart3, Clock, TrendingUp, DollarSign, Receipt, CheckCircle, AlertTriangle } from 'lucide-react';

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
  // Find all records that are partial ("belum_lunas")
  const partialDues = monthlyDues.filter((d) => d.status === 'belum_lunas');

  // Summary by class
  const classStats = classes.map((cls) => {
    const classStudents = students.filter((s) => s.kelasId === cls.id && s.status === 'Aktif');
    const classDues = monthlyDues.filter((d) => {
      const std = students.find((s) => s.id === d.siswaId);
      return std?.kelasId === cls.id;
    });

    const totalTerbayar = classDues.reduce((sum, d) => sum + (d.terbayar || 0), 0);
    const totalPiutang = classDues
      .filter((d) => d.status === 'belum_bayar' || d.status === 'belum_lunas')
      .reduce((sum, d) => sum + (d.nominal - (d.terbayar || 0)), 0);

    return {
      class: cls,
      studentCount: classStudents.length,
      totalTerbayar,
      totalPiutang,
    };
  });

  // Breakdown by payment method
  const methodStats: { [method: string]: number } = {};
  transactions.forEach((tx) => {
    methodStats[tx.metodePembayaran] = (methodStats[tx.metodePembayaran] || 0) + tx.nominal;
  });

  return (
    <div className="space-y-6">
      {mode === 'angsuran' ? (
        /* ANGSURAN VIEW */
        <>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              DATA ANGSURAN & TUNGGAKAN SISWA
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar siswa dengan status pembayaran sebagian (belum lunas) atau cicilan berjalan
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-3 px-4 border border-slate-800 w-16 text-center">No</th>
                    <th className="py-3 px-4 border border-slate-800">Nama Siswa</th>
                    <th className="py-3 px-4 border border-slate-800">Kelas</th>
                    <th className="py-3 px-4 border border-slate-800">Bulan / Periode</th>
                    <th className="py-3 px-4 border border-slate-800">Total Tagihan</th>
                    <th className="py-3 px-4 border border-slate-800">Telah Dibayar</th>
                    <th className="py-3 px-4 border border-slate-800 text-red-400">Sisa Kurang</th>
                    <th className="py-3 px-4 border border-slate-800 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {partialDues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                        <p className="font-semibold text-slate-700">Tidak ada angsuran atau tagihan sebagian.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Semua transaksi berstatus lunas penuh.</p>
                      </td>
                    </tr>
                  ) : (
                    partialDues.map((due, idx) => {
                      const student = students.find((s) => s.id === due.siswaId);
                      const cls = classes.find((c) => c.id === student?.kelasId) || classes[0];
                      const sisa = due.nominal - due.terbayar;

                      return (
                        <tr key={due.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-600 text-center border-r border-slate-200">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                            {student?.nama}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 border-r border-slate-200">
                            {cls.nama}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 border-r border-slate-200">
                            Bulan {due.bulan} / {due.tahun}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 border-r border-slate-200">
                            {formatRupiah(due.nominal)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-emerald-700 border-r border-slate-200">
                            {formatRupiah(due.terbayar)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-red-600 border-r border-slate-200">
                            {formatRupiah(sisa)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {student && (
                              <button
                                onClick={() => onOpenPaymentModal(due, student, cls)}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                LAPORAN KEUANGAN IURAN
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Ringkasan akumulasi penerimaan iuran, piutang per kelas, dan distribusi metode pembayaran
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Cetak Rekap
            </button>
          </div>

          {/* Top KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Penerimaan Iuran
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {formatRupiah(transactions.reduce((sum, t) => sum + t.nominal, 0))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Dari {transactions.length} transaksi resmi</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Piutang Belum Terbayar
              </span>
              <div className="text-2xl font-black text-red-600 mt-1">
                {formatRupiah(classStats.reduce((sum, c) => sum + c.totalPiutang, 0))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Tunggakan bulan berjalan</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Kepatuhan Pembayaran
              </span>
              <div className="text-2xl font-black text-blue-600 mt-1">
                86.4%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Rata-rata seluruh kelompok umur</p>
            </div>
          </div>

          {/* Summary By Class Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Rekapitulasi Penerimaan per Kelompok Kelas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold">
                    <th className="py-3 px-4">Nama Kelas</th>
                    <th className="py-3 px-4">Jumlah Siswa</th>
                    <th className="py-3 px-4">Iuran Terbayar</th>
                    <th className="py-3 px-4 text-red-400">Total Piutang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classStats.map((item) => (
                    <tr key={item.class.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.class.nama}
                        <span className="block text-[11px] font-normal text-slate-400">
                          {formatRupiah(item.class.iuranBulanan)} / bln
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {item.studentCount} Siswa
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {formatRupiah(item.totalTerbayar)}
                      </td>
                      <td className="py-3 px-4 font-bold text-red-600">
                        {formatRupiah(item.totalPiutang)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Breakdown by Payment Methods */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Penerimaan Berdasarkan Kanal Pembayaran</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(methodStats).map(([method, amount]) => (
                <div key={method} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-600 block">{method}</span>
                  <span className="font-black text-slate-900 text-sm block mt-1">
                    {formatRupiah(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
