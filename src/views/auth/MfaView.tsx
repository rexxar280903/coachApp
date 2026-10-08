import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../services/auth';
import { AuthShell, ErrorText, inputClass, primaryButtonClass } from './AuthShell';

/** Dormant authenticator UI, retained for a future release; it is not routed or required for login. */
export const MfaView: React.FC = () => {
  const { signOut, retryProfile } = useAuth();
  const [factors, setFactors] = useState<{ id: string; label: string }[]>([]);
  const [factorId, setFactorId] = useState('');
  const [qr, setQr] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setError('Gagal memuat verifikasi akun. Muat ulang halaman.'); return; }
      const verified = data.totp.map((factor) => ({ id: factor.id, label: factor.friendly_name || 'Authenticator' }));
      if (!verified.length && data.all.some((factor) => factor.status === 'verified')) {
        setError('Akun menggunakan faktor selain TOTP. Hubungi administrator untuk pemulihan MFA.');
        return;
      }
      setFactors(verified);
      setFactorId(verified[0]?.id || '');
      setReady(true);
    }).catch(() => { if (!cancelled) setError('Gagal memuat verifikasi akun. Muat ulang halaman.'); });
    return () => { cancelled = true; };
  }, []);

  const enroll = async () => {
    setBusy(true);
    setError(null);
    try {
      // Clean up only this user's abandoned unverified TOTP enrollments.
      const listed = await supabase.auth.mfa.listFactors();
      if (listed.error) throw listed.error;
      if (listed.data.all.some((factor) => factor.status === 'verified')) {
        setError('Faktor MFA sudah terdaftar. Muat ulang untuk melakukan verifikasi.');
        return;
      }
      for (const factor of listed.data.all.filter((factor) => factor.status === 'unverified' && factor.factor_type === 'totp')) {
        const removed = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (removed.error) throw removed.error;
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'SportKit Authenticator', issuer: 'SportKit' });
      if (error) throw error;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(true);
    } catch { setError('Gagal menyiapkan authenticator. Periksa koneksi lalu coba lagi.'); }
    finally { setBusy(false); }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code) || !factorId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) { setError('Kode tidak valid, kedaluwarsa, atau terlalu banyak percobaan. Coba lagi.'); return; }
      setCode(''); setQr(''); setSecret('');
      retryProfile();
    } catch { setError('Gagal memverifikasi. Periksa koneksi lalu coba lagi.'); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell title="Verifikasi Dua Langkah" subtitle="Akses pengurus dilindungi kode dari aplikasi authenticator."
      footer={<button onClick={signOut} className="text-sm text-slate-500">Keluar</button>}>
      {ready && !factorId && <div className="space-y-3">
        <p className="text-xs text-slate-600">Siapkan aplikasi seperti Google Authenticator, Microsoft Authenticator, atau pengelola kata sandi yang mendukung TOTP. Simpan cadangan authenticator agar akun dapat dipulihkan.</p>
        <button onClick={enroll} disabled={busy} className={primaryButtonClass}>Siapkan authenticator</button>
      </div>}
      {enrolling && <div className="space-y-3 text-xs text-slate-600">
        <p>Pindai QR berikut dengan authenticator Anda. Rahasiakan QR dan kunci ini.</p>
        <img src={qr} alt="QR pengaturan authenticator" className="w-48 h-48 mx-auto bg-white" />
        <details><summary>Tampilkan kunci untuk pengaturan manual</summary><p className="font-mono break-all mt-2">{secret}</p></details>
      </div>}
      {factorId && <form onSubmit={verify} className="space-y-3 mt-3">
        {factors.length > 1 && <select value={factorId} onChange={(event) => setFactorId(event.target.value)} className={inputClass}>
          {factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.label}</option>)}
        </select>}
        <label htmlFor="mfa-code" className="text-xs font-semibold text-slate-700">Kode 6 digit</label>
        <input id="mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
          required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} className={inputClass} />
        <button disabled={busy || code.length !== 6} className={primaryButtonClass}>{busy ? 'Memverifikasi…' : 'Verifikasi'}</button>
      </form>}
      <ErrorText>{error}</ErrorText>
    </AuthShell>
  );
};
