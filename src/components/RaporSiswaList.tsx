import React from 'react';
import { ClassGroup, RaporEntry, RaporFolder, RaporTemplate, Student } from '../types/sportkit';
import { RaporDocData } from './RaporPrintModal';
import { formatPeriode } from '../utils/rapor';
import { FileText, Printer } from 'lucide-react';

interface RaporSiswaListProps {
  student: Student;
  classes: ClassGroup[];
  folders: RaporFolder[];
  templates: RaporTemplate[];
  entries: RaporEntry[];
  onOpen: (data: RaporDocData) => void;
  emptyText?: string;
}

/** Daftar rapor milik satu siswa (Profil Siswa & Portal Siswa). */
export const RaporSiswaList: React.FC<RaporSiswaListProps> = ({
  student,
  classes,
  folders,
  templates,
  entries,
  onOpen,
  emptyText = 'Belum ada rapor untuk siswa ini.',
}) => {
  const items = entries
    .filter((e) => e.siswaId === student.id)
    .map((entry) => {
      const folder = folders.find((f) => f.id === entry.folderId);
      const template = folder && templates.find((t) => t.id === folder.templateId);
      if (!folder || !template) return null;
      const kelasNama = classes.find((c) => c.id === folder.kelasId)?.nama ?? '-';
      return { entry, folder, template, student, kelasNama } satisfies RaporDocData;
    })
    .filter((x): x is RaporDocData => x !== null)
    .sort((a, b) => b.folder.akhirPenilaian.localeCompare(a.folder.akhirPenilaian));

  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((d) => (
        <li key={d.entry.id}>
          <button
            onClick={() => onOpen(d)}
            className="w-full flex items-center gap-3 py-3 text-left hover:bg-slate-50 rounded-xl px-2 transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">{d.folder.nama}</p>
              <p className="text-[11px] text-slate-500">
                {d.kelasNama} · {formatPeriode(d.folder.awalPenilaian, d.folder.akhirPenilaian)}
              </p>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 shrink-0">
              <Printer className="w-3.5 h-3.5" /> Lihat / PDF
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
};
