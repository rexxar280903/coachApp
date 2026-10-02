import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../services/auth';
import { AuthShell, ErrorText, inputClass, primaryButtonClass } from './AuthShell';

export const LoginView: React.FC = () => {
  const { signIn, sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) setError(err);
  };

  const handleForgot = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Isi email Anda terlebih dahulu, lalu klik "Lupa kata sandi?".');
      return;
    }
    setBusy(true);
    const err = await sendPasswordReset(email);
    setBusy(false);
    if (err) setError(err);
    else setInfo('Jika email terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim.');
  };

  return (
    <AuthShell
      title="Masuk Pengurus"
      subtitle="Khusus admin dan pelatih klub."
      footer={
        <>
          Orang tua / siswa? <Link to="/portal" className="font-semibold text-emerald-700 hover:underline">Buka Portal Siswa</Link>
          <span className="mx-1.5">·</span>
          <Link to="/daftar" className="font-semibold text-emerald-700 hover:underline">Pendaftaran Siswa Baru</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="nama@klub.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1">Kata sandi</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <ErrorText>{error}</ErrorText>
        {info && (
          <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{info}</p>
        )}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Memproses…' : 'Masuk'}
        </button>
        <button
          type="button"
          onClick={handleForgot}
          disabled={busy}
          className="w-full text-xs font-semibold text-slate-500 hover:text-emerald-700 cursor-pointer"
        >
          Lupa kata sandi?
        </button>
      </form>
    </AuthShell>
  );
};
