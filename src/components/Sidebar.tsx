import React, { useState } from 'react';
import { UserRole } from '../types/sportkit';
import { BRAND_NAME, BRAND_LOGO } from '../utils/brand';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  CalendarCheck, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  UserPlus, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Clock, 
  Award, 
  PhoneCall, 
  Layers, 
  ShieldCheck, 
  UserCheck,
  GraduationCap,
  Upload,
  CheckCircle2,
  ClipboardList
} from 'lucide-react';

export type ActiveNav = 
  | 'dashboard'
  | 'kelas'
  | 'pelatih'
  | 'iuran-rutin'
  | 'iuran-insidentil'
  | 'verifikasi-pembayaran'
  | 'angsuran'
  | 'laporan-iuran'
  | 'calon-siswa'
  | 'siswa-aktif'
  | 'siswa-cuti'
  | 'siswa-nonaktif'
  | 'pendaftaran-baru'
  | 'profil-siswa'
  | 'sesi-absensi'
  | 'laporan-absensi'
  | 'rapor'
  | 'student-portal'
  | 'pengaturan';

interface SidebarProps {
  currentNav: ActiveNav;
  onSelectNav: (nav: ActiveNav) => void;
  calonCount: number;
  pendingVerificationsCount?: number;
  currentRole: UserRole;
  supportPhone?: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  calonCount,
  pendingVerificationsCount = 0,
  currentRole,
  supportPhone,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [openIuran, setOpenIuran] = useState<boolean>(true);
  const [openSiswa, setOpenSiswa] = useState<boolean>(true);
  const [openAbsensi, setOpenAbsensi] = useState<boolean>(true);

  const handleNavClick = (nav: ActiveNav) => {
    onSelectNav(nav);
    onCloseMobile();
  };

  const isNavActive = (nav: ActiveNav) => currentNav === nav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="print:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`print:hidden fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#090e17] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800/80 lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-5 border-b border-slate-800/80 bg-gradient-to-b from-[#0f172a] to-[#090e17]">
          <div className="flex items-center gap-3">
            <img
              src={BRAND_LOGO}
              alt={`Logo ${BRAND_NAME}`}
              className="w-11 h-11 rounded-xl object-contain bg-white shadow-md border border-slate-700"
            />
            <div>
              <div className="flex items-center gap-1">
                <h1 className="text-sm font-display font-black tracking-tight text-white uppercase leading-none">
                  {BRAND_NAME}
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[10px] font-medium tracking-wider text-slate-400 uppercase mt-0.5">
                Les Berenang
              </p>
            </div>
          </div>
        </div>

        {/* Coach Mode Notice if role is coach */}
        {currentRole === 'coach' && (
          <div className="mx-3 mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <p className="font-semibold flex items-center gap-1.5 text-sky-400">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Akses Pelatih Aktif</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Halaman dibatasi khusus absensi, rekap kehadiran, dan pengisian rapor siswa.
            </p>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-xs font-medium">
          {/* ADMIN ROLE MENUS */}
          {currentRole === 'admin' && (
            <>
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Utama
              </div>

              {/* Dashboard */}
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                  isNavActive('dashboard')
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {isNavActive('dashboard') && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-emerald-500" />
                )}
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Dashboard</span>
              </button>

              {/* Kelompok Kelas */}
              <button
                onClick={() => handleNavClick('kelas')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                  isNavActive('kelas')
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {isNavActive('kelas') && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-emerald-500" />
                )}
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Kelompok Kelas</span>
              </button>

              {/* PELATIH */}
              <button
                onClick={() => handleNavClick('pelatih')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                  isNavActive('pelatih')
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {isNavActive('pelatih') && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-sky-500" />
                )}
                <UserCheck className="w-4 h-4 text-sky-400" />
                <span>Data Pelatih</span>
              </button>

              {/* IURAN & KEUANGAN (Expandable) */}
              <div className="pt-2">
                <button
                  onClick={() => setOpenIuran(!openIuran)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                    currentNav.startsWith('iuran') || 
                    currentNav === 'angsuran' || 
                    currentNav === 'laporan-iuran' ||
                    currentNav === 'verifikasi-pembayaran'
                      ? 'text-white font-semibold bg-slate-800/60'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>Keuangan & Iuran</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pendingVerificationsCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-mono font-black text-[10px]">
                        {pendingVerificationsCount}
                      </span>
                    )}
                    {openIuran ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </button>

                {openIuran && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-slate-800 pl-2">
                    {/* Verifikasi Pembayaran (Highlighted) */}
                    <button
                      onClick={() => handleNavClick('verifikasi-pembayaran')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        isNavActive('verifikasi-pembayaran')
                          ? 'bg-emerald-950/60 text-emerald-300 font-semibold border border-emerald-500/40'
                          : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/40 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verifikasi Bukti Bayar</span>
                      </div>
                      {pendingVerificationsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px] font-mono">
                          {pendingVerificationsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => handleNavClick('iuran-rutin')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        isNavActive('iuran-rutin')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Iuran Rutin</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('iuran-insidentil')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        isNavActive('iuran-insidentil')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>Iuran Insidentil</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('angsuran')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        isNavActive('angsuran')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Angsuran</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('laporan-iuran')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        isNavActive('laporan-iuran')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Laporan Iuran</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SISWA (Expandable) */}
              <div className="pt-2">
                <button
                  onClick={() => setOpenSiswa(!openSiswa)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                    currentNav.startsWith('siswa') || currentNav === 'calon-siswa' || currentNav === 'pendaftaran-baru' || currentNav === 'profil-siswa'
                      ? 'text-white font-semibold bg-slate-800/60'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Data Siswa</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {calonCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                        {calonCount}
                      </span>
                    )}
                    {openSiswa ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                </button>

                {openSiswa && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-slate-800 pl-2">
                    <button
                      onClick={() => handleNavClick('calon-siswa')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        isNavActive('calon-siswa')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                        <span>Calon Siswa</span>
                      </div>
                      {calonCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold font-mono">
                          {calonCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => handleNavClick('siswa-aktif')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isNavActive('siswa-aktif')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <span>Siswa Aktif</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('siswa-cuti')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isNavActive('siswa-cuti')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <span>Siswa Cuti</span>
                    </button>

                    <button
                      onClick={() => handleNavClick('siswa-nonaktif')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isNavActive('siswa-nonaktif')
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                      }`}
                    >
                      <span>Siswa Nonaktif</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ABSENSI (Shown for Admin and Coach) */}
          {(currentRole === 'admin' || currentRole === 'coach') && (
            <div className="pt-2">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Presensi
              </div>
              <button
                onClick={() => setOpenAbsensi(!openAbsensi)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${
                  currentNav.includes('absensi')
                    ? 'text-white font-semibold bg-slate-800/60'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span>Absensi Latihan</span>
                </div>
                {openAbsensi ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {openAbsensi && (
                <div className="ml-5 mt-1 space-y-0.5 border-l border-slate-800 pl-2">
                  <button
                    onClick={() => handleNavClick('sesi-absensi')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isNavActive('sesi-absensi')
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sesi Latihan</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('laporan-absensi')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isNavActive('laporan-absensi')
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rekap Absensi</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* RAPOR (Admin & Pelatih) */}
          {(currentRole === 'admin' || currentRole === 'coach') && (
            <div className="pt-2">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Penilaian
              </div>
              <button
                onClick={() => handleNavClick('rapor')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                  isNavActive('rapor')
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {isNavActive('rapor') && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-emerald-500" />
                )}
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <span>Rapor Siswa</span>
              </button>
            </div>
          )}

          {/* PENGATURAN (Admin only) */}
          {currentRole === 'admin' && (
            <div className="pt-2">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Sistem
              </div>
              <button
                onClick={() => handleNavClick('pengaturan')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative ${
                  isNavActive('pengaturan')
                    ? 'bg-slate-800 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {isNavActive('pengaturan') && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-emerald-500" />
                )}
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Pengaturan Klub</span>
              </button>
            </div>
          )}
        </nav>

        {/* Footer Support Info */}
        <div className="p-3 border-t border-slate-800/80 bg-[#060a12]">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <PhoneCall className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] text-slate-400 uppercase font-semibold truncate">Bantuan & WhatsApp</p>
              <p className="text-xs font-mono font-bold text-slate-200 tracking-tight truncate">{supportPhone || '-'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
