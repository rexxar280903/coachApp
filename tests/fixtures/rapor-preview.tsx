import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RaporView } from '../../src/views/RaporView';
import { ToastProvider } from '../../src/components/Toast';
import { RaporDocument, RaporDocData, RaporPrintModal } from '../../src/components/RaporPrintModal';
import { RaporEntry, RaporFolder, RaporTemplate } from '../../src/types/sportkit';
import { raporTestEntry, raporTestFolder, raporTestProfile, raporTestStudent, raporTestTemplate } from './rapor-data';
import '../../src/index.css';

function Harness() {
  const [mode, setMode] = useState<'app' | 'document'>('app');
  const [templates, setTemplates] = useState<RaporTemplate[]>([]);
  const [folders, setFolders] = useState<RaporFolder[]>([]);
  const [entries, setEntries] = useState<RaporEntry[]>([]);
  const [print, setPrint] = useState<RaporDocData | null>(null);
  return <ToastProvider>
    <div className="p-4 bg-slate-200 flex gap-4 print:hidden">
      <span className="text-sm">Pengujian lokal — data sintetis, tanpa Supabase</span>
      <button onClick={() => setMode(mode === 'app' ? 'document' : 'app')} className="underline text-sm">{mode === 'app' ? 'Lihat Dokumen Terisi' : 'Kembali ke Fitur Rapor'}</button>
    </div>
    <main className="max-w-6xl mx-auto p-4 sm:p-8">
      {mode === 'app' ? <RaporView templates={templates} folders={folders} entries={entries} students={[raporTestStudent]}
        classes={[{ id: 'class-test', nama: 'Kelas Uji', deskripsi: '', pelatihIds: [], pelatih: '', iuranBulanan: 0, biayaPendaftaran: 0 }]}
        currentRole="admin" actorName="Pelatih Uji" profile={raporTestProfile}
        onSaveTemplate={(t) => setTemplates((old) => [...old.filter((x) => x.id !== t.id), t])}
        onDeleteTemplate={(id) => setTemplates((old) => old.filter((x) => x.id !== id))}
        onSaveFolder={(f) => setFolders((old) => [...old.filter((x) => x.id !== f.id), f])}
        onDeleteFolder={(id) => setFolders((old) => old.filter((x) => x.id !== id))}
        onSaveEntry={(e) => setEntries((old) => [...old.filter((x) => x.id !== e.id), e])}
        onOpenRapor={setPrint} />
        : <div className="max-w-3xl bg-white mx-auto p-8"><RaporDocument profile={raporTestProfile} data={{ template: raporTestTemplate, folder: raporTestFolder, entry: raporTestEntry, student: raporTestStudent, kelasNama: 'Kelas Uji' }} /></div>}
    </main>
    <RaporPrintModal data={print} profile={raporTestProfile} onClose={() => setPrint(null)} />
  </ToastProvider>;
}

createRoot(document.getElementById('root')!).render(<Harness />);
