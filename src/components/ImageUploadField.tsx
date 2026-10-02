import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { fileToCompressedDataUrl } from '../utils/image';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  /** Dipanggil dengan data URL hasil kompresi, atau undefined saat gambar dihapus. */
  onChange: (value: string | undefined) => void;
  hint?: string;
  /** Sisi terpanjang hasil kompresi (px). */
  maxDim?: number;
  /** Ganti isi kotak pratinjau saat belum ada gambar (mis. inisial nama). */
  placeholder?: React.ReactNode;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  hint = 'JPG, PNG, atau WebP. Otomatis diperkecil.',
  maxDim = 512,
  placeholder,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      onChange(await fileToCompressedDataUrl(file, { maxDim, quality: 0.85 }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="block text-xs font-semibold text-slate-700 mb-1">{label}</span>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center text-slate-400 shrink-0">
          {value ? (
            <img src={value} alt={label} className="w-full h-full object-cover" />
          ) : (
            placeholder ?? <ImagePlus className="w-5 h-5" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {busy ? 'Memproses…' : value ? 'Ganti' : 'Pilih gambar'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                title="Hapus gambar"
                aria-label="Hapus gambar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500">{hint}</p>
          {error && <p className="text-[11px] font-medium text-rose-600">{error}</p>}
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
};
