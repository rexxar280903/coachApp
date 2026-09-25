import React, { useState } from 'react';
import { ClubProfile, ClassGroup } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { Building, Settings, Plus, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

interface PengaturanViewProps {
  profile: ClubProfile;
  classes: ClassGroup[];
  onUpdateProfile: (newProfile: ClubProfile) => void;
  onUpdateClasses: (newClasses: ClassGroup[]) => void;
  onClearToZero: () => void;
  onLoadSeedData: () => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  profile,
  classes,
  onUpdateProfile,
  onUpdateClasses,
  onClearToZero,
  onLoadSeedData,
}) => {
  const [profileForm, setProfileForm] = useState<ClubProfile>(profile);
  const [classList, setClassList] = useState<ClassGroup[]>(classes);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // New Class Modal
  const [showAddClass, setShowAddClass] = useState<boolean>(false);
  const [newClassName, setNewClassName] = useState<string>('');
  const [newClassDesc, setNewClassDesc] = useState<string>('');
  const [newClassTuition, setNewClassTuition] = useState<number>(100000);
  const [newClassRegFee, setNewClassRegFee] = useState<number>(1000000);
  const [newClassCoach, setNewClassCoach] = useState<string>('Coach Baru');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    onUpdateClasses(classList);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName) return;

    const newCls: ClassGroup = {
      id: 'cls-' + Date.now(),
      nama: newClassName.toUpperCase(),
      deskripsi: newClassDesc || 'Kelas Olahraga',
      iuranBulanan: Number(newClassTuition),
      biayaPendaftaran: Number(newClassRegFee),
      pelatih: newClassCoach,
    };

    const updated = [...classList, newCls];
    setClassList(updated);
    onUpdateClasses(updated);
    setShowAddClass(false);
    setNewClassName('');
    setNewClassDesc('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            PENGATURAN KLUB
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi profil institusi olahraga, informasi kuitansi, dan kelompok kelas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onClearToZero}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 flex items-center gap-1.5 transition-colors"
            title="Hapus semua murid, transaksi, dan riwayat untuk mulai dari nol"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Mulai dari Nol (Kosongkan)</span>
          </button>
          <button
            type="button"
            onClick={onLoadSeedData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Muat data contoh demo video SportKit"
          >
            <span>Muat Data Demo</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-md animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Pengaturan klub dan kelas berhasil disimpan!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* SECTION 1: PROFIL KLUB & KUITANSI */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Profil Klub & Identitas Kuitansi Cetak</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Klub / Akademi *
              </label>
              <input
                type="text"
                required
                value={profileForm.namaKlub}
                onChange={(e) => setProfileForm({ ...profileForm, namaKlub: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Muncul di kop kuitansi resmi (misal: CLS SURABAYA)</p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Cabang Olahraga / Kategori
              </label>
              <input
                type="text"
                value={profileForm.cabangOlahraga}
                onChange={(e) => setProfileForm({ ...profileForm, cabangOlahraga: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Alamat Lengkap GOR / Lapangan *
              </label>
              <input
                type="text"
                required
                value={profileForm.alamat}
                onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Kota / Provinsi & Kode Pos *
              </label>
              <input
                type="text"
                required
                value={profileForm.kota}
                onChange={(e) => setProfileForm({ ...profileForm, kota: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No WhatsApp Admin / Helpdesk
              </label>
              <input
                type="text"
                value={profileForm.noHp}
                onChange={(e) => setProfileForm({ ...profileForm, noHp: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Klub
              </label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DAFTAR KELAS & TARIF */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Kelompok Kelas & Biaya</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowAddClass(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kelas</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {classList.map((cls, index) => (
              <div key={cls.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{cls.nama}</span>
                  <p className="text-slate-500 text-[11px]">{cls.deskripsi} • Pelatih: {cls.pelatih}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900">{formatRupiah(cls.iuranBulanan)} / bln</span>
                  <p className="text-[10px] text-slate-400">Pendaftaran: {formatRupiah(cls.biayaPendaftaran)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Semua Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Add Class Modal */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tambah Kelompok Kelas Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Definisikan kelas baru beserta tarif pendaftaran dan iuran bulanannya.
            </p>

            <form onSubmit={handleAddClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kelas *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KU-16 atau RENANG DEWASA"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Deskripsi</label>
                <input
                  type="text"
                  placeholder="Keterangan kelompok umur atau materi"
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Iuran / Bulan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={newClassTuition}
                    onChange={(e) => setNewClassTuition(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Biaya Pendaftaran (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={newClassRegFee}
                    onChange={(e) => setNewClassRegFee(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pelatih</label>
                <input
                  type="text"
                  value={newClassCoach}
                  onChange={(e) => setNewClassCoach(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
