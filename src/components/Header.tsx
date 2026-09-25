import React from 'react';
import { UserRole, ClubProfile } from '../types/sportkit';
import { Shield, UserCheck, Globe, RefreshCw, Bell, User, Menu } from 'lucide-react';

interface HeaderProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  clubProfile: ClubProfile;
  calonCount: number;
  onResetData: () => void;
  onToggleSidebar: () => void;
  onNavigateCalon: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  clubProfile,
  calonCount,
  onResetData,
  onToggleSidebar,
  onNavigateCalon,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand in Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-400 flex items-center justify-center font-black text-sm shadow-sm border border-blue-400/40">
            SK
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-white uppercase">
                {clubProfile.namaKlub}
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-300 border border-blue-700/50">
                Web App
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Sistem Manajemen Klub & Akademi
            </p>
          </div>
        </div>
      </div>

      {/* Center/Right: Role Switcher & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Demo Switcher */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700 text-xs">
          <button
            onClick={() => onChangeRole('admin')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              currentRole === 'admin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Akses Lengkap Admin"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Admin</span>
          </button>
          <button
            onClick={() => onChangeRole('coach')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              currentRole === 'coach'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Akses Khusus Pelatih (Hanya Absensi)"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Coach</span>
          </button>
          <button
            onClick={() => onChangeRole('public')}
            className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              currentRole === 'public'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Pendaftaran Mandiri (Bio IG/WA)"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Form Publik</span>
          </button>
        </div>

        {/* Calon Siswa Notification Badge */}
        {calonCount > 0 && currentRole === 'admin' && (
          <button
            onClick={onNavigateCalon}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={`${calonCount} Calon Siswa Baru Memerlukan Verifikasi`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              {calonCount}
            </span>
          </button>
        )}

        {/* Reset Demo Data Button */}
        <button
          onClick={onResetData}
          className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors border border-slate-700/60"
          title="Reset ke data awal video SportKit"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset Data</span>
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center text-white font-bold text-xs border border-blue-500/40">
            {currentRole === 'coach' ? 'CP' : 'AD'}
          </div>
          <div className="hidden xl:block text-left text-xs">
            <p className="font-semibold text-slate-200 leading-tight">
              {currentRole === 'coach' ? 'Coach Dimas' : 'Super Admin'}
            </p>
            <p className="text-[10px] text-slate-400">
              {currentRole === 'coach' ? 'Pelatih KU-10' : 'Club Administrator'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
