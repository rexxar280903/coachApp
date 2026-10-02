import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Menangkap error render agar aplikasi tidak menjadi layar putih.
 * Data tersimpan di server (Supabase), jadi memuat ulang halaman tidak menghilangkan data.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Terjadi kesalahan</h1>
            <p className="text-xs text-slate-500 mt-1">
              Halaman gagal ditampilkan. Data Anda tetap tersimpan. Silakan muat ulang halaman.
            </p>
          </div>
          <pre className="text-[11px] text-left text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => window.location.assign('/dashboard')}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Ke Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }
}
