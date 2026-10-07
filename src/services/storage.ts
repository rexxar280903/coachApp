/**
 * Lapisan data (Supabase).
 *
 * Aplikasi menyimpan seluruh state di memori (Workspace.tsx) dan memanggil `saveX(list)`
 * setelah setiap perubahan. Di sini `saveX` membandingkan list baru dengan snapshot
 * terakhir (saat dipanggil, termasuk penulisan yang masih antre), lalu hanya meng-upsert
 * baris yang berubah dan menghapus baris yang hilang. Penulisan per tabel diserialkan agar
 * tidak saling menimpa. Kegagalan dilaporkan lewat `setSyncErrorHandler`.
 */
import {
  Student,
  Coach,
  ClassGroup,
  MonthlyDueRecord,
  ClubEvent,
  EventParticipant,
  AttendanceSession,
  PaymentTransaction,
  ClubProfile,
  PaymentSubmission,
  RaporTemplate,
  RaporFolder,
  RaporEntry,
} from '../types/sportkit';
import { supabase, SUPABASE_URL } from './supabase';
import { dataUrlToBlob } from '../utils/image';
import { generateKodeAkses } from '../utils/kodeAkses';

// ─── Pemetaan baris ↔ objek ──────────────────────────────────────────────────

type Obj = Record<string, any>;

/** Nama kolom yang tidak mengikuti aturan camelCase → snake_case biasa (mis. "WhatsApp" satu kata). */
const SNAKE_EXCEPTIONS: Record<string, string> = { noWhatsApp: 'no_whatsapp' };

const toSnake = (s: string) =>
  SNAKE_EXCEPTIONS[s] ?? s.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());

interface TableDef {
  table: string;
  /** Properti objek (camelCase) yang menjadi kolom (snake_case). */
  cols: string[];
  /** Kolom yang boleh null di database: `undefined` dikirim sebagai null (agar nilai lama terhapus). */
  nullable?: string[];
  /**
   * Kolom yang ditambahkan pada versi skema yang lebih baru. Bila database belum diperbarui
   * (schema.sql belum dijalankan ulang), kolom ini dilewati saat menulis alih-alih menggagalkan
   * seluruh penyimpanan.
   */
  optional?: string[];
  /** Urutan tampil setelah reload (aplikasi menaruh data baru di depan / belakang). */
  order: 'asc' | 'desc';
}

const T = {
  students: {
    table: 'students',
    cols: [
      'id', 'nama', 'kelasId', 'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'noHp', 'email', 'alamat',
      'orangTua', 'status', 'catatan', 'tanggalBergabung', 'tanggalStatus', 'biayaPendaftaran', 'iuranBulanan',
      'totalBiayaPendaftaran', 'foto', 'kodeAkses',
    ],
    nullable: ['email', 'catatan', 'foto', 'tanggalStatus'],
    optional: ['tanggalStatus'],
    order: 'desc',
  },
  coaches: {
    table: 'coaches',
    cols: ['id', 'nama', 'noHp', 'email', 'spesialisasi', 'status', 'catatan', 'tanggalBergabung', 'foto'],
    nullable: ['email', 'catatan', 'foto'],
    order: 'asc',
  },
  classes: {
    table: 'classes',
    cols: ['id', 'nama', 'deskripsi', 'iuranBulanan', 'biayaPendaftaran', 'pelatihIds', 'pelatih'],
    order: 'asc',
  },
  monthlyDues: {
    table: 'monthly_dues',
    cols: ['id', 'siswaId', 'tahun', 'bulan', 'status', 'nominal', 'terbayar', 'tanggalBayar', 'kuitansiId'],
    nullable: ['tanggalBayar', 'kuitansiId'],
    order: 'asc',
  },
  events: {
    table: 'events',
    cols: ['id', 'nama', 'deskripsi', 'nominal', 'tanggal', 'lokasi', 'totalPeserta', 'pesertaLunas'],
    order: 'desc',
  },
  eventParticipants: {
    table: 'event_participants',
    cols: ['id', 'eventId', 'siswaId', 'status', 'nominal', 'terbayar', 'tanggalBayar', 'kuitansiId'],
    nullable: ['tanggalBayar', 'kuitansiId'],
    order: 'asc',
  },
  attendance: {
    table: 'attendance_sessions',
    cols: ['id', 'tanggal', 'kelasId', 'catatan', 'pelatihId', 'pelatih', 'kehadiran'],
    nullable: ['pelatihId'],
    order: 'desc',
  },
  transactions: {
    table: 'transactions',
    cols: [
      'id', 'nomorKuitansi', 'siswaId', 'siswaNama', 'kelasNama', 'tanggal', 'nominal', 'terbilang',
      'metodePembayaran', 'tipe', 'keterangan', 'catatan',
    ],
    nullable: ['catatan'],
    order: 'desc',
  },
  submissions: {
    table: 'payment_submissions',
    cols: [
      'id', 'siswaId', 'siswaNama', 'kelasId', 'kelasNama', 'tipe', 'bulan', 'tahun', 'eventId', 'eventNama',
      'nominal', 'metodePembayaran', 'tanggalTransfer', 'buktiGambarUrl', 'pesanSiswa', 'status', 'tanggalKirim',
      'tanggalVerifikasi', 'diverifikasiOleh', 'catatanAdmin', 'kuitansiId', 'transactionId',
    ],
    nullable: [
      'bulan', 'tahun', 'eventId', 'eventNama', 'pesanSiswa', 'tanggalVerifikasi', 'diverifikasiOleh',
      'catatanAdmin', 'kuitansiId', 'transactionId',
    ],
    order: 'desc',
  },
  raporTemplates: {
    table: 'rapor_templates',
    cols: ['id', 'nama', 'header', 'items', 'footer'],
    order: 'asc',
  },
  raporFolders: {
    table: 'rapor_folders',
    cols: ['id', 'nama', 'awalPenilaian', 'akhirPenilaian', 'kelasId', 'templateId', 'diterbitkan'],
    order: 'desc',
  },
  raporEntries: {
    table: 'rapor_entries',
    cols: ['id', 'folderId', 'siswaId', 'jawaban', 'diisiOleh', 'tanggalIsi'],
    order: 'asc',
  },
} satisfies Record<string, TableDef>;

export function toRow(def: TableDef, item: Obj): Obj {
  const row: Obj = {};
  for (const c of def.cols) {
    const v = item[c];
    if (v === undefined) {
      // Kolom NOT NULL dilewati agar default database berlaku (mis. kode_akses).
      if (def.nullable?.includes(c)) row[toSnake(c)] = null;
      continue;
    }
    row[toSnake(c)] = v;
  }
  return row;
}

export function fromRow<T>(def: TableDef, row: Obj): T {
  const obj: Obj = {};
  for (const c of def.cols) {
    const v = row[toSnake(c)];
    if (v !== null && v !== undefined) obj[c] = v;
  }
  return obj as T;
}

// ─── Upload gambar ───────────────────────────────────────────────────────────

const PROOF_BUCKET = 'payment-proofs';
const AVATAR_BUCKET = 'avatars';
const SIGNED_URL_TTL = 60 * 60 * 8; // 8 jam
const SIGN_PREFIX = `${SUPABASE_URL}/storage/v1/object/sign/${PROOF_BUCKET}/`;

const isDataUrl = (v: unknown): boolean => typeof v === 'string' && v.startsWith('data:');
const uuid = () => crypto.randomUUID();

// "bucket:data URL" yang sudah diunggah → hasil unggahan (hindari unggah ganda saat baris yang sama disimpan lagi).
const uploadMemo = new Map<string, string>();

function extFor(dataUrl: string): 'jpg' | 'png' | 'webp' | null {
  if (dataUrl.startsWith('data:image/jpeg')) return 'jpg';
  if (dataUrl.startsWith('data:image/png')) return 'png';
  if (dataUrl.startsWith('data:image/webp')) return 'webp';
  return null;
}

/** Unggah ke bucket publik `avatars` dan kembalikan URL publiknya. */
async function uploadAvatar(dataUrl: string, folder: string): Promise<string> {
  const memoKey = `${AVATAR_BUCKET}:${dataUrl}`;
  const memo = uploadMemo.get(memoKey);
  if (memo) return memo;
  const ext = extFor(dataUrl);
  if (!ext) throw new Error('Format gambar tidak didukung (gunakan JPG, PNG, atau WebP).');
  const path = `${folder}/${uuid()}.${ext}`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, dataUrlToBlob(dataUrl), {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  });
  if (error) throw new Error(`Gagal mengunggah foto: ${error.message}`);
  const url = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
  uploadMemo.set(memoKey, url);
  return url;
}

/** Unggah ke bucket privat `payment-proofs` dan kembalikan path-nya. */
export async function uploadPaymentProof(dataUrl: string): Promise<string> {
  const memoKey = `${PROOF_BUCKET}:${dataUrl}`;
  const memo = uploadMemo.get(memoKey);
  if (memo) return memo;
  const ext = extFor(dataUrl);
  if (!ext) throw new Error('Format bukti transfer tidak didukung (gunakan JPG, PNG, atau WebP).');
  const path = `${uuid()}.${ext}`;
  const { error } = await supabase.storage.from(PROOF_BUCKET).upload(path, dataUrlToBlob(dataUrl), {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
  });
  if (error) throw new Error(`Gagal mengunggah bukti transfer: ${error.message}`);
  uploadMemo.set(memoKey, path);
  return path;
}

/** Path bukti dari nilai yang tersimpan di state (data URL baru, signed URL, atau path). */
async function toProofPath(value: string): Promise<string> {
  if (!value) return '';
  if (isDataUrl(value)) {
    // SVG placeholder lama bukan bukti nyata → dikosongkan.
    return extFor(value) ? uploadPaymentProof(value) : '';
  }
  if (SUPABASE_URL && value.startsWith(SIGN_PREFIX)) {
    return decodeURIComponent(value.slice(SIGN_PREFIX.length).split('?')[0]);
  }
  return value;
}

async function withSignedProofUrls(subs: PaymentSubmission[]): Promise<PaymentSubmission[]> {
  const paths = [...new Set(subs.map((s) => s.buktiGambarUrl).filter((p) => p && !p.startsWith('http') && !isDataUrl(p)))];
  if (paths.length === 0) return subs;
  const { data, error } = await supabase.storage.from(PROOF_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
  // Jika gagal, path asli dipertahankan di state (gambar tampak rusak, tetapi tidak menimpa path saat disimpan).
  if (error || !data) return subs;
  const byPath = new Map(data.map((d) => [d.path ?? '', d.signedUrl ?? '']));
  return subs.map((s) => ({ ...s, buktiGambarUrl: byPath.get(s.buktiGambarUrl) || s.buktiGambarUrl }));
}

// ─── Baca & tulis tabel ──────────────────────────────────────────────────────

const PAGE = 1000;
const snapshots = new Map<string, Map<string, string>>();
const queues = new Map<string, Promise<unknown>>();
/** Kolom opsional yang ternyata belum ada di database, format "tabel.kolom". */
const missingColumns = new Set<string>();
let syncErrorHandler: ((table: string, error: Error) => void) | null = null;

export function setSyncErrorHandler(fn: ((table: string, error: Error) => void) | null) {
  syncErrorHandler = fn;
}

/** Tunggu semua penulisan yang masih antre selesai (dipakai sebelum memuat ulang data). */
export async function waitForPendingSaves(): Promise<void> {
  await Promise.all([...queues.values()]);
}

async function fetchAll<T extends { id: string }>(def: TableDef): Promise<T[]> {
  const rows: Obj[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(def.table)
      .select('*')
      .order('created_at', { ascending: def.order === 'asc' })
      .order('id', { ascending: def.order === 'asc' })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Gagal memuat ${def.table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows.map((r) => fromRow<T>(def, r));
}

async function load<T extends { id: string }>(def: TableDef): Promise<T[]> {
  const items = await fetchAll<T>(def);
  snapshots.set(def.table, new Map(items.map((i) => [i.id, JSON.stringify(i)])));
  return items;
}

/** Siapkan satu item untuk dikirim: unggah gambar baru dan ganti dengan referensi storage. */
type Prepare = (row: Obj, item: Obj) => Promise<Obj>;

/** Nama kolom dari galat PostgREST "Could not find the 'x' column of 'y' in the schema cache". */
function missingColumnOf(message: string): string | null {
  return /could not find the '([^']+)' column/i.exec(message)?.[1] ?? null;
}

async function upsertRows(def: TableDef, rows: Obj[]): Promise<void> {
  const optional = (def.optional ?? []).map(toSnake);
  for (;;) {
    const payload = rows.map((row) => {
      const out = { ...row };
      for (const key of Object.keys(out)) if (missingColumns.has(`${def.table}.${key}`)) delete out[key];
      return out;
    });
    const { error } = await supabase.from(def.table).upsert(payload, { onConflict: 'id', defaultToNull: false });
    if (!error) return;
    // Database belum diperbarui: lewati kolom opsional itu lalu coba lagi, daripada semua penyimpanan gagal.
    const col = missingColumnOf(error.message);
    if (col && optional.includes(col) && !missingColumns.has(`${def.table}.${col}`)) {
      missingColumns.add(`${def.table}.${col}`);
      console.warn(`[storage] Kolom ${def.table}.${col} belum ada di database. Jalankan ulang supabase/schema.sql.`);
      continue;
    }
    throw new Error(error.message);
  }
}

async function writeChanges<T extends { id: string }>(
  def: TableDef,
  changed: T[],
  removedIds: string[],
  prepare?: Prepare,
): Promise<void> {
  if (changed.length > 0) {
    const rows = await Promise.all(
      changed.map(async (item) => {
        const row = toRow(def, item);
        return prepare ? prepare(row, item) : row;
      }),
    );
    await upsertRows(def, rows);
  }
  // Hapus per potongan agar URL permintaan tidak terlalu panjang.
  for (let i = 0; i < removedIds.length; i += 100) {
    const { error } = await supabase.from(def.table).delete().in('id', removedIds.slice(i, i + 100));
    if (error) throw new Error(error.message);
  }
}

/**
 * Selisih dihitung saat dipanggil terhadap snapshot terakhir (sudah termasuk penulisan yang masih
 * antre) dan snapshot langsung diperbarui. Dengan begitu penulisan yang antre tidak pernah dihitung
 * ulang terhadap data hasil muat ulang (yang bisa membuat baris milik admin lain ikut terhapus).
 * Bila penulisan gagal, handler galat memuat ulang semua data sehingga snapshot kembali sesuai server.
 * Mengembalikan `true` bila tersimpan.
 */
function save<T extends { id: string }>(def: TableDef, list: T[], prepare?: Prepare): Promise<boolean> {
  const prev = snapshots.get(def.table) ?? new Map<string, string>();
  const next = new Map(list.map((i) => [i.id, JSON.stringify(i)]));
  const changed = list.filter((i) => prev.get(i.id) !== next.get(i.id));
  const removedIds = [...prev.keys()].filter((id) => !next.has(id));
  snapshots.set(def.table, next);
  if (changed.length === 0 && removedIds.length === 0) return Promise.resolve(true);

  const run = (queues.get(def.table) ?? Promise.resolve()).then(() => writeChanges(def, changed, removedIds, prepare));
  const settled = run.then(
    () => true,
    (e: Error) => {
      syncErrorHandler?.(def.table, e);
      return false;
    },
  );
  queues.set(def.table, settled);
  return settled;
}

const prepareFoto: Prepare = async (row, item) => {
  if (isDataUrl(item.foto)) row.foto = await uploadAvatar(item.foto, 'people');
  return row;
};

// Kode akses yang dibuat di sini untuk siswa tanpa kode (dipakai ulang agar tidak berganti tiap disimpan).
const generatedKode = new Map<string, string>();

// Upsert massal mengisi kolom yang hilang dengan default → pastikan kode akses selalu ikut terkirim,
// supaya siswa lama tidak mendapat kode baru setiap disimpan.
const prepareStudent: Prepare = async (row, item) => {
  const out = await prepareFoto(row, item);
  if (!out.kode_akses) {
    const kode = generatedKode.get(item.id) ?? generateKodeAkses();
    generatedKode.set(item.id, kode);
    out.kode_akses = kode;
  }
  return out;
};

const prepareProof: Prepare = async (row, item) => {
  row.bukti_gambar_url = await toProofPath(item.buktiGambarUrl ?? '');
  return row;
};

// ─── API publik (dipakai App.tsx) ────────────────────────────────────────────

export const getStudents = () => load<Student>(T.students);
export const saveStudents = (list: Student[]) => save(T.students, list, prepareStudent);

export const getCoaches = () => load<Coach>(T.coaches);
export const saveCoaches = (list: Coach[]) => save(T.coaches, list, prepareFoto);

export const getClasses = () => load<ClassGroup>(T.classes);
export const saveClasses = (list: ClassGroup[]) => save(T.classes, list);

export const getMonthlyDues = () => load<MonthlyDueRecord>(T.monthlyDues);
export const saveMonthlyDues = (list: MonthlyDueRecord[]) => save(T.monthlyDues, list);

export const getEvents = () => load<ClubEvent>(T.events);
export const saveEvents = (list: ClubEvent[]) => save(T.events, list);

export const getEventParticipants = () => load<EventParticipant>(T.eventParticipants);
export const saveEventParticipants = (list: EventParticipant[]) => save(T.eventParticipants, list);

export const getAttendanceSessions = () => load<AttendanceSession>(T.attendance);
export const saveAttendanceSessions = (list: AttendanceSession[]) => save(T.attendance, list);

export const getRaporTemplates = () => load<RaporTemplate>(T.raporTemplates);
export const saveRaporTemplates = (list: RaporTemplate[]) => save(T.raporTemplates, list);

export const getRaporFolders = () => load<RaporFolder>(T.raporFolders);
export const saveRaporFolders = (list: RaporFolder[]) => save(T.raporFolders, list);

export const getRaporEntries = () => load<RaporEntry>(T.raporEntries);
export const saveRaporEntries = (list: RaporEntry[]) => save(T.raporEntries, list);

export async function getTransactions(): Promise<PaymentTransaction[]> {
  const items = await load<PaymentTransaction>(T.transactions);
  rememberReceipts(items.map((t) => t.nomorKuitansi));
  return items;
}
export function saveTransactions(list: PaymentTransaction[]) {
  rememberReceipts(list.map((t) => t.nomorKuitansi));
  return save(T.transactions, list);
}

export async function getPaymentSubmissions(): Promise<PaymentSubmission[]> {
  const raw = await load<PaymentSubmission>(T.submissions);
  // Snapshot memakai nilai yang tersimpan di state (URL bertanda tangan), konsisten dengan saat disimpan lagi.
  const signed = await withSignedProofUrls(raw);
  rememberReceipts(signed.map((s) => s.kuitansiId));
  snapshots.set(T.submissions.table, new Map(signed.map((i) => [i.id, JSON.stringify(i)])));
  return signed;
}
export function savePaymentSubmissions(list: PaymentSubmission[]) {
  rememberReceipts(list.map((s) => s.kuitansiId));
  return save(T.submissions, list, prepareProof);
}

// Profil klub (satu baris, id = 1)
const PROFILE_COLS = [
  'namaKlub', 'cabangOlahraga', 'alamat', 'kota', 'noHp', 'email', 'noWhatsApp', 'logoUrl',
  'namaBank', 'noRekening', 'atasNama',
];
const PROFILE_NULLABLE = ['logoUrl', 'namaBank', 'noRekening', 'atasNama'];

export async function getClubProfile(): Promise<ClubProfile> {
  const { data, error } = await supabase.from('club_profile').select('*').eq('id', 1).maybeSingle();
  if (error) throw new Error(`Gagal memuat profil klub: ${error.message}`);
  const row = data ?? {};
  return fromRow<ClubProfile>({ table: 'club_profile', cols: PROFILE_COLS, order: 'asc' }, row);
}

/** Mengembalikan `true` bila tersimpan (kegagalan dilaporkan lewat handler galat sinkronisasi). */
export async function saveClubProfile(profile: ClubProfile): Promise<boolean> {
  try {
    const rawLogo = profile.logoUrl;
    const logoUrl = rawLogo && isDataUrl(rawLogo) ? await uploadAvatar(rawLogo, 'club') : rawLogo;
    const row = toRow({ table: 'club_profile', cols: PROFILE_COLS, nullable: PROFILE_NULLABLE, order: 'asc' }, { ...profile, logoUrl });
    const { error } = await supabase.from('club_profile').upsert({ id: 1, ...row }, { onConflict: 'id' });
    if (error) throw new Error(error.message);
    return true;
  } catch (e) {
    syncErrorHandler?.('club_profile', e as Error);
    return false;
  }
}

// Nomor kuitansi yang sudah dikenal di sesi ini (dimuat dari server + yang baru dibuat).
const knownReceipts = new Set<string>();

function rememberReceipts(numbers: (string | undefined)[]) {
  for (const n of numbers) if (n) knownReceipts.add(n);
}

function receiptPrefix(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  return `INVSP-${yy}${mm}${dd}-`;
}

/**
 * Ambil nomor kuitansi hari ini yang sudah ada di server (mis. dibuat admin lain / perangkat lain
 * setelah halaman ini dimuat), supaya `generateReceiptNumber` tidak menghasilkan nomor yang sama.
 * Dipanggil saat form pembayaran / verifikasi dibuka. Gagal jaringan diabaikan.
 */
export async function refreshReceiptNumbers(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('nomor_kuitansi')
      .like('nomor_kuitansi', `${receiptPrefix()}%`);
    if (!error && data) rememberReceipts(data.map((r) => r.nomor_kuitansi as string));
  } catch {
    /* tetap pakai nomor yang sudah dikenal */
  }
}

/**
 * Nomor kuitansi berurutan per hari: INVSP-YYMMDD-NNN. Urutan diambil dari nomor terbesar
 * yang dikenal untuk hari ini (lihat `refreshReceiptNumbers`). Indeks unik di database
 * (transactions.nomor_kuitansi) menjadi pengaman terakhir bila dua admin membuat nomor bersamaan.
 */
export function generateReceiptNumber(): string {
  const prefix = receiptPrefix();

  let maxSeq = 0;
  for (const no of knownReceipts) {
    if (!no.startsWith(prefix)) continue;
    const seq = parseInt(no.slice(prefix.length), 10);
    if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
  }
  const next = `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
  knownReceipts.add(next);
  return next;
}

// ─── Pendaftaran publik & portal siswa (tanpa akun Auth) ─────────────────────

export interface PortalCredentials {
  hp: string;
  kode: string;
}

export interface PortalBundle {
  student: Student;
  classes: ClassGroup[];
  monthlyDues: MonthlyDueRecord[];
  attendanceSessions: AttendanceSession[];
  transactions: PaymentTransaction[];
  submissions: PaymentSubmission[];
  raporTemplates: RaporTemplate[];
  raporFolders: RaporFolder[];
  raporEntries: RaporEntry[];
  profile: ClubProfile;
}

// Pratinjau bukti yang baru dikirim siswa pada sesi ini (path di bucket privat tidak bisa dibuka siswa).
const localProofPreviews = new Map<string, string>();

function rpcMessage(error: { message: string }): Error {
  return new Error(error.message);
}

/** Mengembalikan null jika No. HP / kode akses tidak cocok. */
export async function portalLogin({ hp, kode }: PortalCredentials): Promise<PortalBundle | null> {
  const { data, error } = await supabase.rpc('portal_data', { p_hp: hp, p_kode: kode });
  if (error) throw rpcMessage(error);
  if (!data) return null;
  const b = data as Obj;
  return {
    student: fromRow<Student>(T.students, b.student),
    classes: (b.classes as Obj[]).map((r) => fromRow<ClassGroup>(T.classes, r)),
    monthlyDues: (b.monthly_dues as Obj[]).map((r) => fromRow<MonthlyDueRecord>(T.monthlyDues, r)),
    attendanceSessions: (b.attendance_sessions as Obj[]).map((r) => fromRow<AttendanceSession>(T.attendance, r)),
    transactions: (b.transactions as Obj[]).map((r) => fromRow<PaymentTransaction>(T.transactions, r)),
    submissions: (b.payment_submissions as Obj[]).map((r) => {
      const s = fromRow<PaymentSubmission>(T.submissions, r);
      return { ...s, buktiGambarUrl: localProofPreviews.get(s.buktiGambarUrl) ?? '' };
    }),
    // Kunci rapor_* belum ada bila schema.sql di server belum diperbarui.
    raporTemplates: ((b.rapor_templates ?? []) as Obj[]).map((r) => fromRow<RaporTemplate>(T.raporTemplates, r)),
    raporFolders: ((b.rapor_folders ?? []) as Obj[]).map((r) => fromRow<RaporFolder>(T.raporFolders, r)),
    raporEntries: ((b.rapor_entries ?? []) as Obj[]).map((r) => fromRow<RaporEntry>(T.raporEntries, r)),
    profile: fromRow<ClubProfile>({ table: 'club_profile', cols: PROFILE_COLS, order: 'asc' }, b.club_profile ?? {}),
  };
}

export async function portalSubmitPayment(
  creds: PortalCredentials,
  input: Pick<PaymentSubmission, 'bulan' | 'tahun' | 'nominal' | 'metodePembayaran' | 'tanggalTransfer' | 'pesanSiswa'> & {
    buktiGambarUrl: string;
  },
): Promise<void> {
  if (!isDataUrl(input.buktiGambarUrl)) throw new Error('Bukti transfer wajib diunggah.');
  const path = await uploadPaymentProof(input.buktiGambarUrl);
  const { error } = await supabase.rpc('portal_submit_payment', {
    p_hp: creds.hp,
    p_kode: creds.kode,
    p: {
      bulan: input.bulan,
      tahun: input.tahun,
      nominal: input.nominal,
      metode_pembayaran: input.metodePembayaran,
      tanggal_transfer: input.tanggalTransfer,
      pesan_siswa: input.pesanSiswa,
      bukti_path: path,
    },
  });
  if (error) throw rpcMessage(error);
  localProofPreviews.set(path, input.buktiGambarUrl);
}

export async function registerPublic(s: Student): Promise<void> {
  const { error } = await supabase.rpc('public_register', {
    p: {
      nama: s.nama,
      kelas_id: s.kelasId,
      jenis_kelamin: s.jenisKelamin,
      tempat_lahir: s.tempatLahir,
      tanggal_lahir: s.tanggalLahir,
      no_hp: s.noHp,
      email: s.email ?? null,
      alamat: s.alamat,
      orang_tua: s.orangTua,
      catatan: s.catatan ?? null,
    },
  });
  if (error) throw rpcMessage(error);
}
