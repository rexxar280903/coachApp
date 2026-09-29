import React, { useState } from 'react';
import { Student, ClassGroup, ClubEvent, EventParticipant } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { Plus, ChevronDown, CheckCircle2, Clock, XCircle, Award, Calendar, MapPin, Sparkles } from 'lucide-react';

interface IuranInsidentilViewProps {
  events: ClubEvent[];
  eventParticipants: EventParticipant[];
  students: Student[];
  classes: ClassGroup[];
  initialEventId?: string;
  onOpenEventPaymentModal: (event: ClubEvent, participant: EventParticipant, student: Student, classGroup: ClassGroup) => void;
  onAddNewEvent: (newEvent: ClubEvent) => void;
}

export const IuranInsidentilView: React.FC<IuranInsidentilViewProps> = ({
  events,
  eventParticipants,
  students,
  classes,
  initialEventId,
  onOpenEventPaymentModal,
  onAddNewEvent,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || events[0]?.id || '');
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);
  const [newEventName, setNewEventName] = useState<string>('');
  const [newEventFee, setNewEventFee] = useState<number>(300000);
  const [newEventDate, setNewEventDate] = useState<string>('');
  const [newEventLocation, setNewEventLocation] = useState<string>('GOR Kertajaya Surabaya');

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const currentParticipants = eventParticipants.filter((p) => p.eventId === currentEvent?.id);
  const lunasCount = currentParticipants.filter((p) => p.status === 'lunas').length;
  const lunasPercentage = currentParticipants.length > 0 
    ? Math.round((lunasCount / currentParticipants.length) * 100) 
    : 0;

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName) return;

    const newEvt: ClubEvent = {
      id: 'evt-' + Date.now(),
      nama: newEventName,
      deskripsi: 'Kegiatan insidentil dan kejuaraan',
      nominal: Number(newEventFee),
      tanggal: newEventDate || new Date().toISOString().split('T')[0],
      lokasi: newEventLocation,
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
      alert(`Iuran ${currentEvent.nama} untuk ${std.nama} sudah lunas.`);
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

            <button
              onClick={() => setShowAddEventModal(true)}
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
          <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            {currentParticipants.length} Peserta Terdaftar
          </span>
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
                    Belum ada siswa yang didaftarkan pada event ini.
                  </td>
                </tr>
              ) : (
                currentParticipants.map((part, idx) => {
                  const std = students.find((s) => s.id === part.siswaId);
                  const isLunas = part.status === 'lunas';

                  return (
                    <tr key={part.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {std?.nama || 'Siswa'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {std?.kelasId.toUpperCase() || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {formatRupiah(part.nominal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLunas ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" /> Belum Lunas
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {part.kuitansiId || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isLunas ? (
                          <button
                            onClick={() => handleRowClick(part)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                          >
                            Bayar Sekarang
                          </button>
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

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-display font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Buat Event & Iuran Insidentil Baru
            </h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Event / Kejuaraan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Piala Walikota Cup 2024"
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
