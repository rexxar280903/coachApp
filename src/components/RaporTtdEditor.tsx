import React, { useRef } from 'react';
import { RaporTtd, RaporTtdSumber } from '../types/sportkit';
import { RAPOR_TTD_MAX, RAPOR_TTD_SUMBER_LABEL, newRaporId } from '../utils/rapor';
import { fileToCompressedDataUrl } from '../utils/image';
import { useToast } from './Toast';
import { ChevronLeft, ChevronRight, ImagePlus, PenLine, Plus, Trash2, X } from 'lucide-react';

const inputCls =
  'w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
const iconBtn =
  'p-1.5 rounded-lg text-slate-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';

/** Gambar TTD diperkecil agar JSON template tetap ringan (± 20–40 KB per gambar). */
const TTD_IMAGE = { maxDim: 480, quality: 0.85 };

const TtdCard: React.FC<{
  ttd: RaporTtd;
  index: number;
  total: number;
  onChange: (patch: Partial<RaporTtd>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}> = ({ ttd, index, total, onChange, onMove, onRemove }) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    try {
      onChange({ gambar: await fileToCompressedDataUrl(file, TTD_IMAGE) });
    } catch (e) {
      toast.error('Gambar tidak dapat dipakai', e instanceof Error ? e.message : undefined);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kolom {index + 1}</span>
        <div className="ml-auto flex items-center">
          <button onClick={() => onMove(-1)} disabled={index === 0} className={`${iconBtn} hover:bg-slate-100`} title="Geser ke kiri">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => onMove(1)} disabled={index === total - 1} className={`${iconBtn} hover:bg-slate-100`} title="Geser ke kanan">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={onRemove} className={`${iconBtn} hover:text-rose-600 hover:bg-rose-50`} title="Hapus kolom TTD">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>
            Jabatan / Keterangan <span className="text-rose-500">*</span>
          </label>
          <input
            value={ttd.jabatan}
            onChange={(e) => onChange({ jabatan: e.target.value })}
            placeholder="Ketua Klub"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Nama di bawah TTD</label>
          <select
            value={ttd.sumberNama}
            onChange={(e) => onChange({ sumberNama: e.target.value as RaporTtdSumber })}
            className={inputCls}
          >
            {(Object.keys(RAPOR_TTD_SUMBER_LABEL) as RaporTtdSumber[]).map((k) => (
              <option key={k} value={k}>
                {RAPOR_TTD_SUMBER_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ttd.sumberNama === 'manual' && (
        <div>
          <label className={labelCls}>Nama penanda tangan</label>
          <input
            value={ttd.nama ?? ''}
            onChange={(e) => onChange({ nama: e.target.value })}
            placeholder="Budi Santoso, S.Pd."
            className={inputCls}
          />
        </div>
      )}

      <div>
        <label className={labelCls}>Gambar tanda tangan / stempel (opsional)</label>
        <div className="flex items-center gap-3">
          <div className="w-40 h-16 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0">
            {ttd.gambar ? (
              <img src={ttd.gambar} alt={`TTD ${ttd.jabatan}`} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-[10px] text-slate-400 text-center px-2">Kosong = TTD basah setelah dicetak</span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ImagePlus className="w-3.5 h-3.5" /> {ttd.gambar ? 'Ganti Gambar' : 'Unggah Gambar'}
            </button>
            {ttd.gambar && (
              <button
                onClick={() => onChange({ gambar: undefined })}
                className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Hapus Gambar
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Gunakan foto/scan TTD berlatar putih (JPG, PNG, atau WebP). Gambar ikut tercetak di setiap rapor yang memakai template ini.
        </p>
      </div>
    </div>
  );
};

/** Pengaturan kolom tanda tangan di bagian bawah rapor. */
export const RaporTtdEditor: React.FC<{
  value: RaporTtd[];
  onChange: (next: RaporTtd[]) => void;
}> = ({ value, onChange }) => {
  const update = (id: string, patch: Partial<RaporTtd>) =>
    onChange(value.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const move = (index: number, dir: -1 | 1) => {
    const next = [...value];
    const [it] = next.splice(index, 1);
    next.splice(index + dir, 0, it);
    onChange(next);
  };
  const add = () =>
    onChange([...value, { id: newRaporId('ttd'), jabatan: '', sumberNama: 'manual' }]);

  return (
    <div className="sports-card rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <PenLine className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Tanda Tangan</p>
          <p className="text-xs text-slate-500">
            Atur siapa saja yang menandatangani rapor (maks. {RAPOR_TTD_MAX} kolom). Kota dan tanggal dicetak otomatis di atasnya.
          </p>
        </div>
      </div>

      {value.length === 0 && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">Rapor dicetak tanpa kolom tanda tangan.</p>
      )}

      {value.map((t, i) => (
        <TtdCard
          key={t.id}
          ttd={t}
          index={i}
          total={value.length}
          onChange={(patch) => update(t.id, patch)}
          onMove={(dir) => move(i, dir)}
          onRemove={() => onChange(value.filter((x) => x.id !== t.id))}
        />
      ))}

      <button
        onClick={add}
        disabled={value.length >= RAPOR_TTD_MAX}
        className="w-full rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700 text-xs font-semibold py-3 flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" /> Tambah Kolom Tanda Tangan
      </button>
    </div>
  );
};
