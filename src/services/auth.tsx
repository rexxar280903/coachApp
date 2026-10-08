import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, startedInRecovery } from './supabase';
import { passwordValidationError } from '../utils/security';

export type StaffRole = 'admin' | 'coach';

export interface StaffUser {
  id: string;
  email: string;
  nama: string;
  role: StaffRole;
}

interface AuthContextValue {
  /** true selama sesi / profil sedang dimuat pertama kali. */
  loading: boolean;
  /** Staf yang sedang login (null jika belum login atau akun belum diberi peran). */
  staff: StaffUser | null;
  /** Login berhasil di Supabase Auth tetapi belum ada baris di tabel profiles. */
  noAccess: boolean;
  /** Profil staf gagal dimuat (mis. gangguan jaringan) — bukan berarti tidak punya akses. */
  profileError: string | null;
  retryProfile: () => void;
  /** Sesi berasal dari tautan reset password. */
  recovery: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function friendlyError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Email atau kata sandi salah.';
  if (/email not confirmed/i.test(message)) return 'Email belum dikonfirmasi. Periksa kotak masuk Anda.';
  if (/rate limit|too many/i.test(message)) return 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.';
  if (/password|weak/i.test(message)) return 'Kata sandi ditolak. Gunakan kata sandi unik minimal 12 karakter.';
  return 'Permintaan gagal. Periksa koneksi lalu coba lagi.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [recovery, setRecovery] = useState<boolean>(startedInRecovery);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileAttempt, setProfileAttempt] = useState<number>(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data, error }) => {
      setSession(data.session);
      if (error || !data.session) { setLoading(false); setRecovery(false); }
    }).catch(() => {
      setLoading(false);
      setRecovery(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(next);
      if (!next) {
        setStaff(null);
        setRecovery(false);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const userEmail = session?.user.email ?? '';

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setStaff(null);
    setProfileError(null);
    supabase.from('profiles').select('nama, role').eq('id', userId).maybeSingle()
      .then(
        ({ data, error }) => {
          if (cancelled) return;
          if (error) {
            setStaff(null);
            setProfileError('Tidak dapat memverifikasi akses akun. Coba lagi.');
          } else {
            const validRole = data && (data.role === 'admin' || data.role === 'coach');
            setStaff(
              validRole
                ? { id: userId, email: userEmail, nama: data.nama || userEmail, role: data.role }
                : null,
            );
          }
          setLoading(false);
        },
        (e: Error) => {
          if (cancelled) return;
          setStaff(null);
          setProfileError('Gagal terhubung ke server.');
          setLoading(false);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [userId, userEmail, session?.access_token, profileAttempt]);

  const retryProfile = useCallback(() => setProfileAttempt((n) => n + 1), []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return error ? friendlyError(error.message) : null;
    } catch { return 'Gagal terhubung ke server. Coba lagi.'; }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      setStaff(null);
      setProfileError('Logout gagal. Periksa koneksi lalu klik Keluar lagi.');
      return;
    }
    setSession(null);
    setStaff(null);
    setRecovery(false);
    setProfileError(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? friendlyError(error.message) : null;
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const validation = passwordValidationError(password);
    if (validation) return validation;
    if (!recovery || !session) return 'Sesi pemulihan tidak valid. Minta tautan baru.';
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) {
      // Revoke refresh sessions after recovery; old access JWTs expire according to Auth settings.
      const result = await supabase.auth.signOut({ scope: 'global' });
      if (result.error) return 'Kata sandi diubah, tetapi logout gagal. Coba keluar lalu masuk ulang.';
      setRecovery(false);
    }
    return error ? friendlyError(error.message) : null;
  }, [recovery, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      staff,
      noAccess: Boolean(session) && !loading && !staff && !profileError,
      profileError: session ? profileError : null,
      retryProfile,
      recovery,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [loading, staff, session, profileError, retryProfile, recovery, signIn, signOut, sendPasswordReset, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
