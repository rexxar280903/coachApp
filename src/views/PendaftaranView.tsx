import React, { useState } from 'react';
import { Student, ClassGroup, Gender, ParentInfo } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { CheckCircle2, UserPlus, Sparkles, ArrowLeft } from 'lucide-react';

interface PendaftaranViewProps {
  classes: ClassGroup[];
  isPublicMode?: boolean;
  initialClassId?: string;
  onRegisterSubmit: (newStudent: Student, autoPayDirectly: boolean) => void;
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
  // Form fields matching video timestamp 00:21 & 00:34
  const [nama, setNama] = useState<string>('');
  const [alamat, setAlamat] = useState<string>('');
  const [jenisKelamin, setJenisKelamin] = useState<Gender>('Laki-laki');
  const [tempatLahir, setTempatLahir] = useState<string>('Surabaya');
  const [tanggalLahir, setTanggalLahir] = useState<string>('2014-05-11');
  const [noHp, setNoHp] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');

  const [namaAyah, setNamaAyah] = useState<string>('');
  const [noHpAyah, setNoHpAyah] = useState<string>('');
  const [namaIbu, setNamaIbu] = useState<string>('');
  const [noHpIbu, setNoHpIbu] = useState<string>('');

  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId || classes[0]?.id || 'ku-10');
  const [successBanner, setSuccessBanner] = useState<boolean>(false);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const biayaPendaftaran = selectedClass?.biayaPendaftaran || 1000000;
  const iuranBulanan = selectedClass?.iuranBulanan || 100000;
  const totalBiaya = biayaPendaftaran + iuranBulanan;

  const handleSubmit = (autoPay: boolean) => {
    if (!nama.trim()) {
      alert('Silakan masukkan nama siswa terlebih dahulu.');
      return;
    }

    if (classes.length === 0 || !selectedClass) {
      alert('Belum ada kelompok kelas yang tersedia. Silakan buat kelompok kelas baru terlebih dahulu.');
      if (onNavigateKelas) onNavigateKelas();
      return;
    }

    const newStudent: Student = {
      id: 'std-' + Date.now(),
      nama: nama.trim(),
      kelasId: selectedClassId,
      jenisKelamin,
      tempatLahir,
      tanggalLahir,
      noHp: noHp || noHpAyah || '081234567890',
      email: email || `${nama.toLowerCase().replace(/\s+/g, '')}@student.club`,
      alamat: alamat || 'Surabaya',
      orangTua: {
        namaAyah: namaAyah || 'Ayah/Wali',
        noHpAyah: noHpAyah || noHp || '-',
        namaIbu: namaIbu || 'Ibu/Wali',
        noHpIbu: noHpIbu || '-',
      },
      status: autoPay ? 'Aktif' : 'Calon',
      catatan,
      tanggalBergabung: new Date().toISOString().split('T')[0],
      biayaPendaftaran,
      iuranBulanan,
      totalBiayaPendaftaran: totalBiaya,
    };

    if (isPublicMode) {
      setSuccessBanner(true);
      onRegisterSubmit(newStudent, false);
      // Reset form after delay
      setTimeout(() => {
        setNama('');
        setAlamat('');
        setNoHp('');
        setNamaAyah('');
        setNoHpAyah('');
        setNamaIbu('');
        setNoHpIbu('');
      }, 1000);
    } else {
      onRegisterSubmit(newStudent, autoPay);
    }
  };

  return (
    <div className={`max-w-3xl mx-auto space-y-6 ${isPublicMode ? 'py-8 px-4' : ''}`}>
      {/* Brand Header for Public Registration Mode (matching video timestamp 00:33) */}
      {isPublicMode && (
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-700 items-center justify-center text-white shadow-lg border border-blue-400/40 mx-auto">
            <div className="text-center">
              <div className="text-[9px] font-black text-blue-200">★★★</div>
              <div className="text-xs font-black">SPORTKIT</div>
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            Pendaftaran Baru
          </h1>
          <p className="text-xs text-slate-500">
            Formulir pendaftaran mandiri calon siswa akademi olahraga
          </p>
        </div>
      )}

      {/* Success Banner (matching video timestamp 00:43) */}
      {successBanner && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>Pendaftaran Siswa Baru Berhasil! Admin kami akan segera menghubungi Anda.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {!isPublicMode && (
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                TAMBAH SISWA
              </h2>
              <p className="text-xs text-slate-500">
                Pendaftaran siswa baru ke dalam sistem administrasi
              </p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </button>
            )}
          </div>
        )}

        {/* SECTION 1: DATA SISWA (matching video timestamp 00:21) */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3 pb-1 border-b border-slate-100">
            Data Siswa
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama *
              </label>
              <input
                type="text"
                required
                placeholder="Nama Lengkap Siswa"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat
              </label>
              <input
                type="text"
                placeholder="Alamat Domisili"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Jenis Kelamin *
              </label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as Gender)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tempat & Tanggal Lahir *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Tempat Lahir"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No HP Siswa
              </label>
              <input
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Catatan
              </label>
              <input
                type="text"
                placeholder="Riwayat penyakit / alergi / prestasi sebelumnya"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DATA ORANG TUA (matching video timestamp 00:23) */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3 pb-1 border-b border-slate-100">
            Data Orang Tua
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Ayah/Wali
              </label>
              <input
                type="text"
                placeholder="Nama Ayah/Wali"
                value={namaAyah}
                onChange={(e) => setNamaAyah(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Ibu/Wali
              </label>
              <input
                type="text"
                placeholder="Nama Ibu/Wali"
                value={namaIbu}
                onChange={(e) => setNamaIbu(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No HP Ayah/Wali
              </label>
              <input
                type="tel"
                placeholder="No HP Ayah/Wali"
                value={noHpAyah}
                onChange={(e) => setNoHpAyah(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No HP Ibu/Wali
              </label>
              <input
                type="tel"
                placeholder="No HP Ibu/Wali"
                value={noHpIbu}
                onChange={(e) => setNoHpIbu(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: KELAS & BIAYA (matching video timestamp 00:41) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-bold text-slate-800 text-sm">
              Kelas *
            </label>
            {!isPublicMode && onNavigateKelas && (
              <button
                type="button"
                onClick={onNavigateKelas}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                + Buat / Kelola Kelompok Kelas Baru
              </button>
            )}
          </div>

          {classes.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-bold">Belum ada kelompok kelas yang dibuat.</p>
                <p className="text-amber-700 text-[11px] mt-0.5">
                  Admin perlu membuat kelas terlebih dahulu untuk menentukan tarif iuran dan pelatih.
                </p>
              </div>
              {!isPublicMode && onNavigateKelas && (
                <button
                  type="button"
                  onClick={onNavigateKelas}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold whitespace-nowrap shadow-xs"
                >
                  + Buat Kelas Sekarang
                </button>
              )}
            </div>
          ) : (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nama} - {cls.deskripsi}
                </option>
              ))}
            </select>
          )}

          {/* Fee Calculation Breakdown (matching video timestamp 00:41) */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Biaya pendaftaran:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(biayaPendaftaran)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Iuran Bulanan:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(iuranBulanan)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-300 pt-2">
              <span>Total:</span>
              <span className="text-blue-900">{formatRupiah(totalBiaya)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200">
          {isPublicMode ? (
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm tracking-wide shadow-lg hover:shadow-xl transition-all"
            >
              Daftar Sekarang
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Simpan ke Calon Siswa
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md hover:shadow-lg transition-all"
              >
                Simpan & Bayar Langsung
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
