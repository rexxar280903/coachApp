import React, { useState } from 'react';
import { UserRole } from '../types/sportkit';
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
  PhoneCall
} from 'lucide-react';

export type ActiveNav = 
  | 'dashboard'
  | 'iuran-rutin'
  | 'iuran-insidentil'
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
  | 'pengaturan';

interface SidebarProps {
  currentNav: ActiveNav;
  onSelectNav: (nav: ActiveNav) => void;
  calonCount: number;
  currentRole: UserRole;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentNav,
  onSelectNav,
  calonCount,
  currentRole,
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0a2745] text-slate-100 flex flex-col transition-transform duration-300 ease-in-out border-r border-[#123860] lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Banner */}
        <div className="p-5 border-b border-[#133d69] bg-gradient-to-b from-[#0e355c] to-[#0a2745]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-800 p-0.5 shadow-lg border border-blue-400/30 flex items-center justify-center">
              <div className="text-center">
                <div className="text-[8px] font-black text-blue-200 tracking-wider">★★★</div>
                <div className="text-xs font-black text-white tracking-tight uppercase">SPORTKIT</div>
                <div className="text-[7px] font-bold text-sky-300 tracking-widest">CLUB</div>
              </div>
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white uppercase leading-none">
                SPORTKIT
              </h1>
              <p className="text-[10px] font-bold tracking-widest text-sky-400 uppercase mt-0.5">
                CLUB ADMINISTRATION
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ONLINE PORTAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coach Mode Notice if role is coach */}
        {currentRole === 'coach' && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-blue-900/50 border border-blue-600/40 text-[11px] text-blue-200">
            <p className="font-bold flex items-center gap-1.5 text-white">
              <CalendarCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Akses Mode Pelatih</span>
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              Hanya menu Absensi yang ditampilkan untuk pengisian sesi & rekap harian.
            </p>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 text-xs font-medium">
          {/* Admin Mode gets all menus */}
          {currentRole === 'admin' && (
            <>
              {/* Dashboard */}
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  currentNav === 'dashboard'
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-[#113963]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-sky-400" />
                <span>Dashboard</span>
              </button>

              {/* IURAN (Expandable) */}
              <div>
                <button
                  onClick={() => setOpenIuran(!openIuran)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                    currentNav.startsWith('iuran') || currentNav === 'angsuran' || currentNav === 'laporan-iuran'
                      ? 'text-white bg-[#103761] font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-[#113963]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="w-4 h-4 text-sky-400" />
                    <span>Iuran</span>
                  </div>
                  {openIuran ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {openIuran && (
                  <div className="ml-7 mt-1 space-y-1 border-l border-blue-900/60 pl-2">
                    <button
                      onClick={() => handleNavClick('iuran-rutin')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        currentNav === 'iuran-rutin'
                          ? 'bg-blue-600/90 text-white font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-blue-300" />
                      <span>Iuran Rutin</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('iuran-insidentil')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        currentNav === 'iuran-insidentil'
                          ? 'bg-blue-600/90 text-white font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5 text-blue-300" />
                      <span>Iuran Insidentil</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('angsuran')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        currentNav === 'angsuran'
                          ? 'bg-blue-600/90 text-white font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-blue-300" />
                      <span>Angsuran</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('laporan-iuran')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        currentNav === 'laporan-iuran'
                          ? 'bg-blue-600/90 text-white font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-blue-300" />
                      <span>Laporan Iuran</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SISWA (Expandable) */}
              <div>
                <button
                  onClick={() => setOpenSiswa(!openSiswa)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                    currentNav.startsWith('siswa') || currentNav === 'calon-siswa' || currentNav === 'pendaftaran-baru'
                      ? 'text-white bg-[#103761] font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-[#113963]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Siswa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {calonCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {calonCount}
                      </span>
                    )}
                    {openSiswa ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {openSiswa && (
                  <div className="ml-7 mt-1 space-y-1 border-l border-blue-900/60 pl-2">
                    <button
                      onClick={() => handleNavClick('calon-siswa')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        currentNav === 'calon-siswa'
                          ? 'bg-blue-600/90 text-white font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-3.5 h-3.5 text-blue-300" />
                        <span>Calon Siswa</span>
                      </div>
                      {calonCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {calonCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleNavClick('siswa-aktif')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        currentNav === 'siswa-aktif'
                          ? 'bg-blue-600/90 text-white font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                      }`}
                    >
                      <span>Siswa Aktif</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('siswa-cuti')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        currentNav === 'siswa-cuti'
                          ? 'bg-blue-600/90 text-white font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                      }`}
                    >
                      <span>Siswa Cuti</span>
                    </button>
                    <button
                      onClick={() => handleNavClick('siswa-nonaktif')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        currentNav === 'siswa-nonaktif'
                          ? 'bg-blue-600/90 text-white font-bold'
                          : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                      }`}
                    >
                      <span>Siswa Nonaktif</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ABSENSI (Shown for both Admin and Coach) */}
          <div>
            <button
              onClick={() => setOpenAbsensi(!openAbsensi)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
                currentNav.includes('absensi')
                  ? 'text-white bg-[#103761] font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-[#113963]'
              }`}
            >
              <div className="flex items-center gap-3">
                <CalendarCheck className="w-4 h-4 text-sky-400" />
                <span>Absensi</span>
              </div>
              {openAbsensi ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {openAbsensi && (
              <div className="ml-7 mt-1 space-y-1 border-l border-blue-900/60 pl-2">
                <button
                  onClick={() => handleNavClick('sesi-absensi')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    currentNav === 'sesi-absensi'
                      ? 'bg-blue-600/90 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-blue-300" />
                  <span>Sesi</span>
                </button>
                <button
                  onClick={() => handleNavClick('laporan-absensi')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    currentNav === 'laporan-absensi'
                      ? 'bg-blue-600/90 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-[#133f6d]'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-300" />
                  <span>Laporan Absensi</span>
                </button>
              </div>
            )}
          </div>

          {/* PENGATURAN (Admin only) */}
          {currentRole === 'admin' && (
            <button
              onClick={() => handleNavClick('pengaturan')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                currentNav === 'pengaturan'
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#113963]'
              }`}
            >
              <Settings className="w-4 h-4 text-sky-400" />
              <span>Pengaturan</span>
            </button>
          )}
        </nav>

        {/* Footer Support Info (matching video WhatsApp contact banner) */}
        <div className="p-4 border-t border-[#133d69] bg-[#071c33]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Helpdesk & Support</p>
              <p className="text-xs font-mono font-bold text-white tracking-wide">0897-2488-333</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
