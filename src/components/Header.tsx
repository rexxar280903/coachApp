import React from 'react';
import { UserRole, ClubProfile } from '../types/sportkit';
import { BRAND_LOGO, BRAND_TAGLINE } from '../utils/brand';
import { Bell, Menu, CheckCircle2, LogOut } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  /** Nama pengguna yang sedang login (staf atau siswa). */
  userName?: string;
  /** Tidak ada pada halaman publik (tanpa login). */
  onLogout?: () => void;
  clubProfile: ClubProfile;
  calonCount: number;
  pendingVerificationsCount?: number;
  onToggleSidebar: () => void;
  onNavigateCalon: () => void;
  onNavigateVerifikasi?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  userName,
  onLogout,
  clubProfile,
  calonCount,
  pendingVerificationsCount = 0,
  onToggleSidebar,
  onNavigateCalon,
  onNavigateVerifikasi,
}) => {
  return (
    <header className="bg-[#090e17] border-b border-slate-800/80 text-white px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm backdrop-blur-md">
      {/* Zone 1: Brand & Toggle */}
      <div className="flex items-center gap-3">
        {(currentRole === 'admin' || currentRole === 'coach') && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Brand Mark in Header */}
        <div className="flex items-center gap-2.5">
          <img
            src={clubProfile.logoUrl || BRAND_LOGO}
            alt={`Logo ${clubProfile.namaKlub}`}
            className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-700"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-bold text-sm tracking-tight text-white uppercase">
                {clubProfile.namaKlub}
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              {BRAND_TAGLINE}
            </p>
          </div>
        </div>
      </div>

      {/* Zone 3: Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pending Payment Verification Notification for Admin */}
        {pendingVerificationsCount > 0 && currentRole === 'admin' && onNavigateVerifikasi && (
          <button
            onClick={onNavigateVerifikasi}
            className="relative p-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-white border border-emerald-500/40 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title={`${pendingVerificationsCount} Bukti Pembayaran Siswa Menunggu Verifikasi`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="hidden md:inline text-[11px]">Verifikasi</span>
            <span className="w-4 h-4 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center font-mono">
              {pendingVerificationsCount}
            </span>
          </button>
        )}

        {/* Calon Siswa Notification Bell */}
        {calonCount > 0 && currentRole === 'admin' && (
          <button
            onClick={onNavigateCalon}
            className="relative p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
            title={`${calonCount} Calon Siswa Baru Memerlukan Verifikasi`}
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center font-mono">
              {calonCount}
            </span>
          </button>
        )}

        {/* User Profile Pill */}
        {currentRole !== 'public' && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white font-bold text-xs">
              {(userName || '?')
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <p className="font-semibold text-slate-200 leading-tight truncate max-w-[140px]">{userName || 'Pengguna'}</p>
              <p className="text-[10px] text-slate-400">
                {currentRole === 'coach' ? 'Pelatih' : currentRole === 'student' ? 'Siswa / Wali Atlet' : 'Administrator'}
              </p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="ml-1 p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                title="Keluar"
                aria-label="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
