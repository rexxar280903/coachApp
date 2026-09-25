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
  X
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

  // Deletion state
  const [classToDelete, setClassToDelete] = useState<ClassGroup | null>(null);
  const [reassignClassId, setReassignClassId] = useState<string>('');

  // Form states
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

  const handleDeleteClick = (cls: ClassGroup) => {
    setClassToDelete(cls);
    const otherClasses = classes.filter((c) => c.id !== cls.id);
    setReassignClassId(otherClasses.length > 0 ? otherClasses[0].id : '');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              KELOMPOK KELAS
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
              {classes.length} Kelas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin dapat membuat kelas baru, menentukan tarif iuran & biaya pendaftaran, serta menetapkan nama pelatih
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kelas Baru</span>
        </button>
      </div>

      {/* Class Cards Grid */}
      {classes.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-xs text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Belum Ada Kelompok Kelas</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Silakan buat kelompok kelas baru untuk menampung pendaftaran siswa, menentukan jadwal/pelatih, dan mengatur nominal iuran.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kelas Baru Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => {
            const studentCount = students.filter((s) => s.kelasId === cls.id && s.status === 'Aktif').length;
            const calonCount = students.filter((s) => s.kelasId === cls.id && s.status === 'Calon').length;

            return (
              <div
                key={cls.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center justify-center font-black text-sm">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base">{cls.nama}</h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>{cls.pelatih}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cls)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Kelas"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(cls)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 min-h-[32px]">
                    {cls.deskripsi || 'Kelompok kelas pelatihan olahraga reguler.'}
                  </p>

                  {/* Price Breakdown Pill */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>Iuran Rutin:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(cls.iuranBulanan)} / bln</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Biaya Masuk:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(cls.biayaPendaftaran)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Student counts & action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-[11px]">
                      {studentCount} Siswa Aktif
                    </span>
                    {calonCount > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[11px]">
                        {calonCount} Calon
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigateNewRegistration(cls.id)}
                    className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                  >
                    + Tambah Murid
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat / Edit Kelas Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base">
                  {editingClass ? 'Edit Kelompok Kelas' : 'Buat Kelas Baru'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Kelas *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: KU-16, RENANG ACM 3, FUTSAL SENIOR"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Pelatih / Coach *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Coach Hendra / Coach Dimas"
                  value={pelatih}
                  onChange={(e) => setPelatih(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Keterangan Kelas
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan materi, kelompok usia, atau jadwal latihan"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Iuran Rutin / Bulan (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={iuranBulanan}
                    onChange={(e) => setIuranBulanan(Number(e.target.value))}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                    {formatRupiah(iuranBulanan)}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Biaya Pendaftaran (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={10000}
                    value={biayaPendaftaran}
                    onChange={(e) => setBiayaPendaftaran(Number(e.target.value))}
                    className="w-full text-xs font-bold rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-blue-700 font-semibold mt-0.5">
                    {formatRupiah(biayaPendaftaran)}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                >
                  {editingClass ? 'Simpan Perubahan' : 'Buat Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {classToDelete && (() => {
        const associatedStudents = students.filter((s) => s.kelasId === classToDelete.id);
        const activeCount = associatedStudents.filter((s) => s.status === 'Aktif').length;
        const calonCount = associatedStudents.filter((s) => s.status === 'Calon').length;
        const otherCount = associatedStudents.length - activeCount - calonCount;
        const otherClasses = classes.filter((c) => c.id !== classToDelete.id);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Hapus Kelompok Kelas</h3>
                    <p className="text-[11px] text-slate-400 font-normal">Konfirmasi penghapusan kelas akademi</p>
                  </div>
                </div>
                <button
                  onClick={() => setClassToDelete(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Class info box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-black text-slate-900 text-sm">{classToDelete.nama}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Pelatih: {classToDelete.pelatih}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-800 font-bold text-xs">
                    {formatRupiah(classToDelete.iuranBulanan)} / bln
                  </span>
                </div>

                {associatedStudents.length === 0 ? (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-900">Kelas ini kosong</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Tidak ada siswa maupun calon siswa terdaftar pada kelas ini. Kelompok kelas dapat langsung dihapus dengan aman.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-950">Perhatian: Masih ada {associatedStudents.length} siswa di kelas ini</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Terdapat <span className="font-bold">{activeCount} Siswa Aktif</span>, <span className="font-bold">{calonCount} Calon Siswa</span>
                          {otherCount > 0 && `, dan ${otherCount} siswa cuti/nonaktif`}.
                        </p>
                      </div>
                    </div>

                    {otherClasses.length > 0 ? (
                      <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
                        <label className="block font-bold text-blue-950 text-xs">
                          Pilihan Direkomendasikan: Pindahkan siswa ke kelas lain
                        </label>
                        <p className="text-[11px] text-blue-700">
                          Pindahkan semua {associatedStudents.length} siswa ke kelas berikut sebelum menghapus:
                        </p>
                        <select
                          value={reassignClassId}
                          onChange={(e) => setReassignClassId(e.target.value)}
                          className="w-full text-xs font-bold rounded-lg border border-blue-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {otherClasses.map((oc) => (
                            <option key={oc.id} value={oc.id}>
                              {oc.nama} ({oc.pelatih})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">
                        Ini adalah satu-satunya kelompok kelas. Menghapus kelas ini juga akan menghapus data {associatedStudents.length} siswa di dalamnya.
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setClassToDelete(null)}
                    className="w-full sm:w-auto px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                  >
                    Batal
                  </button>

                  {associatedStudents.length > 0 && otherClasses.length > 0 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteClass(classToDelete.id);
                          setClassToDelete(null);
                        }}
                        className="w-full sm:w-auto px-3.5 py-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl font-bold transition-colors text-[11px]"
                        title="Hapus kelas beserta seluruh siswanya"
                      >
                        Hapus Bersama Siswa
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteClass(classToDelete.id, reassignClassId);
                          setClassToDelete(null);
                        }}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-colors"
                      >
                        Pindahkan Siswa & Hapus
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteClass(classToDelete.id);
                        setClassToDelete(null);
                      }}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition-colors"
                    >
                      {associatedStudents.length > 0 ? 'Ya, Hapus Kelas & Siswa' : 'Ya, Hapus Kelas'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
