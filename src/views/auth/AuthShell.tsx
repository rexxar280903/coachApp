import React from 'react';

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10 font-sans antialiased">
    <div className="w-full max-w-sm">
      <div className="flex items-center justify-center gap-2.5 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center font-display font-black text-sm text-white shadow-sm">
          SK
        </div>
        <span className="font-display font-black text-lg tracking-tight text-slate-900 uppercase">SportKit</span>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5">
        <div>
          <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{subtitle}</p>}
        </div>
        {children}
      </div>
      {footer && <div className="mt-4 text-center text-xs text-slate-500">{footer}</div>}
    </div>
  </div>
);

export const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500';

export const primaryButtonClass =
  'w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors cursor-pointer';

export const ErrorText: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  children ? (
    <p role="alert" className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
      {children}
    </p>
  ) : null;
