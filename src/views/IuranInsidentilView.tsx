import React, { useState } from 'react';
import { getTodayISO, getCurrentYear } from '../utils/constants';
import { Student, ClassGroup, ClubEvent, EventParticipant } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { Plus, ChevronDown, CheckCircle2, Clock, XCircle, Award, Calendar, MapPin, Sparkles, UserPlus, Trash2, Search, Edit3 } from 'lucide-react';
import { useToast } from '../components/Toast';

interface IuranInsidentilViewProps {
  events: ClubEvent[];
  eventParticipants: EventParticipant[];
  students: Student[];
  classes: ClassGroup[];
  initialEventId?: string;
  onOpenEventPaymentModal: (event: ClubEvent, participant: EventParticipant, student: Student, classGroup: ClassGroup) => void;
  onAddNewEvent: (newEvent: ClubEvent) => void;
  onUpdateEvent: (event: ClubEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onAddParticipants: (eventId: string, siswaIds: string[]) => void;
  onRemoveParticipant: (participantId: string) => void;
}

export const IuranInsidentilView: React.FC<IuranInsidentilViewProps> = ({
  events,
  eventParticipants,
  students,
  classes,
  initialEventId,
  onOpenEventPaymentModal,
  onAddNewEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddParticipants,
  onRemoveParticipant,
}) => {
  const { toast } = useToast();
  const [showAddParticipantModal, setShowAddParticipantModal] = useState<boolean>(false);
  const [participantSearch, setParticipantSearch] = useState<string>('');
  const [participantClassFilter, setParticipantClassFilter] = useState<string>('all');
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || events[0]?.id || '');
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [newEventName, setNewEventName] = useState<string>('');
  const [newEventFee, setNewEventFee] = useState<number>(300000);
  const [newEventDate, setNewEventDate] = useState<string>('');
  const [newEventLocation, setNewEventLocation] = useState<string>('');

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const currentParticipants = eventParticipants.filter((p) => p.eventId === currentEvent?.id);
  const lunasCount = currentParticipants.filter((p) => p.status === 'lunas').length;
  const lunasPercentage = currentParticipants.length > 0 
    ? Math.round((lunasCount / currentParticipants.length) * 100) 
    : 0;

  // Siswa aktif yang belum terdaftar di event ini
  const registeredIds = new Set(currentParticipants.map((p) => p.siswaId));
  const candidateStudents = students.filter((s) => {
    if (s.status !== 'Aktif' || registeredIds.has(s.id)) return false;
    if (participantClassFilter !== 'all' && s.kelasId !== participantClassFilter) return false;
    return s.nama.toLowerCase().includes(participantSearch.toLowerCase());
  });

  const openAddParticipant = () => {
    setPickedIds([]);
    setParticipantSearch('');
    setParticipantClassFilter('all');
    setShowAddParticipantModal(true);
  };

  const togglePicked = (id: string) =>
    setPickedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSaveParticipants = () => {
    if (!currentEvent || pickedIds.length === 0) return;
    onAddParticipants(currentEvent.id, pickedIds);
    setShowAddParticipantModal(false);
  };

  const openCreateEvent = () => {
    setEditingEventId(null);
    setNewEventName('');
    setNewEventFee(300000);
    setNewEventDate('');
    setNewEventLocation('');
    setShowAddEventModal(true);
  };

  const openEditEvent = () => {
    if (!currentEvent) return;
    setEditingEventId(currentEvent.id);
    setNewEventName(currentEvent.nama);
    setNewEventFee(currentEvent.nominal);
    setNewEventDate(currentEvent.tanggal);
    setNewEventLocation(currentEvent.lokasi);
    setShowAddEventModal(true);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    if (!(Number(newEventFee) > 0)) {
      toast.error('Biaya tidak valid', 'Biaya keikutsertaan harus lebih dari 0.');
      return;
    }

    const editing = editingEventId ? events.find((ev) => ev.id === editingEventId) : undefined;
    if (editing) {
      onUpdateEvent({
        ...editing,
        nama: newEventName.trim(),
        nominal: Number(newEventFee),
        tanggal: newEventDate || editing.tanggal,
        lokasi: newEventLocation.trim(),
      });
      setShowAddEventModal(false);
      setEditingEventId(null);
      return;
    }

    const newEvt: ClubEvent = {
      id: 'evt-' + Date.now(),
      nama: newEventName.trim(),
      deskripsi: 'Kegiatan insidentil dan kejuaraan',
      nominal: Number(newEventFee),
      tanggal: newEventDate || getTodayISO(),
      lokasi: newEventLocation.trim(),
      totalPeserta: 0,
      pesertaLunas: 0,
    };

    onAddNewEvent(newEvt);
    setSelectedEventId(newEvt.id);
    setShowAddEventModal(false);
    setNewEventName('');
  };

  const handleRowClick = (part: EventParticipant) => {
    const std = students.find((s) => s.id === part.siswaId);
    const cls = classes.find((c) => c.id === std?.kelasId) || classes[0];

    if (!std || !currentEvent) return;

    if (part.status === 'lunas') {
      toast.info('Sudah lunas', `Iuran ${currentEvent.nama} untuk ${std.nama} sudah lunas.`);
      return;
    }

    onOpenEventPaymentModal(currentEvent, part, std, cls);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="sports-card rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 tracking-tight uppercase">
                  {currentEvent ? currentEvent.nama : 'Iuran Insidentil & Turnamen'}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Event
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                {currentEvent && (
                  <>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {currentEvent.tanggal}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {currentEvent.lokasi}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatRupiah(currentEvent.nominal)} / siswa
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Event Dropdown & Create Modal */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px]">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 pr-9 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>

            {currentEvent && (
              <>
                <button
                  onClick={openEditEvent}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                  title="Edit event"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDeleteEvent(currentEvent.id)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Hapus event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={openCreateEvent}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Buat Event Baru</span>
            </button>
          </div>
        </div>

        {/* Progress Bar of Collection */}
        {currentEvent && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-700">
                Progres Pelunasan Iuran ({lunasCount} dari {currentParticipants.length} siswa lunas)
              </span>
              <span className="font-bold text-emerald-600 font-mono">{lunasPercentage}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${lunasPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Participants Table */}
      <div className="sports-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm">
              Daftar Peserta & Status Pembayaran
            </h3>
            <p className="text-xs text-slate-500">
              Klik "Bayar Sekarang" pada siswa yang belum melunasi untuk mencatat transaksi dan kuitansi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
              {currentParticipants.length} Peserta Terdaftar
            </span>
            {currentEvent && (
              <button
                onClick={openAddParticipant}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Peserta</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Kuitansi / Bukti</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {currentEvent
                      ? 'Belum ada siswa yang didaftarkan pada event ini. Klik "Tambah Peserta" untuk mendaftarkan siswa.'
                      : 'Belum ada event. Buat event baru terlebih dahulu.'}
                  </td>
                </tr>
              ) : (
                currentParticipants.map((part, idx) => {
                  const std = students.find((s) => s.id === part.siswaId);
                  const stdClass = classes.find((c) => c.id === std?.kelasId);
                  const isLunas = part.status === 'lunas';
                  const isPartial = part.status === 'belum_lunas';

                  return (
                    <tr key={part.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {std?.nama || 'Siswa'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {stdClass?.nama || std?.kelasId.toUpperCase() || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {formatRupiah(part.nominal)}
                        {isPartial && (
                          <span className="block text-[10px] font-semibold text-amber-600">
                            Terbayar {formatRupiah(part.terbayar || 0)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLunas ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        ) : isPartial ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[11px] border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> Cicilan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" /> Belum Bayar
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {part.kuitansiId || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isLunas ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleRowClick(part)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              {isPartial ? 'Bayar Sisa' : 'Bayar Sekarang'}
                            </button>
                            {(part.terbayar || 0) === 0 && (
                              <button
                                onClick={() => onRemoveParticipant(part.id)}
                                title="Keluarkan dari event"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-600 font-bold">
                            ✓ Lunas
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Participant Modal */}
      {showAddParticipantModal && currentEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            <h3 className="text-base font-display font-bold text-slate-900 pb-2 border-b border-slate-100">
              Tambah Peserta — {currentEvent.nama}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Pilih siswa aktif yang ikut event ini. Tagihan {formatRupiah(currentEvent.nominal)} per siswa.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama siswa..."
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 pl-8 pr-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={participantClassFilter}
                onChange={(e) => setParticipantClassFilter(e.target.value)}
                className="text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 bg-white cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nama}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-xs mt-3">
              <span className="text-slate-500">{pickedIds.length} dipilih</span>
              {candidateStudents.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPickedIds(Array.from(new Set([...pickedIds, ...candidateStudents.map((s) => s.id)])))}
                  className="font-semibold text-emerald-700 hover:underline cursor-pointer"
                >
                  Pilih semua ({candidateStudents.length})
                </button>
              )}
            </div>

            <div className="mt-2 flex-1 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 min-h-[120px]">
              {candidateStudents.length === 0 ? (
                <p className="p-6 text-center text-xs text-slate-400">
                  Tidak ada siswa aktif yang bisa ditambahkan.
                </p>
              ) : (
                candidateStudents.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={pickedIds.includes(s.id)}
                      onChange={() => togglePicked(s.id)}
                      className="accent-emerald-600"
                    />
                    <span className="font-semibold text-slate-800 flex-1">{s.nama}</span>
                    <span className="text-slate-400">{classes.find((c) => c.id === s.kelasId)?.nama || '-'}</span>
                  </label>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddParticipantModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={pickedIds.length === 0}
                onClick={handleSaveParticipants}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Tambahkan {pickedIds.length > 0 ? `(${pickedIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-display font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              {editingEventId ? 'Edit Event & Iuran Insidentil' : 'Buat Event & Iuran Insidentil Baru'}
            </h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Event / Kejuaraan
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Contoh: Piala Walikota Cup ${getCurrentYear()}`}
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Biaya Keikutsertaan per Siswa (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={newEventFee}
                  onChange={(e) => setNewEventFee(Number(e.target.value))}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {editingEventId && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Mengubah biaya ikut memperbarui tagihan peserta; pembayaran yang sudah masuk tetap tercatat.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Kegiatan
                </label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Pertandingan / GOR
                </label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  placeholder="Contoh: Kolam Renang Tirta Kencana"
                  className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Simpan Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
