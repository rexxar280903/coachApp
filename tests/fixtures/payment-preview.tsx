import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PaymentModal } from '../../src/components/PaymentModal';
import { ToastProvider } from '../../src/components/Toast';
import { ManualPaymentError } from '../../src/utils/manualPayment';
import type { ManualPaymentInput } from '../../src/types/manualPayment';
import type { PaymentTransaction } from '../../src/types/sportkit';
import '../../src/index.css';

function Harness() {
  const [open, setOpen] = useState(true);
  const [calls, setCalls] = useState(0);
  const request = useRef<ManualPaymentInput | null>(null);
  return <ToastProvider>
    <main className="p-4">
      <p>Pengujian lokal dengan data sintetis; tanpa penyimpanan ke Supabase.</p>
      <p>Panggilan: {calls}. ID permintaan: {request.current?.requestId ?? 'belum dikirim'}.</p>
      <PaymentModal isOpen={open} onClose={() => setOpen(false)} siswaId="local-student" siswaNama="Siswa Uji"
        kelasNama="Kelas Uji" nominalAwal={100000} tipe="Iuran Rutin" keterangan="Iuran Uji" bulan={10} tahun={2026}
        getPeriodInfo={() => ({ status: 'belum_bayar', sisa: 100000 })} onViewReceipt={() => {}}
        onSuccess={async input => {
          const first = request.current === null;
          if (request.current && JSON.stringify(request.current) !== JSON.stringify(input)) throw new Error('Retry berubah!');
          request.current = input;
          setCalls(old => old + 1);
          await new Promise(resolve => setTimeout(resolve, 4000));
          if (first) throw new ManualPaymentError('Simulasi respons hilang. Simpan kembali dengan permintaan yang sama.', true);
          return { id: 'server-transaction', nomorKuitansi: 'INVSP-SERVER-001', siswaId: input.siswaId,
            siswaNama: 'Siswa Uji', kelasNama: 'Kelas Uji', tanggal: input.tanggal, nominal: input.nominal,
            terbilang: 'Seratus Ribu Rupiah', metodePembayaran: input.metodePembayaran, tipe: input.tipe,
            keterangan: input.keterangan ?? '', pengurusNama: '', pengurusJabatan: '', pengurusTtd: '',
          } satisfies PaymentTransaction;
        }} />
    </main>
  </ToastProvider>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
