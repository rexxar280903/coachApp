/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Workspace from './Workspace';
import { useAuth } from './services/auth';
import { isSupabaseConfigured } from './services/supabase';
import { portalLogin, PortalCredentials } from './services/storage';
import { clearPortalSession, loadPortalSession, savePortalSession } from './services/portalSession';
import { LoginView } from './views/auth/LoginView';
import { ResetPasswordView } from './views/auth/ResetPasswordView';
import { PortalLoginView } from './views/auth/PortalLoginView';
import { AuthShell } from './views/auth/AuthShell';

const FullScreenMessage: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <AuthShell title={title}>{children}</AuthShell>
);

/** Halaman portal siswa/wali: login dengan No. HP + kode akses, tanpa akun. */
const PortalGate: React.FC = () => {
  const [creds, setCreds] = useState<PortalCredentials | null>(() => loadPortalSession());

  const handleLogin = useCallback(async (hp: string, kode: string): Promise<string | null> => {
    try {
      const bundle = await portalLogin({ hp, kode });
      if (!bundle) return 'Nomor HP atau kode akses tidak cocok.';
      const next = { hp, kode };
      savePortalSession(next);
      setCreds(next);
      return null;
    } catch (e) {
      return (e as Error).message;
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearPortalSession();
    setCreds(null);
  }, []);

  if (!creds) return <PortalLoginView onLogin={handleLogin} />;
  return <Workspace key={`${creds.hp}:${creds.kode}`} mode="student" portal={creds} onLogout={handleLogout} />;
};

/** Halaman pengurus (admin / pelatih): wajib login Supabase Auth. */
const StaffGate: React.FC = () => {
  const { loading, staff, noAccess, signOut } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (noAccess) {
    return (
      <FullScreenMessage title="Akun belum diberi akses">
        <p className="text-xs text-slate-600 leading-relaxed">
          Anda berhasil masuk, tetapi akun ini belum terdaftar sebagai admin atau pelatih. Hubungi administrator klub
          untuk meminta akses.
        </p>
        <button
          onClick={signOut}
          className="w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer"
        >
          Keluar
        </button>
      </FullScreenMessage>
    );
  }

  if (!staff) {
    return pathname === '/login' ? <LoginView /> : <Navigate to="/login" replace />;
  }

  if (pathname === '/login') return <Navigate to="/" replace />;
  return <Workspace key={staff.id} mode="staff" staff={staff} onLogout={signOut} />;
};

export default function App() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/';
  const { signOut } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <FullScreenMessage title="Konfigurasi belum lengkap">
        <p className="text-xs text-slate-600 leading-relaxed">
          Variabel <span className="font-mono">VITE_SUPABASE_URL</span> dan{' '}
          <span className="font-mono">VITE_SUPABASE_ANON_KEY</span> belum diisi. Salin <span className="font-mono">.env.example</span>{' '}
          menjadi <span className="font-mono">.env</span>, isi nilainya dari Supabase → Project Settings → API, lalu jalankan
          ulang aplikasi. Panduan lengkap ada di <span className="font-mono">supabase/README.md</span>.
        </p>
      </FullScreenMessage>
    );
  }

  // Pendaftaran publik: tanpa login (tautan untuk bio Instagram / WhatsApp).
  if (pathname === '/daftar') {
    return <Workspace mode="public" onLogout={signOut} />;
  }
  if (pathname === '/portal') return <PortalGate />;
  if (pathname === '/reset-password') return <ResetPasswordView />;
  return <StaffGate />;
}
