import React, { useState } from 'react';
import { ClassGroup, Student } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { 
  Plus, 
  Layers, 
  Users, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  DollarSign, 
  UserCheck, 
  AlertCircle,
  X,
  CreditCard,
  UserPlus
} from 'lucide-react';

interface KelasManagerViewProps {
  classes: ClassGroup[];
  students: Student[];
  onAddClass: (newClass: ClassGroup) => void;
  onUpdateClass: (updatedClass: ClassGroup) => void;
  onDeleteClass: (classId: string, reassignClassId?: string) => void;
  onNavigateNewRegistration: (classId?: string) => void;
}

export const KelasManagerView: React.FC<KelasManagerViewProps> = ({
  classes,
  students,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onNavigateNewRegistration,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);

  const [classToDelete, setClassToDelete] = useState<ClassGroup | null>(null);
  const [reassignClassId, setReassignClassId] = useState<string>('');

  const [nama, setNama] = useState<string>('');
  const [deskripsi, setDeskripsi] = useState<string>('');
  const [iuranBulanan, setIuranBulanan] = useState<number>(100000);
  const [biayaPendaftaran, setBiayaPendaftaran] = useState<number>(1000000);
  const [pelatih, setPelatih] = useState<string>('');

  const openCreateModal = () => {
    setEditingClass(null);
    setNama('');
    setDeskripsi('');
    setIuranBulanan(100000);
    setBiayaPendaftaran(1000000);
    setPelatih('Coach ');
    setShowModal(true);
  };

  const openEditModal = (cls: ClassGroup) => {
    setEditingClass(cls);
    setNama(cls.nama);
    setDeskripsi(cls.deskripsi);
    setIuranBulanan(cls.iuranBulanan);
    setBiayaPendaftaran(cls.biayaPendaftaran);
    setPelatih(cls.pelatih);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        nama: nama.trim().toUpperCase(),
        deskripsi: deskripsi.trim(),
        iuranBulanan: Number(iuranBulanan),
        biayaPendaftaran: Number(biayaPendaftaran),
        pelatih: pelatih.trim() || 'Coach Pelatih',
      });
    } else {
      const newClass: ClassGroup = {
        id: 'cls-' + Date.now(),
        nama: nama.trim().toUpperCase(),
        deskripsi: deskripsi.trim() || 'Kelompok Kelas Olahraga',
        iuranBulanan: Number(iuranBulanan),
        biayaPendaftaran: Number(biayaPendaftaran),
        pelatih: pelatih.trim() || 'Coach Pelatih',
      };
      onAddClass(newClass);
    }
    setShowModal(false);
  };

  const handleConfirmDelete = () => {
    if (classToDelete) {
      onDeleteClass(classToDelete.id, reassignClassId || undefined);
      setClassToDelete(null);
      setReassignClassId('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sports-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
              Kelompok Kelas & Usia
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 font-mono">
              {classes.length} Kelas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur pembagian kelompok kelas latihan, pelatih penanggung jawab, serta tarif pendaftaran dan SPP bulanan
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Kelompok Kelas</span>
        </button>
      </div>

      {/* Grid of Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => {
          const classMembers = students.filter((s) => s.kelasId === cls.id);
          const activeMembers = classMembers.filter((s) => s.status === 'Aktif');

          return (
            <div
              key={cls.id}
              className="sports-card sports-card-hover rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-display font-bold text-slate-900">
                      {cls.nama}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{cls.deskripsi}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cls)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                      title="Edit kelas"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {classes.length > 1 && (
                      <button
                        onClick={() => setClassToDelete(cls)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="my-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Jumlah Siswa:
                    </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {activeMembers.length} Aktif / {classMembers.length} Total
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      Pelatih Kelas:
                    </span>
                    <span className="font-bold text-slate-800">
                      {cls.pelatih || 'Coach Pelatih'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      SPP Iuran Bulanan:
                    </span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {formatRupiah(cls.iuranBulanan)}/bln
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      Biaya Masuk/Daftar:
                    </span>
                    <span className="font-bold text-slate-800 font-mono">
                      {formatRupiah(cls.biayaPendaftaran)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">ID: {cls.id}</span>
                <button
                  onClick={() => onNavigateNewRegistration(cls.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Daftar ke Kelas Ini</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah / Edit Kelas */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-display font-bold text-slate-900">
                {editingClass ? 'Edit Kelompok Kelas' : 'Buat Kelompok Kelas Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kelas (Contoh: KU-10, KU-12, SENIOR)
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="KU-10"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 uppercase font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deskripsi / Rentang Usia
                </label>
                <input
                  type="text"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Kelompok Usia 9-10 Tahun"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pelatih Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={pelatih}
                  onChange={(e) => setPelatih(e.target.value)}
                  placeholder="Coach Dimas"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SPP Bulanan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={iuranBulanan}
                    onChange={(e) => setIuranBulanan(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Biaya Pendaftaran (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={biayaPendaftaran}
                    onChange={(e) => setBiayaPendaftaran(Number(e.target.value))}
                    className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {editingClass ? 'Simpan Perubahan' : 'Buat Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Reassign */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-display font-bold text-slate-900 mb-2">
              Hapus Kelompok Kelas {classToDelete.nama}?
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Jika terdapat siswa di kelas ini, Anda dapat memindahkannya ke kelas lain atau menghapusnya.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pindahkan Siswa ke Kelas:
              </label>
              <select
                value={reassignClassId}
                onChange={(e) => setReassignClassId(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Jangan Pindahkan (Hapus Siswa) --</option>
                {classes
                  .filter((c) => c.id !== classToDelete.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      Pindahkan ke {c.nama}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Ya, Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
