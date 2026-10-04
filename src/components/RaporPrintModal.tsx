import React from 'react';
import { createPortal } from 'react-dom';
import { ClubProfile, RaporEntry, RaporFolder, RaporTemplate, Student } from '../types/sportkit';
import { BRAND_LOGO } from '../utils/brand';
import { formatPeriode, groupRaporSections, jawabanText } from '../utils/rapor';
import { FileText, Printer, X } from 'lucide-react';

export interface RaporDocData {
  entry: RaporEntry;
  folder: RaporFolder;
  template: RaporTemplate;
  student: Student;
  kelasNama: string;
}

interface RaporPrintModalProps {
  data: RaporDocData | null;
  profile: ClubProfile;
  onClose: () => void;
}

/** Lembar rapor siap cetak (dipakai di modal cetak dan pratinjau). */
export const RaporDocument: React.FC<{ data: RaporDocData; profile: ClubProfile }> = ({ data, profile }) => {
  const { entry, folder, template, student, kelasNama } = data;
  const sections = groupRaporSections(template.items);
  const alamat = [profile.alamat, profile.kota].filter(Boolean).join(', ');

  return (
    <div className="bg-white text-slate-900 font-sans text-[11px] leading-snug">
      {/* Kop klub */}
      <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-900">
        <img
          src={profile.logoUrl || BRAND_LOGO}
          alt={`Logo ${profile.namaKlub}`}
          className="w-14 h-14 object-contain"
        />
        <div>
          <p className="text-sm font-black uppercase tracking-tight">{profile.namaKlub}</p>
          {alamat && <p className="text-slate-600">{alamat}</p>}
          {(profile.noHp || profile.email) && (
            <p className="text-slate-500">
              {profile.noHp && `Telp/WA: ${profile.noHp}`}
              {profile.noHp && profile.email && ' | '}
              {profile.email}
            </p>
          )}
        </div>
      </div>

      <h1 className="text-center text-base font-bold my-4">{folder.nama}</h1>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          ['Nama', student.nama],
          ['Kelas', kelasNama],
          ['Periode', formatPeriode(folder.awalPenilaian, folder.akhirPenilaian)],
        ].map(([label, value]) => (
          <div key={label} className="border-l-4 border-slate-900 pl-2">
            <p className="text-[10px] text-slate-500">{label}</p>
            <p className="font-bold">{value}</p>
          </div>
        ))}
      </div>

      {template.header.trim() && <p className="whitespace-pre-line mb-2">{template.header}</p>}

      <div className="space-y-4">
        {sections.map((sec, i) => {
          const rows = sec.items.filter((it) => it.tipe !== 'paragraf');
          const paragraphs = sec.items.filter((it) => it.tipe === 'paragraf');
          return (
            <div key={i} className="break-inside-avoid">
              {sec.judul && <h2 className="text-xs font-bold mb-1.5">{sec.judul}</h2>}
              {rows.length > 0 && (
                <table className="w-full border-collapse">
                  {sec.judul && (
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-slate-400 px-2 py-1 text-left font-bold">Uraian</th>
                        <th className="border border-slate-400 px-2 py-1 text-left font-bold w-2/5">Nilai</th>
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {rows.map((it) => (
                      <tr key={it.id}>
                        <td className="border border-slate-400 px-2 py-1">{it.label}</td>
                        <td className="border border-slate-400 px-2 py-1 w-2/5">
                          {jawabanText(entry.jawaban[it.id]) || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {paragraphs.map((it) => (
                <div key={it.id} className="mt-1.5">
                  <p className="font-bold">{it.label}</p>
                  <p className="whitespace-pre-line pl-3 text-slate-700">
                    {jawabanText(entry.jawaban[it.id]) || '-'}
                  </p>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {template.footer.trim() && (
        <p className="whitespace-pre-line mt-6 pt-2 border-t border-slate-200 text-slate-600">{template.footer}</p>
      )}
    </div>
  );
};

export const RaporPrintModal: React.FC<RaporPrintModalProps> = ({ data, profile, onClose }) => {
  if (!data) return null;

  const handlePrint = () => {
    // Judul dokumen menjadi nama file default saat "Simpan sebagai PDF".
    const prevTitle = document.title;
    document.title = `Rapor - ${data.student.nama} - ${data.folder.nama}`;
    window.print();
    document.title = prevTitle;
  };

  // Dirender di luar #root dengan kelas receipt-print-root agar saat dicetak hanya rapor yang tampil.
  return createPortal(
    <div className="receipt-print-root fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-4 print:static print:block print:overflow-visible print:p-0 print:bg-white print:backdrop-blur-none">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-4 print:my-0 print:border-none print:shadow-none print:rounded-none">
        <div className="bg-[#090e17] text-white px-5 py-3.5 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-xs truncate">Rapor {data.student.nama}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 sm:p-10 print:p-0">
          <RaporDocument data={data} profile={profile} />
        </div>
      </div>
    </div>,
    document.body,
  );
};
