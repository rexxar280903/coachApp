import React, { useState, useEffect } from 'react';
import { getTodayISO } from '../utils/constants';
import { Student, ClassGroup, Gender, ParentInfo } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { isValidPhone } from '../utils/coaches';
import { useToast } from '../components/Toast';
import { CheckCircle2, UserPlus, Sparkles, ArrowLeft, ShieldCheck, CreditCard, Layers } from 'lucide-react';

interface PendaftaranViewProps {
  classes: ClassGroup[];
  isPublicMode?: boolean;
  initialClassId?: string;
  /** Mengembalikan false jika pendaftaran gagal (banner sukses tidak ditampilkan). */
  onRegisterSubmit: (newStudent: Student, autoPayDirectly: boolean) => void | boolean | Promise<boolean | void>;
  onCancel?: () => void;
  onNavigateKelas?: () => void;
}

export const PendaftaranView: React.FC<PendaftaranViewProps> = ({
  classes,
  isPublicMode = false,
  initialClassId,
  onRegisterSubmit,
  onCancel,
  onNavigateKelas,
}) => {
  const { toast } = useToast();
  const [nama, setNama] = useState<string>('');
  const [alamat, setAlamat] = useState<string>('');
  const [jenisKelamin, setJenisKelamin] = useState<Gender>('Laki-laki');
  const [tempatLahir, setTempatLahir] = useState<string>('');
  const [tanggalLahir, setTanggalLahir] = useState<string>('');
  const [noHp, setNoHp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  const [namaAyah, setNamaAyah] = useState<string>('');
  const [noHpAyah, setNoHpAyah] = useState<string>('');
  const [namaIbu, setNamaIbu] = useState<string>('');
  const [noHpIbu, setNoHpIbu] = useState<string>('');

  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || classes[0]?.id || '');
  const [successBanner, setSuccessBanner] = useState<boolean>(false);

  useEffect(() => {
    if (initialClassId && classes.some((c) => c.id === initialClassId)) {
      setSelectedClassId(initialClassId);
    }
  }, [initialClassId]);

  useEffect(() => {
    if (classes.length > 0 && !classes.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const biayaPendaftaran = Number(selectedClass?.biayaPendaftaran ?? 0);
  const iuranBulanan = Number(selectedClass?.iuranBulanan ?? 0);
  const totalBiaya = biayaPendaftaran + iuranBulanan;

  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (autoPay: boolean) => {
    if (!nama.trim()) {
      toast.error('Nama wajib diisi', 'Silakan masukkan nama siswa terlebih dahulu.');
      return;
    }

    if (classes.length === 0 || !selectedClass) {
      toast.error('Belum ada kelas', 'Silakan buat kelompok kelas baru terlebih dahulu.');
      if (onNavigateKelas) onNavigateKelas();
      return;
    }

    // Minimal satu nomor yang bisa dihubungi, dan semua nomor yang diisi harus valid
    const phones = [
      { label: 'No. WhatsApp siswa', value: noHp },
      { label: 'No. HP ayah', value: noHpAyah },
      { label: 'No. HP ibu', value: noHpIbu },
    ];
    if (phones.every((p) => !p.value.trim())) {
      toast.error('Nomor kontak wajib diisi', 'Isi minimal satu nomor HP siswa atau orang tua.');
      return;
    }
    const badPhone = phones.find((p) => p.value.trim() && !isValidPhone(p.value));
    if (badPhone) {
      toast.error('Nomor HP tidak valid', `${badPhone.label} harus diawali 0 / 62 / +62 lalu 8–12 digit angka.`);
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Email tidak valid', 'Periksa kembali format alamat email.');
      return;
    }

    const today = getTodayISO();
    if (!tanggalLahir) {
      toast.error('Tanggal lahir wajib diisi', 'Silakan isi tanggal lahir siswa.');
      return;
    }
    if (tanggalLahir >= today || tanggalLahir < '1950-01-01') {
      toast.error('Tanggal lahir tidak valid', 'Periksa kembali tanggal lahir siswa.');
      return;
    }

    const newStudent: Student = {
      id: 'std-' + Date.now(),
      nama: nama.trim(),
      kelasId: selectedClass.id,
      jenisKelamin,
      tempatLahir: tempatLahir.trim(),
      tanggalLahir,
      noHp: (noHp || noHpAyah || noHpIbu).trim(),
      email: email.trim() || undefined,
      alamat: alamat.trim(),
      orangTua: {
        namaAyah: namaAyah.trim() || '-',
        noHpAyah: noHpAyah.trim() || '-',
        namaIbu: namaIbu.trim() || '-',
        noHpIbu: noHpIbu.trim() || '-',
      },
      // Selalu 'Calon' dulu; baru menjadi 'Aktif' setelah pembayaran pendaftaran dicatat.
      status: 'Calon',
      catatan,
      tanggalBergabung: today,
      biayaPendaftaran,
      iuranBulanan,
      totalBiayaPendaftaran: totalBiaya,
    };

    setSubmitting(true);
    let ok: boolean | void = true;
    try {
      ok = await onRegisterSubmit(newStudent, autoPay);
    } finally {
      setSubmitting(false);
    }

    if (ok === false) return; // gagal disimpan (pesan sudah tampil): biarkan isian tetap ada
    if (isPublicMode) {
      setSuccessBanner(true);
      return;
    }
    if (!autoPay) {
      toast.success('Calon siswa tersimpan', `${newStudent.nama} masuk daftar calon siswa.`);
    }
    // Kosongkan form agar data yang sama tidak terkirim dua kali
    setNama('');
    setTempatLahir('');
    setTanggalLahir('');
    setNoHp('');
    setEmail('');
    setAlamat('');
    setCatatan('');
    setNamaAyah('');
    setNoHpAyah('');
    setNamaIbu('');
    setNoHpIbu('');
  };

  if (successBanner) {
    return (
      <div className="sports-card rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4 my-8">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-900">
          Pendaftaran Berhasil Terkirim!
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Terima kasih telah mendaftar di akademi kami. Data Anda telah masuk ke sistem pengurus dengan status <span className="font-semibold text-amber-600">Menunggu Verifikasi</span>.
        </p>
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
          <p><span className="text-slate-400 font-medium">Nama:</span> <strong className="text-slate-800">{nama}</strong></p>
          <p><span className="text-slate-400 font-medium">Kelas:</span> <strong className="text-slate-800">{selectedClass?.nama}</strong></p>
          <p><span className="text-slate-400 font-medium">Total Biaya Masuk:</span> <strong className="text-emerald-700 font-mono">{formatRupiah(totalBiaya)}</strong></p>
        </div>
        <button
          onClick={() => {
            // Data orang tua & alamat dibiarkan untuk memudahkan mendaftarkan saudara kandung.
            setSuccessBanner(false);
            setNama('');
            setTempatLahir('');
            setTanggalLahir('');
            setNoHp('');
            setEmail('');
          }}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
        >
          Daftarkan Siswa Lainnya
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="sports-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
                {isPublicMode ? 'Formulir Pendaftaran Siswa Baru' : 'Input Pendaftaran Siswa Baru'}
              </h1>
              <p className="text-xs text-slate-500">
                Lengkapi biodata siswa, pilihan kelompok kelas, dan kontak orang tua
              </p>
            </div>
          </div>

          {!isPublicMode && onCancel && (
            <button
              onClick={onCancel}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Form */}
      <div className="sports-card rounded-2xl p-6 sm:p-8 space-y-8">
        {/* Section 1: Pilihan Kelompok Kelas & Biaya */}
        <div>
          <h2 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>1. Pilihan Kelompok Kelas & Rincian Biaya</span>
          </h2>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kelompok Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.nama} — {cls.deskripsi} (Daftar: {formatRupiah(cls.biayaPendaftaran ?? 0)} | SPP: {formatRupiah(cls.iuranBulanan)}/bln)
                  </option>
                ))}
              </select>
            </div>

            {/* Fee summary breakdown */}
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 text-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-700">
                <span>Biaya Pendaftaran Awal:</span>
                <span className="font-mono font-bold">{formatRupiah(biayaPendaftaran)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700 mt-1">
                <span>Iuran SPP Perdana:</span>
                <span className="font-mono font-bold">{formatRupiah(iuranBulanan)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-emerald-200 text-emerald-900 font-bold">
                <span>Total Biaya Masuk:</span>
                <span className="font-mono text-sm">{formatRupiah(totalBiaya)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Biodata Calon Siswa */}
        <div>
          <h2 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>2. Biodata Lengkap Atlet / Siswa</span>
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Muhammad Kevin Al-Farizi"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as Gender)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                placeholder="Contoh: Surabaya"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Lahir <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                max={getTodayISO()}
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp Siswa</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08123456789"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Rumah</label>
              <input
                type="text"
                placeholder="Alamat lengkap domisili"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Siswa/Ortu</label>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Kontak Orang Tua / Wali */}
        <div>
          <h2 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>3. Informasi Kontak Orang Tua / Wali</span>
          </h2>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ayah / Wali</label>
              <input
                type="text"
                placeholder="Nama ayah"
                value={namaAyah}
                onChange={(e) => setNamaAyah(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp Ayah / Wali</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                value={noHpAyah}
                onChange={(e) => setNoHpAyah(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ibu / Wali</label>
              <input
                type="text"
                placeholder="Nama ibu"
                value={namaIbu}
                onChange={(e) => setNamaIbu(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp Ibu / Wali</label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                value={noHpIbu}
                onChange={(e) => setNoHpIbu(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
          {isPublicMode ? (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Mengirim…' : 'Kirim Formulir Pendaftaran'}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Simpan Sebagai Calon Siswa (Verifikasi Nanti)
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4" />
                <span>Simpan & Bayar Langsung (Aktifkan)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
