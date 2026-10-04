import React, { useState } from 'react';
import { ClubProfile, ClassGroup } from '../types/sportkit';
import { Building, Settings, Save, CheckCircle2, Link2, Copy, Share2 } from 'lucide-react';
import { ImageUploadField } from '../components/ImageUploadField';
import { useToast } from '../components/Toast';

interface PengaturanViewProps {
  profile: ClubProfile;
  classes: ClassGroup[];
  onUpdateProfile: (newProfile: ClubProfile) => void;
  onUpdateClasses: (newClasses: ClassGroup[]) => void;
}

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  profile,
  classes,
  onUpdateProfile,
  onUpdateClasses,
}) => {
  const { toast } = useToast();
  const [profileForm, setProfileForm] = useState<ClubProfile>(profile);

  const shareLinks = [
    {
      label: 'Pendaftaran Siswa Baru (publik)',
      hint: 'Pasang di bio Instagram / kirim ke calon siswa. Pendaftar masuk ke menu Calon Siswa.',
      url: `${window.location.origin}/daftar`,
    },
    {
      label: 'Portal Siswa / Wali',
      hint: 'Wali login dengan No. HP + kode akses (lihat Profil Siswa → Biodata).',
      url: `${window.location.origin}/portal`,
    },
  ];

  const copyLink = (url: string) => {
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success('Tautan disalin', url))
      .catch(() => toast.error('Gagal menyalin', url));
  };
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profileForm);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="sports-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
              Pengaturan Sistem & Profil Klub
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi identitas resmi klub, kuitansi cetak, alamat markas, dan kontak darurat
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Pengaturan profil klub berhasil disimpan ke sistem!</span>
        </div>
      )}

      {/* Tautan untuk dibagikan */}
      <div className="sports-card rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider">Tautan untuk Dibagikan</h2>
        </div>
        {shareLinks.map((l) => (
          <div key={l.url} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800">{l.label}</p>
              <p className="text-[11px] font-mono text-emerald-700 truncate">{l.url}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{l.hint}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => copyLink(l.url)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" /> Salin
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${l.label} ${profile.namaKlub}:
${l.url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" /> WA
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Club Profile Form */}
      <form onSubmit={handleSaveProfile} className="sports-card rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="pb-3 border-b border-slate-100 flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-display font-bold text-slate-900 uppercase tracking-wider">
            Informasi Profil Klub (Dicetak pada Kuitansi)
          </h2>
        </div>

        <ImageUploadField
          label="Logo Klub"
          value={profileForm.logoUrl}
          onChange={(logoUrl) => setProfileForm({ ...profileForm, logoUrl })}
          hint="Tampil di header dan kuitansi. Disarankan persegi."
          maxDim={400}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Resmi Klub</label>
            <input
              type="text"
              required
              value={profileForm.namaKlub}
              onChange={(e) => setProfileForm({ ...profileForm, namaKlub: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cabang Olahraga</label>
            <input
              type="text"
              required
              value={profileForm.cabangOlahraga}
              onChange={(e) => setProfileForm({ ...profileForm, cabangOlahraga: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Markas / Homebase</label>
            <input
              type="text"
              required
              value={profileForm.alamat}
              onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kota Homebase</label>
            <input
              type="text"
              required
              value={profileForm.kota}
              onChange={(e) => setProfileForm({ ...profileForm, kota: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">No. Telepon / Call Center</label>
            <input
              type="text"
              required
              value={profileForm.noHp}
              onChange={(e) => setProfileForm({ ...profileForm, noHp: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp Resmi</label>
            <input
              type="text"
              required
              value={profileForm.noWhatsApp}
              onChange={(e) => setProfileForm({ ...profileForm, noWhatsApp: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-700">Rekening Tujuan Transfer Iuran</p>
            <p className="text-[11px] text-slate-500">Ditampilkan kepada siswa / wali di Portal Siswa saat mengunggah bukti transfer.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Bank</label>
            <input
              type="text"
              value={profileForm.namaBank || ''}
              onChange={(e) => setProfileForm({ ...profileForm, namaBank: e.target.value })}
              placeholder="Bank Central Asia (BCA)"
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Rekening</label>
            <input
              type="text"
              inputMode="numeric"
              value={profileForm.noRekening || ''}
              onChange={(e) => setProfileForm({ ...profileForm, noRekening: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Atas Nama</label>
            <input
              type="text"
              value={profileForm.atasNama || ''}
              onChange={(e) => setProfileForm({ ...profileForm, atasNama: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Resmi Klub</label>
            <input
              type="email"
              value={profileForm.email || ''}
              onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Profil Klub</span>
          </button>
        </div>
      </form>
    </div>
  );
};
