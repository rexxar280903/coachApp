import React from 'react';
import { RaporItem, RaporJawaban } from '../types/sportkit';
import { formatTanggalRapor, RAPOR_NILAI_RENANG, RAPOR_STATUS_KELULUSAN, structuredRaporAnswer } from '../utils/rapor';

const cell = 'border border-slate-400 px-2 py-2 align-top break-words';
const PrintCheck: React.FC<{ checked: boolean }> = ({ checked }) => (
  <span className="inline-flex w-3 h-3 border border-slate-600 items-center justify-center text-[10px] font-bold leading-none" aria-label={checked ? 'Dipilih' : 'Tidak dipilih'}>
    {checked ? 'X' : ''}
  </span>
);

export const RaporMeetingTable: React.FC<{ items: RaporItem[]; jawaban: RaporJawaban }> = ({ items, jawaban }) => (
  <table className="rapor-evaluation-table w-full table-fixed border-collapse">
    <colgroup>
      <col style={{ width: '16%' }} /><col style={{ width: '37%' }} />
      <col style={{ width: '5%' }} /><col style={{ width: '5%' }} /><col style={{ width: '5%' }} />
      <col style={{ width: '32%' }} />
    </colgroup>
    <thead>
      <tr className="bg-slate-100">
        <th rowSpan={2} className={cell}>Pertemuan</th>
        <th rowSpan={2} className={cell}>Materi & Kurikulum</th>
        <th colSpan={3} className={cell}>Penilaian</th>
        <th rowSpan={2} className={cell}>Evaluasi</th>
      </tr>
      <tr className="bg-slate-100">
        {RAPOR_NILAI_RENANG.map((n) => <th key={n.kode} className="border border-slate-400 py-1 text-center" title={n.label}>{n.kode}</th>)}
      </tr>
    </thead>
    <tbody>
      {items.map((it) => {
        const [nilai = '', catatan = ''] = structuredRaporAnswer(jawaban[it.id]);
        return (
          <tr key={it.id} className="break-inside-avoid">
            <td className={`${cell} font-semibold`}>{it.label}</td>
            <td className={cell}><ul className="list-disc pl-3 space-y-1">{(it.materi ?? []).map((m, i) => <li key={i}>{m}</li>)}</ul></td>
            {RAPOR_NILAI_RENANG.map((n) => <td key={n.kode} className="border border-slate-400 py-2 text-center align-middle"><PrintCheck checked={nilai === n.kode} /></td>)}
            <td className={cell}>
              <p className="font-bold">Indikator Utama</p>
              <p>{it.indikator}</p>
              <p className="font-bold mt-2">Catatan</p>
              <p className="whitespace-pre-line">{catatan || '________________'}</p>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

export const RaporGraduationTable: React.FC<{ items: RaporItem[]; jawaban: RaporJawaban }> = ({ items, jawaban }) => (
  <table className="rapor-evaluation-table w-full table-fixed border-collapse">
    <colgroup><col style={{ width: '31%' }} /><col style={{ width: '24%' }} /><col style={{ width: '18%' }} /><col style={{ width: '27%' }} /></colgroup>
    <thead><tr className="bg-slate-100">
      {['Kategori Tingkat / Gaya', 'Status Capaian', 'Tanggal Lulus', 'Tanda Tangan Pelatih'].map((label) => <th key={label} className={cell}>{label}</th>)}
    </tr></thead>
    <tbody>{items.map((it) => {
      const [status = '', tanggal = '', pelatih = ''] = structuredRaporAnswer(jawaban[it.id]);
      return <tr key={it.id} className="break-inside-avoid">
        <td className={cell}>{it.label}</td>
        <td className={cell}>{RAPOR_STATUS_KELULUSAN.map((s) => <p key={s} className="flex items-center gap-1.5 mb-1"><PrintCheck checked={status === s} /> {s}</p>)}</td>
        <td className={`${cell} text-center`}>{status === 'Lulus' && tanggal ? formatTanggalRapor(tanggal) : '__ / __ / ____'}</td>
        <td className={`${cell} text-center`}><p className="mt-6 border-t border-slate-400 pt-1">{pelatih || 'Nama Pelatih'}</p></td>
      </tr>;
    })}</tbody>
  </table>
);

export const RaporSwimmingLegend: React.FC = () => (
  <div className="mt-4 space-y-1 break-inside-avoid">
    <p className="font-bold">Keterangan Opsi Penilaian</p>
    {RAPOR_NILAI_RENANG.map((n) => <p key={n.kode}><strong>{n.kode} ({n.label})</strong>: {n.deskripsi}</p>)}
  </div>
);
