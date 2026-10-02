import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/auth';
import { AuthShell, ErrorText, inputClass, primaryButtonClass } from './AuthShell';

export const ResetPasswordView: React.FC = () => {
  const { recovery, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('Kata sandi minimal 8 karakter.');
    if (password !== confirm) return setError('Konfirmasi kata sandi tidak sama.');
    setBusy(true);
    const err = await updatePassword(password);
    setBusy(false);
    if (err) setError(err);
    else navigate('/', { replace: true });
  };

  if (!recovery) {
    return (
      <AuthShell
        title="Atur Ulang Kata Sandi"
        subtitle={loading ? 'Memeriksa tautan…' : 'Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru dari halaman masuk.'}
        footer={<Link to="/login" className="font-semibold text-emerald-700 hover:underline">Kembali ke halaman masuk</Link>}
      >
        {null}
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Atur Ulang Kata Sandi" subtitle="Masukkan kata sandi baru untuk akun Anda.">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label htmlFor="pw" className="block text-xs font-semibold text-slate-700 mb-1">Kata sandi baru</label>
          <input id="pw" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="pw2" className="block text-xs font-semibold text-slate-700 mb-1">Ulangi kata sandi</label>
          <input id="pw2" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
        </div>
        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Menyimpan…' : 'Simpan Kata Sandi'}
        </button>
      </form>
    </AuthShell>
  );
};
