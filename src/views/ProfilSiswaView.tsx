import React, { useState } from 'react';
import { 
  Student, 
  ClassGroup, 
  MonthlyDueRecord, 
  ClubEvent, 
  EventParticipant, 
  AttendanceSession, 
  FeeStatus 
} from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Edit3, 
  Check, 
  ChevronDown,
  Award
} from 'lucide-react';

interface ProfilSiswaViewProps {
  students: Student[];
  classes: ClassGroup[];
  monthlyDues: MonthlyDueRecord[];
  events: ClubEvent[];
  eventParticipants: EventParticipant[];
  attendanceSessions: AttendanceSession[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  onOpenPaymentModal: (due: MonthlyDueRecord, student: Student, classGroup: ClassGroup) => void;
  onOpenEventPaymentModal: (event: ClubEvent, participant: EventParticipant, student: Student, classGroup: ClassGroup) => void;
  onUpdateStudent: (student: Student) => void;
}

type TabKey = 'iuran' | 'event' | 'absensi' | 'biodata';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

const FULL_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const ProfilSiswaView: React.FC<ProfilSiswaViewProps> = ({
  students,
  classes,
  monthlyDues,
  events,
  eventParticipants,
  attendanceSessions,
  selectedStudentId,
  onSelectStudent,
  onOpenPaymentModal,
  onOpenEventPaymentModal,
  onUpdateStudent,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('iuran');
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isEditingBiodata, setIsEditingBiodata] = useState<boolean>(false);

  // Active student
  const currentStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const currentClass = classes.find((c) => c.id === currentStudent?.kelasId) || classes[0];

  // Biodata Edit State
  const [editForm, setEditForm] = useState<Student | null>(currentStudent);

  // Sync edit form on student change
  React.useEffect(() => {
    setEditForm(currentStudent);
    setIsEditingBiodata(false);
  }, [currentStudent]);

  if (!currentStudent) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 shadow-xs text-center space-y-3">
        <User className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Belum Ada Data Siswa</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Database masih kosong dari nol. Silakan lakukan pendaftaran siswa baru melalui menu Pendaftaran Baru untuk melihat data profil, matriks iuran, dan absensi di sini.
        </p>
      </div>
    );
  }

  // Monthly dues for this student & year
  const studentDues = monthlyDues.filter(
    (d) => d.siswaId === currentStudent.id && d.tahun === selectedYear
  );

  // Events for this student
  const studentEventParticipants = eventParticipants.filter(
    (ep) => ep.siswaId === currentStudent.id
  );

  const getCellColorClass = (status: FeeStatus) => {
    switch (status) {
      case 'lunas':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white';
      case 'belum_lunas':
        return 'bg-amber-500 hover:bg-amber-600 text-white';
      case 'belum_bayar':
        return 'bg-red-600 hover:bg-red-700 text-white cursor-pointer animate-pulse-subtle';
      case 'belum_bergabung':
        return 'bg-slate-700 text-slate-400 cursor-not-allowed';
      case 'cuti':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-slate-200 text-slate-700';
    }
  };

  const handleCellClick = (monthNumber: number) => {
    const record = studentDues.find((d) => d.bulan === monthNumber);
    if (!record) return;

    if (record.status === 'belum_bergabung') {
      alert('Siswa belum bergabung pada bulan ini.');
      return;
    }

    if (record.status === 'lunas') {
      alert(`Iuran bulan ${MONTH_NAMES[monthNumber - 1]} sudah lunas (${formatRupiah(record.nominal)}).`);
      return;
    }

    // Open payment modal
    onOpenPaymentModal(record, currentStudent, currentClass);
  };

  const handleSaveBiodata = (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm) {
      onUpdateStudent(editForm);
      setIsEditingBiodata(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Selector Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              PROFIL SISWA
            </h1>
            <p className="text-xs text-slate-500">
              Informasi lengkap profil, riwayat pembayaran iuran, event, dan absensi
            </p>
          </div>

          {/* Student Selector Dropdown */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-slate-800">{currentStudent.nama}</span>
              <div className="flex items-center gap-2 justify-end text-xs text-slate-500">
                <span className="font-semibold text-blue-700">{currentClass?.nama}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <Phone className="w-3 h-3" />
                  {currentStudent.noHp}
                </span>
              </div>
            </div>

            <div className="relative min-w-[220px]">
              <select
                value={currentStudent.id}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              >
                {students
                  .filter((s) => s.status === 'Aktif')
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama} ({s.kelasId.toUpperCase()})
                    </option>
                  ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Tab Navigation (matching video timestamp 01:24) */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-200">
          {(['iuran', 'event', 'absensi', 'biodata'] as TabKey[]).map((tab) => {
            const labels: { [k in TabKey]: string } = {
              iuran: 'Iuran',
              event: 'Event',
              absensi: 'Absensi',
              biodata: 'Biodata',
            };
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 text-sm font-bold capitalize transition-all border-b-2 -mb-px ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT: 1. IURAN */}
      {activeTab === 'iuran' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Matriks Pembayaran Iuran Rutin Bulanan
              </h2>
              <p className="text-xs text-slate-500">
                Klik pada kotak bulan yang merah (Belum Bayar) untuk mencatat pembayaran secara instan
              </p>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Tahun:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 bg-white"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-bold">
                  <th className="py-2.5 px-3 border border-slate-800">Tahun</th>
                  {MONTH_NAMES.map((m) => (
                    <th key={m} className="py-2.5 px-2 border border-slate-800">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 px-3 border border-slate-200 font-bold text-xs bg-slate-50 text-slate-800">
                    {selectedYear}
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((monthNum) => {
                    const due = studentDues.find((d) => d.bulan === monthNum);
                    const status: FeeStatus = due ? due.status : 'belum_bayar';
                    return (
                      <td
                        key={monthNum}
                        onClick={() => handleCellClick(monthNum)}
                        className={`p-2 border border-slate-200 transition-transform active:scale-95 ${getCellColorClass(
                          status
                        )}`}
                        title={`Bulan: ${FULL_MONTH_NAMES[monthNum - 1]} (${status.replace('_', ' ')})`}
                      >
                        <div className="min-w-[40px] h-7 flex items-center justify-center font-bold text-xs">
                          {status === 'lunas' && '✓'}
                          {status === 'belum_lunas' && '½'}
                          {status === 'belum_bayar' && 'Rp'}
                          {status === 'belum_bergabung' && '-'}
                          {status === 'cuti' && 'C'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Color Legend (matching video bottom legend) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600"></span>
              <span className="font-semibold">Lunas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-500"></span>
              <span className="font-semibold">Belum Lunas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-red-600"></span>
              <span className="font-semibold">Belum Bayar</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-700"></span>
              <span className="font-semibold">Belum Bergabung</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-yellow-200 border border-yellow-300"></span>
              <span className="font-semibold">Cuti</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. EVENT */}
      {activeTab === 'event' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Iuran Insidentil & Keikutsertaan Event
              </h2>
              <p className="text-xs text-slate-500">
                Turnamen, pelatihan intensif, atau kejuaraan yang diikuti siswa
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-white font-bold">
                <tr>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Biaya</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {events.map((evt) => {
                  const part = studentEventParticipants.find((p) => p.eventId === evt.id);
                  const isRegistered = !!part;
                  const isLunas = part?.status === 'lunas';

                  return (
                    <tr key={evt.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 text-sm">{evt.nama}</p>
                        <p className="text-[11px] text-slate-500">{evt.deskripsi} • {evt.tanggal}</p>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formatRupiah(evt.nominal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isRegistered ? (
                          isLunas ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">
                              <XCircle className="w-3.5 h-3.5" /> Belum Lunas
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[11px]">
                            Tidak Terdaftar
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isRegistered && !isLunas && (
                          <button
                            onClick={() => onOpenEventPaymentModal(evt, part, currentStudent, currentClass)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
                          >
                            Bayar Sekarang
                          </button>
                        )}
                        {isRegistered && isLunas && (
                          <span className="text-xs text-slate-400 font-mono">
                            {part.kuitansiId || 'Terverifikasi'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. ABSENSI */}
      {activeTab === 'absensi' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kalender Rekap Absensi Siswa ({selectedYear})
              </h2>
              <p className="text-xs text-slate-500">
                Warna hijau menandakan kehadiran siswa pada sesi latihan
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-semibold text-slate-700">Hadir Latihan</span>
            </div>
          </div>

          {/* 12 Months Mini Calendars Grid (matching video timestamp 02:05) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {FULL_MONTH_NAMES.map((mName, mIdx) => {
              const monthNumber = mIdx + 1;
              const daysInMonth = new Date(selectedYear, monthNumber, 0).getDate();
              // Gather sessions in this month
              const monthSessions = attendanceSessions.filter((s) => {
                const parts = s.tanggal.split('-');
                return Number(parts[0]) === selectedYear && Number(parts[1]) === monthNumber;
              });

              return (
                <div key={mName} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="font-bold text-xs text-slate-800 text-center pb-2 border-b border-slate-200">
                    {mName}
                  </div>
                  {/* Days header: S S R K J S M */}
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-bold text-slate-400 my-1.5">
                    <span>S</span>
                    <span>S</span>
                    <span>R</span>
                    <span>K</span>
                    <span>J</span>
                    <span>S</span>
                    <span>M</span>
                  </div>

                  {/* Days */}
                  <div className="grid grid-cols-7 gap-1 text-[11px] text-center">
                    {Array.from({ length: daysInMonth }, (_, dayIdx) => {
                      const day = dayIdx + 1;
                      const dateStr = `${selectedYear}-${monthNumber.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                      const session = monthSessions.find((s) => s.tanggal === dateStr);
                      const isPresent = session?.kehadiran[currentStudent.id] === true;
                      const isAbsent = session && session.kehadiran[currentStudent.id] === false;

                      return (
                        <div
                          key={day}
                          className={`h-6 flex items-center justify-center rounded text-[10px] font-semibold transition-colors ${
                            isPresent
                              ? 'bg-emerald-500 text-white font-bold shadow-xs'
                              : isAbsent
                              ? 'bg-red-400 text-white'
                              : 'text-slate-600 hover:bg-slate-200'
                          }`}
                          title={session ? `Sesi latihan: ${isPresent ? 'Hadir' : 'Tidak Hadir'}` : ''}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. BIODATA */}
      {activeTab === 'biodata' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Biodata & Informasi Orang Tua
              </h2>
              <p className="text-xs text-slate-500">
                Data resmi siswa untuk keperluan administrasi klub
              </p>
            </div>
            {!isEditingBiodata ? (
              <button
                onClick={() => setIsEditingBiodata(true)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Biodata</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditingBiodata(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Batal
              </button>
            )}
          </div>

          {isEditingBiodata && editForm ? (
            /* Edit Form */
            <form onSubmit={handleSaveBiodata} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Siswa</label>
                  <input
                    type="text"
                    required
                    value={editForm.nama}
                    onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No HP Siswa</label>
                  <input
                    type="text"
                    value={editForm.noHp}
                    onChange={(e) => setEditForm({ ...editForm, noHp: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
                  <input
                    type="text"
                    value={editForm.alamat}
                    onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ayah/Wali</label>
                  <input
                    type="text"
                    value={editForm.orangTua.namaAyah}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orangTua: { ...editForm.orangTua, namaAyah: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No HP Ayah/Wali</label>
                  <input
                    type="text"
                    value={editForm.orangTua.noHpAyah}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orangTua: { ...editForm.orangTua, noHpAyah: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ibu/Wali</label>
                  <input
                    type="text"
                    value={editForm.orangTua.namaIbu}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orangTua: { ...editForm.orangTua, namaIbu: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No HP Ibu/Wali</label>
                  <input
                    type="text"
                    value={editForm.orangTua.noHpIbu}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        orangTua: { ...editForm.orangTua, noHpIbu: e.target.value },
                      })
                    }
                    className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          ) : (
            /* View Biodata */
            <div className="mt-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">Nama Lengkap</span>
                  <span className="font-bold text-slate-900 text-sm">{currentStudent.nama}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">Jenis Kelamin</span>
                  <span className="font-bold text-slate-900 text-sm">{currentStudent.jenisKelamin}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">Tempat, Tanggal Lahir</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {currentStudent.tempatLahir}, {currentStudent.tanggalLahir}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">No. HP Siswa</span>
                  <span className="font-bold text-slate-900 text-sm">{currentStudent.noHp}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">Email</span>
                  <span className="font-bold text-slate-900 text-sm">{currentStudent.email || '-'}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">Alamat</span>
                  <span className="font-bold text-slate-900 text-sm">{currentStudent.alamat}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">Nama Ayah/Wali</span>
                  <span className="font-bold text-slate-900 text-sm">{currentStudent.orangTua.namaAyah}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">No HP Ayah/Wali</span>
                  <span className="font-bold text-slate-900 text-sm">{currentStudent.orangTua.noHpAyah}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">Nama Ibu/Wali</span>
                  <span className="font-bold text-slate-900 text-sm">{currentStudent.orangTua.namaIbu}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">No HP Ibu/Wali</span>
                  <span className="font-bold text-slate-900 text-sm">{currentStudent.orangTua.noHpIbu}</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">Status Keanggotaan</span>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    {currentStudent.status}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50">
                  <span className="text-slate-400 font-semibold block">Catatan Siswa</span>
                  <span className="font-medium text-slate-700">{currentStudent.catatan || '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
