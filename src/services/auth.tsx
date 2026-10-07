import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, startedInRecovery } from './supabase';

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
  if (/password should be at least/i.test(message)) return 'Kata sandi minimal 8 karakter.';
  return message;
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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(next);
      if (!next) {
        setStaff(null);
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
    setProfileError(null);
    supabase
      .from('profiles')
      .select('nama, role')
      .eq('id', userId)
      .maybeSingle()
      .then(
        ({ data, error }) => {
          if (cancelled) return;
          if (error) {
            setStaff(null);
            setProfileError(error.message);
          } else {
            setStaff(
              data && (data.role === 'admin' || data.role === 'coach')
                ? { id: userId, email: userEmail, nama: data.nama || userEmail, role: data.role }
                : null,
            );
          }
          setLoading(false);
        },
        (e: Error) => {
          if (cancelled) return;
          setStaff(null);
          setProfileError(e.message || 'Gagal terhubung ke server.');
          setLoading(false);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [userId, userEmail, profileAttempt]);

  const retryProfile = useCallback(() => setProfileAttempt((n) => n + 1), []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? friendlyError(error.message) : null;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setRecovery(false);
    return error ? friendlyError(error.message) : null;
  }, []);

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
