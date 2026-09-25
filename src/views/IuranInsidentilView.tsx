import React, { useState } from 'react';
import { Student, ClassGroup, ClubEvent, EventParticipant } from '../types/sportkit';
import { formatRupiah } from '../utils/numberToWordsId';
import { Plus, ChevronDown, CheckCircle2, Clock, XCircle, Award } from 'lucide-react';

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
      {/* Top Banner (matching video timestamp 02:56) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {currentEvent ? currentEvent.nama : 'Iuran Insidentil'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                Insidentil
              </span>
            </div>
            {currentEvent && (
              <p className="text-base font-bold text-slate-700 mt-1">
                {formatRupiah(currentEvent.nominal)}{' '}
                <span className="text-sm font-semibold text-blue-800">
                  ({lunasCount}/{currentParticipants.length} lunas)
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Event Selector Dropdown */}
            <div className="relative min-w-[240px]">
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none pr-8"
              >
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>

            <button
              onClick={() => setShowAddEventModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Participants Table (matching video timestamp 02:56) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs font-bold">
                <th className="py-3 px-4 border border-slate-800 w-12 text-center">No</th>
                <th className="py-3 px-4 border border-slate-800">Nama Siswa</th>
                <th className="py-3 px-4 border border-slate-800 text-center w-36">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {currentParticipants.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">
                    Belum ada peserta terdaftar di event ini.
                  </td>
                </tr>
              ) : (
                currentParticipants.map((part, index) => {
                  const student = students.find((s) => s.id === part.siswaId);
                  const isLunas = part.status === 'lunas';
                  const isPartial = part.status === 'belum_lunas';

                  return (
                    <tr
                      key={part.id}
                      onClick={() => handleRowClick(part)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-600 text-center border-r border-slate-200">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-blue-900 border-r border-slate-200 text-sm">
                        <span>{student ? student.nama : 'Siswa'}</span>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-center font-bold transition-all ${
                          isLunas
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : isPartial
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white animate-pulse-subtle'
                        }`}
                        title="Klik untuk proses pembayaran"
                      >
                        <div className="flex items-center justify-center gap-1">
                          {isLunas ? '✓ LUNAS' : isPartial ? '½ SEBAGIAN' : 'BELUM BAYAR'}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-6 text-xs text-slate-700">
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
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Tambah Event Insidentil Baru</h3>
            <p className="text-xs text-slate-500 mb-4">
              Buat kategori pembayaran insidentil seperti turnamen, gathering, atau jersey.
            </p>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Event *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kejurnas Basket Remaja 2024"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biaya Iuran (Rp) *</label>
                <input
                  type="number"
                  required
                  min={10000}
                  step={10000}
                  value={newEventFee}
                  onChange={(e) => setNewEventFee(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lokasi</label>
                <input
                  type="text"
                  value={newEventLocation}
                  onChange={(e) => setNewEventLocation(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
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
