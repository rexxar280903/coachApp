import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell, ErrorText, inputClass, primaryButtonClass } from './AuthShell';

interface PortalLoginViewProps {
  onLogin: (hp: string, kode: string) => Promise<string | null>;
}

export const PortalLoginView: React.FC<PortalLoginViewProps> = ({ onLogin }) => {
  const [hp, setHp] = useState('');
  const [kode, setKode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const err = await onLogin(hp, kode);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <AuthShell
      title="Portal Siswa & Orang Tua"
      subtitle="Masuk dengan nomor HP yang terdaftar (siswa atau orang tua) dan kode akses dari pengurus klub."
      footer={<Link to="/login" className="font-semibold text-slate-500 hover:text-emerald-700">Login pengurus</Link>}
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="hp" className="block text-xs font-semibold text-slate-700 mb-1">Nomor HP</label>
          <input
            id="hp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            className={inputClass}
            placeholder="0812 3456 7890"
          />
        </div>
        <div>
          <label htmlFor="kode" className="block text-xs font-semibold text-slate-700 mb-1">Kode akses</label>
          <input
            id="kode"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            required
            value={kode}
            onChange={(e) => setKode(e.target.value.toUpperCase())}
            className={`${inputClass} font-mono tracking-widest`}
            placeholder="8 karakter"
            maxLength={16}
          />
          <p className="text-[11px] text-slate-500 mt-1">Kode akses dikirim oleh admin klub (WhatsApp).</p>
        </div>
        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>
    </AuthShell>
  );
};
