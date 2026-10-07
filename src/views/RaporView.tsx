import React, { useMemo, useState } from 'react';
import {
  ClassGroup,
  ClubProfile,
  RaporEntry,
  RaporFolder,
  RaporItem,
  RaporItemTipe,
  RaporJawaban,
  RaporTemplate,
  Student,
  UserRole,
} from '../types/sportkit';
import { useToast } from '../components/Toast';
import { RaporDocData, RaporDocument } from '../components/RaporPrintModal';
import { getCurrentTime, getCurrentYear, getTodayISO } from '../utils/constants';
import {
  RAPOR_ITEM_TIPE_LABEL,
  createSampleTemplate,
  formatPeriode,
  formatTanggalRapor,
  hasOpsi,
  missingRequired,
  newRaporId,
} from '../utils/rapor';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Circle,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  FolderOpen,
  Plus,
  Printer,
  Save,
  Trash2,
  X,
} from 'lucide-react';

interface RaporViewProps {
  templates: RaporTemplate[];
  folders: RaporFolder[];
  entries: RaporEntry[];
  students: Student[];
  classes: ClassGroup[];
  profile: ClubProfile;
  currentRole: UserRole;
  actorName: string;
  /** Tabel rapor belum ada di server (schema.sql belum dijalankan ulang). */
  unavailable?: boolean;
  onSaveTemplate: (template: RaporTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onSaveFolder: (folder: RaporFolder) => void;
  onDeleteFolder: (folderId: string) => void;
  onSaveEntry: (entry: RaporEntry) => void;
  onOpenRapor: (data: RaporDocData) => void;
}

type Screen =
  | { kind: 'list' }
  | { kind: 'template'; template: RaporTemplate; isNew: boolean }
  | { kind: 'folder'; folderId: string }
  | { kind: 'fill'; folderId: string; siswaId: string };

const inputCls =
  'w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1';
const btnPrimary =
  'px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary =
  'px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap';
const iconBtn = 'p-1.5 rounded-lg text-slate-400 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';

/** Siswa yang dinilai dalam satu folder: siswa aktif/cuti di kelas itu + siswa yang sudah punya isian. */
function folderStudents(folder: RaporFolder, students: Student[], entries: RaporEntry[]): Student[] {
  const filled = new Set(entries.filter((e) => e.folderId === folder.id).map((e) => e.siswaId));
  return students
    .filter(
      (s) =>
        filled.has(s.id) || (s.kelasId === folder.kelasId && (s.status === 'Aktif' || s.status === 'Cuti')),
    )
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));
}

export const RaporView: React.FC<RaporViewProps> = (props) => {
  const { templates, folders, entries, students, classes, profile, currentRole, unavailable } = props;
  const isAdmin = currentRole === 'admin';
  const [tab, setTab] = useState<'folder' | 'template'>('folder');
  const [screen, setScreen] = useState<Screen>({ kind: 'list' });
  const [folderModal, setFolderModal] = useState<RaporFolder | 'new' | null>(null);

  const kelasNama = (id: string) => classes.find((c) => c.id === id)?.nama ?? 'Kelas terhapus';

  if (screen.kind === 'template') {
    return (
      <TemplateEditor
        initial={screen.template}
        isNew={screen.isNew}
        profile={profile}
        onCancel={() => setScreen({ kind: 'list' })}
        onSave={(tpl) => {
          props.onSaveTemplate(tpl);
          setScreen({ kind: 'list' });
        }}
      />
    );
  }

  if (screen.kind === 'folder' || screen.kind === 'fill') {
    const folder = folders.find((f) => f.id === screen.folderId);
    const template = folder && templates.find((t) => t.id === folder.templateId);
    if (!folder || !template) {
      return (
        <div className="sports-card rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-bold text-slate-700">Folder atau template rapor tidak ditemukan.</p>
          <button onClick={() => setScreen({ kind: 'list' })} className={`${btnSecondary} mx-auto`}>
            <ChevronLeft className="w-4 h-4" /> Kembali
          </button>
        </div>
      );
    }
    const list = folderStudents(folder, students, entries);
    const toDoc = (entry: RaporEntry, student: Student): RaporDocData => ({
      entry,
      folder,
      template,
      student,
      kelasNama: kelasNama(folder.kelasId),
    });

    if (screen.kind === 'fill') {
      const idx = list.findIndex((s) => s.id === screen.siswaId);
      const student = list[idx];
      if (!student) {
        return (
          <div className="sports-card rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-bold text-slate-700">Siswa tidak ditemukan di folder ini.</p>
            <button onClick={() => setScreen({ kind: 'folder', folderId: folder.id })} className={`${btnSecondary} mx-auto`}>
              <ChevronLeft className="w-4 h-4" /> Kembali
            </button>
          </div>
        );
      }
      const next = list[idx + 1];
      return (
        <FillRapor
          key={student.id}
          folder={folder}
          template={template}
          student={student}
          kelasNama={kelasNama(folder.kelasId)}
          existing={entries.find((e) => e.folderId === folder.id && e.siswaId === student.id)}
          actorName={props.actorName}
          nextStudent={next}
          position={`${idx + 1} / ${list.length}`}
          onBack={() => setScreen({ kind: 'folder', folderId: folder.id })}
          onSave={(entry, goNext) => {
            props.onSaveEntry(entry);
            setScreen(
              goNext && next
                ? { kind: 'fill', folderId: folder.id, siswaId: next.id }
                : { kind: 'folder', folderId: folder.id },
            );
          }}
        />
      );
    }

    return (
      <FolderDetail
        folder={folder}
        template={template}
        kelasNama={kelasNama(folder.kelasId)}
        students={list}
        entries={entries.filter((e) => e.folderId === folder.id)}
        isAdmin={isAdmin}
        onBack={() => setScreen({ kind: 'list' })}
        onFill={(siswaId) => setScreen({ kind: 'fill', folderId: folder.id, siswaId })}
        onOpen={(entry, student) => props.onOpenRapor(toDoc(entry, student))}
        onTogglePublish={() => props.onSaveFolder({ ...folder, diterbitkan: !folder.diterbitkan })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="sports-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
              Rapor Siswa
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Buat blangko rapor, buka folder penilaian per kelas, lalu isi rapor tiap siswa dan cetak sebagai PDF.
          </p>
        </div>
        {isAdmin && !unavailable && (
          <button
            onClick={() =>
              tab === 'folder'
                ? setFolderModal('new')
                : setScreen({
                    kind: 'template',
                    isNew: true,
                    template: { id: newRaporId('tpl'), nama: '', header: '', items: [], footer: defaultFooter(profile) },
                  })
            }
            disabled={tab === 'folder' && templates.length === 0}
            title={tab === 'folder' && templates.length === 0 ? 'Buat template rapor terlebih dahulu' : undefined}
            className={btnPrimary}
          >
            <Plus className="w-4 h-4" />
            <span>{tab === 'folder' ? 'Folder Rapor Baru' : 'Template Rapor Baru'}</span>
          </button>
        )}
      </div>

      {unavailable && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-800 flex gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Tabel rapor belum tersedia di database. Jalankan ulang <span className="font-mono">supabase/schema.sql</span>{' '}
            di Supabase SQL Editor (aman diulang), lalu muat ulang halaman ini.
          </p>
        </div>
      )}

      {isAdmin && (
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {(['folder', 'template'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 cursor-pointer transition-all ${
                tab === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'folder' ? <FolderOpen className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {t === 'folder' ? `Folder Rapor (${folders.length})` : `Template Rapor (${templates.length})`}
            </button>
          ))}
        </div>
      )}

      {tab === 'folder' || !isAdmin ? (
        <FolderList
          folders={folders}
          templates={templates}
          students={students}
          entries={entries}
          kelasNama={kelasNama}
          isAdmin={isAdmin}
          onOpen={(id) => setScreen({ kind: 'folder', folderId: id })}
          onEdit={(f) => setFolderModal(f)}
          onDelete={props.onDeleteFolder}
        />
      ) : (
        <TemplateList
          templates={templates}
          folders={folders}
          onEdit={(t) => setScreen({ kind: 'template', template: t, isNew: false })}
          onDuplicate={(t) =>
            setScreen({
              kind: 'template',
              isNew: true,
              template: {
                ...t,
                id: newRaporId('tpl'),
                nama: `${t.nama} (Salinan)`,
                items: t.items.map((it) => ({ ...it, id: newRaporId('itm') })),
              },
            })
          }
          onDelete={props.onDeleteTemplate}
          onCreateSample={() =>
            setScreen({ kind: 'template', isNew: true, template: createSampleTemplate(defaultFooter(profile)) })
          }
        />
      )}

      {folderModal && (
        <FolderFormModal
          initial={folderModal === 'new' ? null : folderModal}
          classes={classes}
          templates={templates}
          onClose={() => setFolderModal(null)}
          onSave={(f) => {
            props.onSaveFolder(f);
            setFolderModal(null);
          }}
        />
      )}
    </div>
  );
};

const defaultFooter = (p: ClubProfile) => [p.namaKlub, [p.alamat, p.kota].filter(Boolean).join(', ')].filter(Boolean).join(' - ');

// ─── Daftar template ─────────────────────────────────────────────────────────

const TemplateList: React.FC<{
  templates: RaporTemplate[];
  folders: RaporFolder[];
  onEdit: (t: RaporTemplate) => void;
  onDuplicate: (t: RaporTemplate) => void;
  onDelete: (id: string) => void;
  onCreateSample: () => void;
}> = ({ templates, folders, onEdit, onDuplicate, onDelete, onCreateSample }) => {
  if (templates.length === 0) {
    return (
      <div className="sports-card rounded-2xl p-10 text-center space-y-3">
        <FileText className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-700">Belum ada template rapor</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Template (blangko) berisi daftar item penilaian. Satu template bisa dipakai untuk banyak kelas dan periode.
        </p>
        <button onClick={onCreateSample} className={`${btnSecondary} mx-auto`}>
          <Copy className="w-4 h-4" /> Mulai dari contoh template renang
        </button>
      </div>
    );
  }
  return (
    <div className="sports-card rounded-2xl overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
          <tr>
            <th className="text-left px-4 py-3 w-10">No</th>
            <th className="text-left px-4 py-3">Nama Template</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">Item</th>
            <th className="text-right px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {templates.map((t, i) => {
            const usedBy = folders.filter((f) => f.templateId === t.id).length;
            return (
              <tr key={t.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 text-slate-500 font-mono">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{t.nama}</p>
                  {usedBy > 0 && <p className="text-[10px] text-slate-400">Dipakai {usedBy} folder</p>}
                </td>
                <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                  {t.items.filter((it) => it.tipe !== 'judul').length} penilaian
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onDuplicate(t)}
                      className={`${iconBtn} hover:text-sky-600 hover:bg-sky-50`}
                      title="Duplikat template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(t)}
                      className={`${iconBtn} hover:text-emerald-600 hover:bg-emerald-50`}
                      title="Edit template"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(t.id)}
                      className={`${iconBtn} hover:text-rose-600 hover:bg-rose-50`}
                      title="Hapus template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Editor template ─────────────────────────────────────────────────────────

const TemplateEditor: React.FC<{
  initial: RaporTemplate;
  isNew: boolean;
  profile: ClubProfile;
  onCancel: () => void;
  onSave: (t: RaporTemplate) => void;
}> = ({ initial, isNew, profile, onCancel, onSave }) => {
  const { toast } = useToast();
  const [tpl, setTpl] = useState<RaporTemplate>(initial);
  const [preview, setPreview] = useState(false);

  const setItems = (fn: (items: RaporItem[]) => RaporItem[]) => setTpl((t) => ({ ...t, items: fn(t.items) }));
  const updateItem = (id: string, patch: Partial<RaporItem>) =>
    setItems((items) => items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const moveItem = (index: number, dir: -1 | 1) =>
    setItems((items) => {
      const next = [...items];
      const [it] = next.splice(index, 1);
      next.splice(index + dir, 0, it);
      return next;
    });
  const addItem = (tipe: RaporItemTipe) =>
    setItems((items) => [
      ...items,
      { id: newRaporId('itm'), tipe, label: '', ...(hasOpsi(tipe) ? { opsi: ['', ''] } : {}) },
    ]);

  const handleSave = () => {
    const nama = tpl.nama.trim();
    if (!nama) return toast.error('Nama template wajib diisi');
    if (tpl.items.length === 0) return toast.error('Template belum punya item penilaian');
    const items = tpl.items.map((it) => ({
      ...it,
      label: it.label.trim(),
      ...(hasOpsi(it.tipe) ? { opsi: (it.opsi ?? []).map((o) => o.trim()).filter(Boolean) } : { opsi: undefined }),
    }));
    if (items.some((it) => !it.label)) return toast.error('Setiap item wajib punya judul / pertanyaan');
    const noOpsi = items.find((it) => hasOpsi(it.tipe) && (it.opsi?.length ?? 0) === 0);
    if (noOpsi) return toast.error('Opsi belum diisi', `Item "${noOpsi.label}" membutuhkan minimal satu opsi.`);
    onSave({ ...tpl, nama, items });
  };

  const sampleDoc: RaporDocData = {
    entry: { id: 'preview', folderId: '', siswaId: '', jawaban: {}, diisiOleh: '', tanggalIsi: '' },
    folder: {
      id: '',
      nama: `Laporan Perkembangan, Semester 1, ${getCurrentYear()}`,
      awalPenilaian: getTodayISO(),
      akhirPenilaian: getTodayISO(),
      kelasId: '',
      templateId: '',
      diterbitkan: false,
    },
    template: tpl,
    student: { nama: 'Nama Siswa' } as Student,
    kelasNama: 'Nama Kelas',
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <button onClick={onCancel} className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Kembali
        </button>
        <button onClick={() => setPreview((p) => !p)} className={btnSecondary}>
          {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {preview ? 'Tutup Pratinjau' : 'Pratinjau'}
        </button>
      </div>

      <h1 className="text-xl font-display font-bold text-slate-900 uppercase">
        {isNew ? 'Tambah Template Rapor' : 'Perbarui Template Rapor'}
      </h1>

      {preview && (
        <div className="sports-card rounded-2xl p-6 sm:p-8">
          <RaporDocument data={sampleDoc} profile={profile} />
        </div>
      )}

      <div className="sports-card rounded-2xl p-5 space-y-4">
        <div>
          <label className={labelCls}>
            Nama Template <span className="text-rose-500">*</span>
          </label>
          <input
            value={tpl.nama}
            onChange={(e) => setTpl({ ...tpl, nama: e.target.value })}
            placeholder="Blangko Rapor KU-10 & KU-12"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Header</label>
          <textarea
            rows={2}
            value={tpl.header}
            onChange={(e) => setTpl({ ...tpl, header: e.target.value })}
            placeholder="Laporan Perkembangan Siswa"
            className={inputCls}
          />
          <p className="text-[10px] text-slate-400 mt-1">Tampil di bawah identitas siswa, sebelum tabel penilaian.</p>
        </div>
      </div>

      <div className="space-y-3">
        {tpl.items.map((it, i) => (
          <div
            key={it.id}
            className={`sports-card rounded-2xl p-4 space-y-3 ${it.tipe === 'judul' ? 'border-l-4 border-l-emerald-500' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 w-5">{i + 1}</span>
              <select
                value={it.tipe}
                onChange={(e) => {
                  const tipe = e.target.value as RaporItemTipe;
                  updateItem(it.id, {
                    tipe,
                    opsi: hasOpsi(tipe) ? (it.opsi?.length ? it.opsi : ['', '']) : undefined,
                    wajib: tipe === 'judul' ? undefined : it.wajib,
                  });
                }}
                className={`${inputCls} w-auto`}
              >
                {(Object.keys(RAPOR_ITEM_TIPE_LABEL) as RaporItemTipe[]).map((t) => (
                  <option key={t} value={t}>
                    {RAPOR_ITEM_TIPE_LABEL[t]}
                  </option>
                ))}
              </select>
              <div className="ml-auto flex items-center">
                <button onClick={() => moveItem(i, -1)} disabled={i === 0} className={`${iconBtn} hover:bg-slate-100`} title="Naikkan">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={i === tpl.items.length - 1}
                  className={`${iconBtn} hover:bg-slate-100`}
                  title="Turunkan"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setItems((items) => items.filter((x) => x.id !== it.id))}
                  className={`${iconBtn} hover:text-rose-600 hover:bg-rose-50`}
                  title="Hapus item"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <input
              value={it.label}
              onChange={(e) => updateItem(it.id, { label: e.target.value })}
              placeholder={it.tipe === 'judul' ? 'Judul bagian, mis. Kemampuan' : 'Uraian, mis. Tinggi Badan (cm)'}
              className={`${inputCls} ${it.tipe === 'judul' ? 'font-bold' : ''}`}
            />

            {hasOpsi(it.tipe) && (
              <div className="space-y-1.5 pl-4">
                {(it.opsi ?? []).map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    {it.tipe === 'checkbox' ? (
                      <span className="w-3 h-3 border border-slate-400 rounded-sm shrink-0" />
                    ) : it.tipe === 'pilihan' ? (
                      <Circle className="w-3 h-3 text-slate-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-slate-400 w-3 shrink-0">{oi + 1}.</span>
                    )}
                    <input
                      value={o}
                      onChange={(e) =>
                        updateItem(it.id, { opsi: (it.opsi ?? []).map((x, xi) => (xi === oi ? e.target.value : x)) })
                      }
                      placeholder={`Opsi ${oi + 1}`}
                      className={`${inputCls} py-1.5`}
                    />
                    <button
                      onClick={() => updateItem(it.id, { opsi: (it.opsi ?? []).filter((_, xi) => xi !== oi) })}
                      className={`${iconBtn} hover:text-rose-600`}
                      title="Hapus opsi"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateItem(it.id, { opsi: [...(it.opsi ?? []), ''] })}
                  className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  + Tambah Opsi
                </button>
              </div>
            )}

            {it.tipe !== 'judul' && (
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={!!it.wajib}
                  onChange={(e) => updateItem(it.id, { wajib: e.target.checked || undefined })}
                  className="accent-emerald-600"
                />
                Wajib diisi
              </label>
            )}
          </div>
        ))}

        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">Tambah item penilaian:</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(RAPOR_ITEM_TIPE_LABEL) as RaporItemTipe[]).map((t) => (
              <button
                key={t}
                onClick={() => addItem(t)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                + {RAPOR_ITEM_TIPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sports-card rounded-2xl p-5">
        <label className={labelCls}>Footer</label>
        <textarea
          rows={2}
          value={tpl.footer}
          onChange={(e) => setTpl({ ...tpl, footer: e.target.value })}
          className={inputCls}
        />
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} className={btnPrimary}>
          <Save className="w-4 h-4" /> Simpan Template
        </button>
        <button onClick={onCancel} className={btnSecondary}>
          Batal
        </button>
      </div>
    </div>
  );
};

// ─── Daftar & form folder ────────────────────────────────────────────────────

const FolderList: React.FC<{
  folders: RaporFolder[];
  templates: RaporTemplate[];
  students: Student[];
  entries: RaporEntry[];
  kelasNama: (id: string) => string;
  isAdmin: boolean;
  onOpen: (id: string) => void;
  onEdit: (f: RaporFolder) => void;
  onDelete: (id: string) => void;
}> = ({ folders, templates, students, entries, kelasNama, isAdmin, onOpen, onEdit, onDelete }) => {
  if (folders.length === 0) {
    return (
      <div className="sports-card rounded-2xl p-10 text-center space-y-2">
        <FolderOpen className="w-10 h-10 text-slate-300 mx-auto" />
        <p className="text-sm font-bold text-slate-700">Belum ada folder rapor</p>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {isAdmin
            ? templates.length === 0
              ? 'Buat template rapor dulu di tab Template Rapor, lalu buat folder untuk periode penilaian tiap kelas.'
              : 'Buat folder untuk satu periode penilaian, mis. "Laporan Perkembangan KU-10, Semester 1".'
            : 'Admin belum membuat folder rapor.'}
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {folders.map((f) => {
        const total = folderStudents(f, students, entries).length;
        const done = entries.filter((e) => e.folderId === f.id).length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <div key={f.id} className="sports-card sports-card-hover rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <button onClick={() => onOpen(f.id)} className="text-left cursor-pointer min-w-0">
                <p className="text-sm font-bold text-slate-900 leading-snug">{f.nama}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {kelasNama(f.kelasId)} · {formatPeriode(f.awalPenilaian, f.akhirPenilaian)}
                </p>
              </button>
              {isAdmin && (
                <div className="flex shrink-0">
                  <button onClick={() => onEdit(f)} className={`${iconBtn} hover:text-emerald-600 hover:bg-emerald-50`} title="Edit folder">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(f.id)} className={`${iconBtn} hover:text-rose-600 hover:bg-rose-50`} title="Hapus folder">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">Terisi</span>
                <span className="font-mono font-bold text-slate-800">
                  {done} / {total} siswa
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  f.diterbitkan
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                {f.diterbitkan ? 'Terbit di Portal' : 'Draf'}
              </span>
              <button onClick={() => onOpen(f.id)} className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer">
                Buka <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FolderFormModal: React.FC<{
  initial: RaporFolder | null;
  classes: ClassGroup[];
  templates: RaporTemplate[];
  onClose: () => void;
  onSave: (f: RaporFolder) => void;
}> = ({ initial, classes, templates, onClose, onSave }) => {
  const { toast } = useToast();
  const [f, setF] = useState<RaporFolder>(
    initial ?? {
      id: newRaporId('rpf'),
      nama: '',
      awalPenilaian: '',
      akhirPenilaian: getTodayISO(),
      kelasId: classes[0]?.id ?? '',
      templateId: templates[0]?.id ?? '',
      diterbitkan: false,
    },
  );
  const kelas = classes.find((c) => c.id === f.kelasId);
  const suggestion = `Laporan Perkembangan ${kelas?.nama ?? ''}, Semester ${new Date().getMonth() < 6 ? 2 : 1}, ${getCurrentYear()}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.nama.trim() || !f.awalPenilaian || !f.akhirPenilaian || !f.kelasId || !f.templateId) {
      return toast.error('Lengkapi semua kolom bertanda *');
    }
    if (f.awalPenilaian > f.akhirPenilaian) return toast.error('Awal penilaian harus sebelum akhir penilaian');
    onSave({ ...f, nama: f.nama.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-base font-display font-bold text-slate-900">
            {initial ? 'Perbarui Folder Rapor' : 'Folder Rapor Baru'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className={labelCls}>
              Folder Rapor <span className="text-rose-500">*</span>
            </label>
            <input value={f.nama} onChange={(e) => setF({ ...f, nama: e.target.value })} placeholder={suggestion} className={inputCls} />
            {!f.nama && kelas && (
              <button
                type="button"
                onClick={() => setF({ ...f, nama: suggestion })}
                className="text-[11px] text-emerald-700 font-semibold hover:underline mt-1 cursor-pointer"
              >
                Pakai: {suggestion}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                Awal Penilaian <span className="text-rose-500">*</span>
              </label>
              <input type="date" value={f.awalPenilaian} onChange={(e) => setF({ ...f, awalPenilaian: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>
                Akhir Penilaian <span className="text-rose-500">*</span>
              </label>
              <input type="date" value={f.akhirPenilaian} onChange={(e) => setF({ ...f, akhirPenilaian: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>
              Kelas <span className="text-rose-500">*</span>
            </label>
            <select value={f.kelasId} onChange={(e) => setF({ ...f, kelasId: e.target.value })} className={inputCls}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>
              Template <span className="text-rose-500">*</span>
            </label>
            <select value={f.templateId} onChange={(e) => setF({ ...f, templateId: e.target.value })} className={inputCls}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={f.diterbitkan}
              onChange={(e) => setF({ ...f, diterbitkan: e.target.checked })}
              className="accent-emerald-600 mt-0.5"
            />
            <span>Terbitkan ke Portal Siswa (wali bisa melihat & mengunduh rapor yang sudah diisi)</span>
          </label>
          <button type="submit" className={`${btnPrimary} w-full`}>
            <Save className="w-4 h-4" /> Simpan
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Isi folder (daftar siswa) ───────────────────────────────────────────────

const FolderDetail: React.FC<{
  folder: RaporFolder;
  template: RaporTemplate;
  kelasNama: string;
  students: Student[];
  entries: RaporEntry[];
  isAdmin: boolean;
  onBack: () => void;
  onFill: (siswaId: string) => void;
  onOpen: (entry: RaporEntry, student: Student) => void;
  onTogglePublish: () => void;
}> = ({ folder, template, kelasNama, students, entries, isAdmin, onBack, onFill, onOpen, onTogglePublish }) => {
  const [q, setQ] = useState('');
  const byStudent = useMemo(() => new Map(entries.map((e) => [e.siswaId, e])), [entries]);
  const shown = students.filter((s) => s.nama.toLowerCase().includes(q.trim().toLowerCase()));
  const firstEmpty = students.find((s) => !byStudent.has(s.id));

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
        <ChevronLeft className="w-4 h-4" /> Semua Folder
      </button>

      <div className="sports-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-display font-bold text-slate-900">{folder.nama}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {kelasNama} · {formatPeriode(folder.awalPenilaian, folder.akhirPenilaian)} · Template: {template.nama}
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-1">
            {entries.length} / {students.length} rapor terisi
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button onClick={onTogglePublish} className={btnSecondary}>
              {folder.diterbitkan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {folder.diterbitkan ? 'Tarik dari Portal' : 'Terbitkan ke Portal'}
            </button>
          )}
          {firstEmpty && (
            <button onClick={() => onFill(firstEmpty.id)} className={btnPrimary}>
              <Edit3 className="w-4 h-4" /> Isi yang Belum
            </button>
          )}
        </div>
      </div>

      <div className="sports-card rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-slate-100">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama siswa…" className={inputCls} />
        </div>
        {shown.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-500">
            {students.length === 0 ? 'Belum ada siswa aktif di kelas ini.' : 'Tidak ada siswa yang cocok.'}
          </p>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Nama Siswa</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="text-right px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shown.map((s) => {
                const entry = byStudent.get(s.id);
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{s.nama}</p>
                      <p className="sm:hidden text-[10px] mt-0.5">
                        {entry ? <span className="text-emerald-600">Terisi</span> : <span className="text-slate-400">Belum diisi</span>}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {entry ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Terisi
                          <span className="text-slate-400 font-normal">· {entry.diisiOleh}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Circle className="w-3.5 h-3.5" /> Belum diisi
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {entry && (
                          <button
                            onClick={() => onOpen(entry, s)}
                            className={`${iconBtn} hover:text-sky-600 hover:bg-sky-50`}
                            title="Lihat / cetak PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onFill(s.id)}
                          className={`${iconBtn} text-emerald-600 hover:bg-emerald-50`}
                          title={entry ? 'Edit rapor' : 'Isi rapor'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ─── Form isi rapor satu siswa ───────────────────────────────────────────────

const FillRapor: React.FC<{
  folder: RaporFolder;
  template: RaporTemplate;
  student: Student;
  kelasNama: string;
  existing?: RaporEntry;
  actorName: string;
  nextStudent?: Student;
  position: string;
  onBack: () => void;
  onSave: (entry: RaporEntry, goNext: boolean) => void;
}> = ({ folder, template, student, kelasNama, existing, actorName, nextStudent, position, onBack, onSave }) => {
  const { toast } = useToast();
  const [jawaban, setJawaban] = useState<RaporJawaban>(existing?.jawaban ?? {});
  const set = (id: string, v: string | string[]) => setJawaban((j) => ({ ...j, [id]: v }));

  const submit = (goNext: boolean) => {
    const missing = missingRequired(template, jawaban);
    if (missing.length > 0) {
      return toast.error('Masih ada isian wajib', missing.map((m) => m.label).join(', '));
    }
    // Simpan hanya jawaban untuk item yang masih ada di template.
    const clean: RaporJawaban = {};
    for (const it of template.items) {
      const v = jawaban[it.id];
      if (it.tipe !== 'judul' && v !== undefined) clean[it.id] = typeof v === 'string' ? v.trim() : v;
    }
    onSave(
      {
        id: existing?.id ?? newRaporId('rpe'),
        folderId: folder.id,
        siswaId: student.id,
        jawaban: clean,
        diisiOleh: actorName,
        tanggalIsi: `${getTodayISO()} ${getCurrentTime()}`,
      },
      goNext,
    );
    toast.success('Rapor disimpan', student.nama);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> {folder.nama}
        </button>
        <span className="text-[11px] font-mono text-slate-400">{position}</span>
      </div>

      <div className="sports-card rounded-2xl p-5">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Isi Rapor</p>
        <h1 className="text-lg font-display font-bold text-slate-900">{student.nama}</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kelas: {kelasNama} · Bergabung: {formatTanggalRapor(student.tanggalBergabung)}
        </p>
        {template.header.trim() && <p className="text-xs text-slate-700 mt-3 whitespace-pre-line">{template.header}</p>}
      </div>

      <div className="sports-card rounded-2xl p-5 space-y-5">
        {template.items.map((it) => {
          if (it.tipe === 'judul') {
            return (
              <h2 key={it.id} className="text-base font-display font-bold text-slate-900 pt-2 border-t border-slate-100 first:border-0 first:pt-0">
                {it.label}
              </h2>
            );
          }
          const v = jawaban[it.id];
          const label = (
            <label className={labelCls}>
              {it.label} {it.wajib && <span className="text-rose-500">*</span>}
            </label>
          );
          return (
            <div key={it.id}>
              {label}
              {it.tipe === 'isian' && (
                <input value={(v as string) ?? ''} onChange={(e) => set(it.id, e.target.value)} className={inputCls} />
              )}
              {it.tipe === 'paragraf' && (
                <textarea rows={3} value={(v as string) ?? ''} onChange={(e) => set(it.id, e.target.value)} className={inputCls} />
              )}
              {it.tipe === 'dropdown' && (
                <select value={(v as string) ?? ''} onChange={(e) => set(it.id, e.target.value)} className={inputCls}>
                  <option value="">— Pilih —</option>
                  {(it.opsi ?? []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}
              {it.tipe === 'pilihan' && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {(it.opsi ?? []).map((o) => (
                    <label key={o} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name={it.id}
                        checked={v === o}
                        onChange={() => set(it.id, o)}
                        className="accent-emerald-600"
                      />
                      {o}
                    </label>
                  ))}
                  {typeof v === 'string' && v && (
                    <button onClick={() => set(it.id, '')} className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer">
                      Kosongkan
                    </button>
                  )}
                </div>
              )}
              {it.tipe === 'checkbox' && (
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {(it.opsi ?? []).map((o) => {
                    const arr = Array.isArray(v) ? v : [];
                    return (
                      <label key={o} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={arr.includes(o)}
                          onChange={(e) =>
                            set(
                              it.id,
                              e.target.checked
                                ? (it.opsi ?? []).filter((x) => x === o || arr.includes(x))
                                : arr.filter((x) => x !== o),
                            )
                          }
                          className="accent-emerald-600"
                        />
                        {o}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => submit(false)} className={btnPrimary}>
          <Save className="w-4 h-4" /> Simpan
        </button>
        {nextStudent && (
          <button onClick={() => submit(true)} className={btnSecondary}>
            Simpan & Lanjutkan <ArrowRight className="w-4 h-4" />
            <span className="text-slate-400 font-normal">({nextStudent.nama})</span>
          </button>
        )}
      </div>
    </div>
  );
};
