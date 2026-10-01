import React, { useState } from 'react';
import { Coach, CoachStatus, ClassGroup, Student } from '../types/sportkit';
import { getCoachClasses, isValidPhone, normalizeName, normalizePhone } from '../utils/coaches';
import {
  Search,
  Users,
  UserCheck,
  Plus,
  Edit3,
  Trash2,
  Phone,
  Mail,
  Award,
  X,
  Save,
  CheckCircle2,
  XCircle,
  Layers,
  CalendarDays,
} from 'lucide-react';

interface PelatihViewProps {
  coaches: Coach[];
  classes: ClassGroup[];
  students: Student[];
  onAddCoach: (coach: Coach) => void;
  onUpdateCoach: (coach: Coach) => void;
  onDeleteCoach: (coachId: string) => void;
}

const EMPTY_FORM = (): Omit<Coach, 'id'> => ({
  nama: '',
  noHp: '',
  email: '',
  spesialisasi: '',
  status: 'Aktif',
  catatan: '',
  tanggalBergabung: new Date().toISOString().slice(0, 10),
});

export const PelatihView: React.FC<PelatihViewProps> = ({
  coaches,
  classes,
  students,
  onAddCoach,
  onUpdateCoach,
  onDeleteCoach,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [form, setForm] = useState<Omit<Coach, 'id'>>(EMPTY_FORM());
  const [filterStatus, setFilterStatus] = useState<CoachStatus | 'Semua'>('Semua');
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState<{ nama?: string; noHp?: string }>({});

  const openCreateModal = () => {
    setEditingCoach(null);
    setForm(EMPTY_FORM());
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (coach: Coach) => {
    setEditingCoach(coach);
    setForm({
      nama: coach.nama,
      noHp: coach.noHp,
      email: coach.email || '',
      spesialisasi: coach.spesialisasi,
      status: coach.status,
      catatan: coach.catatan || '',
      tanggalBergabung: coach.tanggalBergabung,
    });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const next: { nama?: string; noHp?: string } = {};
    const others = coaches.filter((c) => c.id !== editingCoach?.id);
    const nama = form.nama.trim();

    if (!nama) next.nama = 'Nama pelatih wajib diisi.';
    else if (others.some((c) => normalizeName(c.nama) === normalizeName(nama)))
      next.nama = 'Nama pelatih sudah terdaftar.';

    if (!isValidPhone(form.noHp)) next.noHp = 'Format nomor HP tidak valid (contoh: 0812-3456-7890).';
    else if (others.some((c) => normalizePhone(c.noHp) === normalizePhone(form.noHp)))
      next.noHp = 'Nomor HP sudah dipakai pelatih lain.';

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const clean = {
      ...form,
      nama: form.nama.trim(),
      noHp: form.noHp.trim(),
      spesialisasi: form.spesialisasi.trim(),
    };

    if (editingCoach) {
      onUpdateCoach({ ...editingCoach, ...clean });
    } else {
      onAddCoach({ ...clean, id: `coach-${Date.now()}` });
    }
    setShowModal(false);
  };

  const getCoachStats = (coachId: string) => {
    const coachClasses = getCoachClasses(coachId, classes);
    const ids = new Set(coachClasses.map((c) => c.id));
    const activeStudents = students.filter((s) => ids.has(s.kelasId) && s.status === 'Aktif').length;
    return { coachClasses, activeStudents };
  };

  const query = search.trim().toLowerCase();
  const filtered = coaches.filter(
    (c) =>
      (filterStatus === 'Semua' || c.status === filterStatus) &&
      (!query || `${c.nama} ${c.spesialisasi} ${c.noHp}`.toLowerCase().includes(query))
  );

  const aktifCount = coaches.filter((c) => c.status === 'Aktif').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sports-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
              Manajemen Pelatih
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-xs border border-sky-200 font-mono">
              {aktifCount} Aktif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data pelatih aktif klub, spesialisasi, dan kelas yang diampu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / spesialisasi..."
              className="text-xs rounded-xl border border-slate-300 pl-8 pr-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 w-48"
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CoachStatus | 'Semua')}
            className="text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Pelatih</span>
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="sports-card rounded-2xl p-12 text-center">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          {coaches.length === 0 ? (
            <>
              <p className="text-sm font-bold text-slate-600">Belum ada pelatih terdaftar</p>
              <p className="text-xs text-slate-400 mt-1">Klik tombol + Tambah Pelatih untuk memulai</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-slate-600">Tidak ada pelatih yang cocok</p>
              <p className="text-xs text-slate-400 mt-1">Ubah kata kunci pencarian atau filter status</p>
            </>
          )}
        </div>
      )}

      {/* Coach Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((coach) => {
          const { coachClasses, activeStudents } = getCoachStats(coach.id);
          const isActive = coach.status === 'Aktif';

          return (
            <div
              key={coach.id}
              className={`sports-card rounded-2xl overflow-hidden flex flex-col ${!isActive ? 'opacity-60' : ''}`}
            >
              {/* Card Top Bar */}
              <div className={`h-1.5 w-full ${isActive ? 'bg-gradient-to-r from-sky-400 to-emerald-400' : 'bg-slate-300'}`} />

              <div className="p-5 flex-1 flex flex-col">
                {/* Name & Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {/* Avatar Initials */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 ${isActive ? 'bg-gradient-to-br from-sky-500 to-emerald-500' : 'bg-slate-400'}`}>
                      {coach.nama.split(' ').slice(-1)[0]?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 leading-tight">{coach.nama}</p>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {coach.status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(coach)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                      title="Edit pelatih"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCoach(coach.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Hapus pelatih"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-2 text-xs flex-1">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Award className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span className="font-semibold">{coach.spesialisasi}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{coach.noHp}</span>
                  </div>
                  {coach.email && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{coach.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-400">
                    <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                    <span>Bergabung: {new Date(coach.tanggalBergabung).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* Kelas yang diampu */}
                {coachClasses.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Mengampu {coachClasses.length} kelas
                      <span className="ml-auto flex items-center gap-1 normal-case tracking-normal">
                        <Users className="w-3 h-3" /> {activeStudents} siswa aktif
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {coachClasses.map((cls) => (
                        <span key={cls.id} className="px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-100">
                          {cls.nama}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Catatan */}
                {coach.catatan && (
                  <p className="mt-2 text-[11px] text-slate-400 leading-relaxed italic">
                    "{coach.catatan}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Coach */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-sky-400 to-emerald-400" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-display font-bold text-slate-900">
                  {editingCoach ? 'Edit Data Pelatih' : 'Tambah Pelatih Baru'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap Pelatih *</label>
                    <input
                      type="text" required
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      placeholder="Coach Dimas"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    {errors.nama && <p className="text-[11px] text-rose-600 mt-1">{errors.nama}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">No. HP / WA *</label>
                    <input
                      type="text" required
                      value={form.noHp}
                      onChange={(e) => setForm({ ...form, noHp: e.target.value })}
                      placeholder="0812-3456-7890"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    {errors.noHp && <p className="text-[11px] text-rose-600 mt-1">{errors.noHp}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="coach@email.com"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Spesialisasi *</label>
                    <input
                      type="text" required
                      value={form.spesialisasi}
                      onChange={(e) => setForm({ ...form, spesialisasi: e.target.value })}
                      placeholder="Basket, Renang, dll"
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as CoachStatus })}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Bergabung</label>
                    <input
                      type="date"
                      value={form.tanggalBergabung}
                      onChange={(e) => setForm({ ...form, tanggalBergabung: e.target.value })}
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan / Bio Singkat</label>
                    <textarea
                      rows={2}
                      value={form.catatan || ''}
                      onChange={(e) => setForm({ ...form, catatan: e.target.value })}
                      placeholder="Pengalaman, sertifikasi, dll..."
                      className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {editingCoach ? 'Simpan Perubahan' : 'Tambah Pelatih'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
