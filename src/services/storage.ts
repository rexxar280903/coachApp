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
  FeeStatus,
  PaymentSubmission 
} from '../types/sportkit';


const STORAGE_KEYS = {
  STUDENTS: 'sportkit_students_v2',
  COACHES: 'sportkit_coaches_v1',
  CLASSES: 'sportkit_classes_v2',
  MONTHLY_DUES: 'sportkit_monthly_dues_v2',
  EVENTS: 'sportkit_events_v2',
  EVENT_PARTICIPANTS: 'sportkit_event_participants_v2',
  ATTENDANCE: 'sportkit_attendance_v2',
  TRANSACTIONS: 'sportkit_transactions_v2',
  PROFILE: 'sportkit_profile_v2',
  PAYMENT_SUBMISSIONS: 'sportkit_payment_submissions_v2',
};

/**
 * Baca & parse JSON dari localStorage dengan aman. Data rusak (bukan JSON valid)
 * tidak membuat aplikasi crash — fallback dipakai dan data rusak dicatat di console.
 */
function readJSON<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
    return parsed as T;
  } catch (err) {
    console.error(`[storage] Data "${key}" rusak, memakai nilai default.`, err);
    return fallback;
  }
}

export const INITIAL_CLASSES: ClassGroup[] = [
  {
    id: 'ku-10',
    nama: 'KU-10',
    deskripsi: 'Kelompok Umur 10 Tahun (Basket & Atletik Junior)',
    iuranBulanan: 100000,
    biayaPendaftaran: 1000000,
    pelatih: 'Coach Dimas & Coach Rian',
  },
  {
    id: 'ku-12',
    nama: 'KU-12',
    deskripsi: 'Kelompok Umur 12 Tahun (Persiapan Kompetisi)',
    iuranBulanan: 120000,
    biayaPendaftaran: 1200000,
    pelatih: 'Coach Wahyu',
  },
  {
    id: 'ku-14',
    nama: 'KU-14',
    deskripsi: 'Kelompok Umur 14 Tahun (Akademi Prestasi)',
    iuranBulanan: 150000,
    biayaPendaftaran: 1350000,
    pelatih: 'Coach Hendra',
  },
  {
    id: 'renang-acm-1',
    nama: 'RENANG ACM 1',
    deskripsi: 'Kelas Renang Pemula & Teknik Dasar',
    iuranBulanan: 150000,
    biayaPendaftaran: 1000000,
    pelatih: 'Coach Sarah',
  },
  {
    id: 'renang-acm-2',
    nama: 'RENANG ACM 2',
    deskripsi: 'Kelas Renang Lanjutan & Endurance',
    iuranBulanan: 175000,
    biayaPendaftaran: 1000000,
    pelatih: 'Coach Sarah',
  },
  {
    id: 'english-class-v',
    nama: 'ENGLISH CLASS V',
    deskripsi: 'Kelas Pengantar Olahraga Berbahasa Inggris',
    iuranBulanan: 100000,
    biayaPendaftaran: 800000,
    pelatih: 'Coach Michael',
  },
];

export const INITIAL_PROFILE: ClubProfile = {
  namaKlub: 'CLS SURABAYA',
  cabangOlahraga: 'Basket, Renang & Akademi Olahraga',
  alamat: 'GOR Kertajaya, Kertajaya Indah Timur I No.1, Manyar Sabrangan, Kec. Mulyorejo',
  kota: 'Surabaya, Jawa Timur 60116',
  noHp: '0897-2488-333',
  email: 'admin@sportkit.id',
  noWhatsApp: '628972488333',
};

const SEED_STUDENT_NAMES_KU10 = [
  'Alya Adriana Zefira',
  'Alyaa Bening Bestari',
  'Amadis Nayyaro Hutagalung',
  'Amira Khansa Faizah',
  'Anindya Agfi Sasikirana',
  'Arsenio Mirza Digdoyono',
  'Azzahra Kinanthi Tyasutami',
  'Batrisyia Danish Ramadhana',
  'Cully Alma Renata',
  'Dahayu Margie Sayogo',
  'Dienussyifa Rindu Mori',
  'Fairuz Khalisa Nur Azzimi',
  'Farah Nadia Hadi Brata',
  'Fillo Navyandra Bintang Irawan',
  'Ghaisan Ghaits Fatih',
  'Kamila Syahira',
  'Karima Fayruzzani',
  'Keisha Aqila Najwa',
  'Khanza Ghayda Attaya Putri',
  'Khumaira Ardina Putri',
  'Kiara Anjani Putri',
  'Kuinsila Putri Falisha',
  'Maylinda Charylina',
  'Muchammad Syafrie Azmi',
  'Nabila Hidayatul Rizki',
  'Naura Maheera',
  'Rafa Azzamy Kautsar',
  'Raizel Alendra Nadhif',
  'Rasya Adya Faeyza',
  'Zul Imani',
];

function generateSeedData() {
  const students: Student[] = [];
  const monthlyDues: MonthlyDueRecord[] = [];
  const currentYear = 2024;

  // Active students in KU-10
  SEED_STUDENT_NAMES_KU10.forEach((nama, index) => {
    const id = `std-${index + 1}`;
    // Joined months: some joined Jan, some joined June (e.g. Kamila Syahira joined June)
    const joinMonth = nama === 'Kamila Syahira' ? 6 : (index % 4 === 0 ? 3 : 1);
    
    students.push({
      id,
      nama,
      kelasId: 'ku-10',
      jenisKelamin: index % 2 === 0 ? 'Perempuan' : 'Laki-laki',
      tempatLahir: 'Surabaya',
      tanggalLahir: '2014-05-12',
      noHp: `081234567${(10 + index).toString().padStart(3, '0')}`,
      email: `${nama.toLowerCase().replace(/\s+/g, '')}@mailnator.com`,
      alamat: 'Jl. Kertajaya Indah No. ' + (index + 12) + ', Surabaya',
      orangTua: {
        namaAyah: `Bpk. ${nama.split(' ')[0]} Senior`,
        noHpAyah: `081234567${(10 + index).toString().padStart(3, '0')}`,
        namaIbu: `Ibu ${nama.split(' ')[0]}`,
        noHpIbu: `081987654${(10 + index).toString().padStart(3, '0')}`,
      },
      status: 'Aktif',
      catatan: nama === 'Kamila Syahira' ? 'Siswa teladan, posisi Point Guard.' : 'Aktif latihan reguler.',
      tanggalBergabung: `2024-0${joinMonth}-01`,
      biayaPendaftaran: 1000000,
      iuranBulanan: 100000,
      totalBiayaPendaftaran: 1100000,
    });

    // Generate 12 months for 2024
    for (let m = 1; m <= 12; m++) {
      let status: FeeStatus = 'lunas';
      let terbayar = 100000;

      if (m < joinMonth) {
        status = 'belum_bergabung';
        terbayar = 0;
      } else if (m <= 10) { // Up to October is mostly paid
        if (index === 12 && m === 10) { // Farah Nadia paid partial in Oct
          status = 'belum_lunas';
          terbayar = 50000;
        } else {
          status = 'lunas';
          terbayar = 100000;
        }
      } else if (m === 11) { // November: some unpaid (like in video!)
        if (nama === 'Kamila Syahira' || index % 3 === 0 || index % 5 === 0) {
          status = 'belum_bayar';
          terbayar = 0;
        } else {
          status = 'lunas';
          terbayar = 100000;
        }
      } else { // December: mostly unpaid
        status = 'belum_bayar';
        terbayar = 0;
      }

      monthlyDues.push({
        id: `due-${id}-2024-${m}`,
        siswaId: id,
        tahun: 2024,
        bulan: m,
        status,
        nominal: 100000,
        terbayar,
        tanggalBayar: status === 'lunas' ? `2024-${m.toString().padStart(2, '0')}-05` : undefined,
        kuitansiId: status === 'lunas' ? `INVSP-24${m.toString().padStart(2, '0')}05-${(index + 10).toString().padStart(3, '0')}` : undefined,
      });
    }
  });

  // Applicants (Calon Siswa) matching video (John Doe & testingxxx)
  const applicants: Student[] = [
    {
      id: 'app-1',
      nama: 'John Doe',
      kelasId: 'ku-10',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Surabaya',
      tanggalLahir: '2014-03-15',
      noHp: '0813564789',
      email: 'johndoe@gmail.com',
      alamat: 'Jl. Manyar Rejo No. 44, Surabaya',
      orangTua: {
        namaAyah: 'Robert Doe',
        noHpAyah: '0813564789',
        namaIbu: 'Maria Doe',
        noHpIbu: '0813564790',
      },
      status: 'Calon',
      catatan: 'Daftar mandiri via web bio Instagram.',
      tanggalBergabung: '2024-11-05',
      biayaPendaftaran: 1000000,
      iuranBulanan: 100000,
      totalBiayaPendaftaran: 1100000,
    },
    {
      id: 'app-2',
      nama: 'testingxxx',
      kelasId: 'ku-12',
      jenisKelamin: 'Laki-laki',
      tempatLahir: 'Sidoarjo',
      tanggalLahir: '2012-08-20',
      noHp: '082199887766',
      email: 'testing@example.com',
      alamat: 'Puri Surya Jaya Blok B, Sidoarjo',
      orangTua: {
        namaAyah: 'Budi Santoso',
        noHpAyah: '082199887766',
        namaIbu: 'Siti Rahma',
        noHpIbu: '082199887767',
      },
      status: 'Calon',
      catatan: 'Ingin mencoba trial class.',
      tanggalBergabung: '2024-11-05',
      biayaPendaftaran: 1200000,
      iuranBulanan: 120000,
      totalBiayaPendaftaran: 1320000,
    },
  ];

  students.push(...applicants);

  // Events matching video
  const events: ClubEvent[] = [
    {
      id: 'evt-familia-cup',
      nama: 'Familia Cup',
      deskripsi: 'Turnamen internal antar kelompok umur CLS Surabaya',
      nominal: 400000,
      tanggal: '2024-11-20',
      lokasi: 'GOR Kertajaya Surabaya',
      totalPeserta: 7,
      pesertaLunas: 5,
    },
    {
      id: 'evt-kejurnas-2023',
      nama: 'Kejurnas 2023',
      deskripsi: 'Kejuaraan Nasional Basket Junior',
      nominal: 750000,
      tanggal: '2024-12-10',
      lokasi: 'DBL Arena Surabaya',
      totalPeserta: 12,
      pesertaLunas: 9,
    },
    {
      id: 'evt-latihan-sabtu',
      nama: 'Latihan Tambahan Sabtu',
      deskripsi: 'Intensive drills & skill development',
      nominal: 50000,
      tanggal: '2024-11-16',
      lokasi: 'Lapangan Outdoor Kertajaya',
      totalPeserta: 18,
      pesertaLunas: 16,
    },
    {
      id: 'evt-sehati',
      nama: 'Turnamen Invitation Sehati 2023',
      deskripsi: 'Invitasi persahabatan antar klub Jawa Timur',
      nominal: 350000,
      tanggal: '2024-11-28',
      lokasi: 'GOR Bimasakti Malang',
      totalPeserta: 10,
      pesertaLunas: 8,
    },
    {
      id: 'evt-jateng',
      nama: 'Turnamen Kejurnas Jateng 2023',
      deskripsi: 'Turnamen regional Jawa Tengah',
      nominal: 500000,
      tanggal: '2024-12-05',
      lokasi: 'GOR Sahabat Semarang',
      totalPeserta: 8,
      pesertaLunas: 6,
    },
  ];

  // Event participants for Familia Cup (matching video timestamp 02:56: Zul Imani, Raizel, Rafa, Maylinda, Kuinsila, Khumaira, Kamila Syahira)
  const eventParticipants: EventParticipant[] = [
    { id: 'ep-1', eventId: 'evt-familia-cup', siswaId: 'std-30', status: 'lunas', nominal: 400000, terbayar: 400000, tanggalBayar: '2024-11-01', kuitansiId: 'INVSP-241101-101' },
    { id: 'ep-2', eventId: 'evt-familia-cup', siswaId: 'std-28', status: 'lunas', nominal: 400000, terbayar: 400000, tanggalBayar: '2024-11-02', kuitansiId: 'INVSP-241102-102' },
    { id: 'ep-3', eventId: 'evt-familia-cup', siswaId: 'std-27', status: 'lunas', nominal: 400000, terbayar: 400000, tanggalBayar: '2024-11-03', kuitansiId: 'INVSP-241103-103' },
    { id: 'ep-4', eventId: 'evt-familia-cup', siswaId: 'std-23', status: 'lunas', nominal: 400000, terbayar: 400000, tanggalBayar: '2024-11-04', kuitansiId: 'INVSP-241104-104' },
    { id: 'ep-5', eventId: 'evt-familia-cup', siswaId: 'std-22', status: 'belum_bayar', nominal: 400000, terbayar: 0 }, // Kuinsila
    { id: 'ep-6', eventId: 'evt-familia-cup', siswaId: 'std-20', status: 'belum_lunas', nominal: 400000, terbayar: 200000, tanggalBayar: '2024-11-04' }, // Khumaira
    { id: 'ep-7', eventId: 'evt-familia-cup', siswaId: 'std-16', status: 'lunas', nominal: 400000, terbayar: 400000, tanggalBayar: '2024-11-05', kuitansiId: 'INVSP-241105-110' }, // Kamila Syahira
  ];

  // Attendance Sessions (matching video timestamps 03:34, 03:56)
  // Training sessions in October: 2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25, 30
  const octDates = ['02', '04', '07', '09', '11', '14', '16', '18', '21', '23', '25', '30'];
  const attendanceSessions: AttendanceSession[] = [];

  octDates.forEach((day, idx) => {
    const kehadiranMap: { [sid: string]: boolean } = {};
    SEED_STUDENT_NAMES_KU10.forEach((_, sIdx) => {
      const sid = `std-${sIdx + 1}`;
      // Most students attend (green check), occasionally absent (red X) like in video
      if (sIdx === 2 && (idx === 3 || idx === 8)) {
        kehadiranMap[sid] = false;
      } else if (sIdx === 6 && idx === 6) {
        kehadiranMap[sid] = false;
      } else if (sIdx === 15) { // Kamila Syahira is very diligent (all present!)
        kehadiranMap[sid] = true;
      } else if (sIdx === 21 && idx === 5) {
        kehadiranMap[sid] = false;
      } else {
        kehadiranMap[sid] = Math.random() > 0.12;
      }
    });

    attendanceSessions.push({
      id: `att-2024-10-${day}`,
      tanggal: `2024-10-${day}`,
      kelasId: 'ku-10',
      catatan: idx % 2 === 0 ? 'Latihan dribble, passing & defense' : 'Scrum match & shooting practice',
      pelatih: 'Coach Dimas',
      kehadiran: kehadiranMap,
    });
  });

  // November sessions (04, 11, 18)
  const novDates = ['04', '05', '11', '18'];
  novDates.forEach((day, idx) => {
    const kehadiranMap: { [sid: string]: boolean } = {};
    SEED_STUDENT_NAMES_KU10.forEach((_, sIdx) => {
      const sid = `std-${sIdx + 1}`;
      kehadiranMap[sid] = sIdx % 7 !== 0;
    });

    attendanceSessions.push({
      id: `att-2024-11-${day}`,
      tanggal: `2024-11-${day}`,
      kelasId: idx === 0 ? 'renang-acm-2' : 'ku-10',
      catatan: 'Latihan fisik & simulasi tanding',
      pelatih: idx === 0 ? 'Coach Sarah' : 'Coach Dimas',
      kehadiran: kehadiranMap,
    });
  });

  // Recent Transactions
  const transactions: PaymentTransaction[] = [
    {
      id: 'tx-1',
      nomorKuitansi: 'INVSP-241105-006',
      siswaId: 'app-1',
      siswaNama: 'John Doe',
      kelasNama: 'KU-10',
      tanggal: '2024-11-05',
      nominal: 1100000,
      terbilang: 'Satu Juta Seratus Ribu Rupiah',
      metodePembayaran: 'Transfer BCA',
      tipe: 'Pendaftaran Siswa Baru',
      keterangan: 'Pendaftaran Siswa Baru + Iuran Rutin Bulan Pertama',
      catatan: 'Bukti transfer terverifikasi m-BCA.',
    },
    {
      id: 'tx-2',
      nomorKuitansi: 'INVSP-241105-007',
      siswaId: 'std-16',
      siswaNama: 'Kamila Syahira',
      kelasNama: 'KU-10',
      tanggal: '2024-11-05',
      nominal: 100000,
      terbilang: 'Seratus Ribu Rupiah',
      metodePembayaran: 'QRIS',
      tipe: 'Iuran Rutin',
      keterangan: 'Pembayaran Iuran Rutin November 2024',
      catatan: 'Bayar via QRIS di loket admin.',
    },
    {
      id: 'tx-3',
      nomorKuitansi: 'INVSP-241105-008',
      siswaId: 'std-16',
      siswaNama: 'Kamila Syahira',
      kelasNama: 'KU-10',
      tanggal: '2024-11-05',
      nominal: 400000,
      terbilang: 'Empat Ratus Ribu Rupiah',
      metodePembayaran: 'Transfer BCA',
      tipe: 'Iuran Insidentil',
      keterangan: 'Pendaftaran Turnamen Familia Cup 2024',
    },
  ];

  return {
    students,
    classes: INITIAL_CLASSES,
    monthlyDues,
    events,
    eventParticipants,
    attendanceSessions,
    transactions,
    profile: INITIAL_PROFILE,
  };
}

export const SAMPLE_TRANSFER_PROOF_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520" fill="none"><rect width="400" height="520" rx="16" fill="%23FFFFFF"/><rect width="400" height="80" rx="16" fill="%2300529C"/><text x="20" y="48" fill="%23FFFFFF" font-family="sans-serif" font-weight="bold" font-size="20">m-Transfer BCA BERHASIL</text><circle cx="200" cy="140" r="32" fill="%2310B981"/><path d="M188 140l8 8 16-16" stroke="%23FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="200" y="200" text-anchor="middle" fill="%231E293B" font-family="sans-serif" font-weight="bold" font-size="16">TRANSFER BERHASIL</text><text x="200" y="235" text-anchor="middle" fill="%23059669" font-family="sans-serif" font-weight="900" font-size="24">Rp 100.000</text><line x1="30" y1="265" x2="370" y2="265" stroke="%23E2E8F0" stroke-width="2" stroke-dasharray="4 4"/><text x="40" y="300" fill="%2364748B" font-family="sans-serif" font-size="12">Tanggal</text><text x="360" y="300" text-anchor="end" fill="%230F172A" font-family="sans-serif" font-weight="600" font-size="12">28/09/2026 14:22 WIB</text><text x="40" y="335" fill="%2364748B" font-family="sans-serif" font-size="12">Penerima</text><text x="360" y="335" text-anchor="end" fill="%230F172A" font-family="sans-serif" font-weight="600" font-size="12">CLS SURABAYA ACADEMY</text><text x="40" y="370" fill="%2364748B" font-family="sans-serif" font-size="12">No. Rekening Tujuan</text><text x="360" y="370" text-anchor="end" fill="%230F172A" font-family="monospace" font-weight="bold" font-size="12">088-294-8833</text><text x="40" y="405" fill="%2364748B" font-family="sans-serif" font-size="12">Berita / Catatan</text><text x="360" y="405" text-anchor="end" fill="%23059669" font-family="sans-serif" font-weight="bold" font-size="12">SPP Nov Kamila Syahira</text><rect x="30" y="445" width="340" height="45" rx="8" fill="%23F8FAFC" stroke="%23E2E8F0"/><text x="200" y="472" text-anchor="middle" fill="%2364748B" font-family="monospace" font-size="11">REF: BCA-TRX-948271049281</text></svg>`;

export const INITIAL_SUBMISSIONS: PaymentSubmission[] = [
  {
    id: 'sub-1',
    siswaId: 'std-16',
    siswaNama: 'Kamila Syahira',
    kelasId: 'ku-10',
    kelasNama: 'KU-10',
    tipe: 'Iuran Rutin',
    bulan: 11,
    tahun: 2024,
    nominal: 100000,
    metodePembayaran: 'Transfer BCA',
    tanggalTransfer: '2024-11-06',
    buktiGambarUrl: SAMPLE_TRANSFER_PROOF_SVG,
    pesanSiswa: 'Halo Admin CLS, ini bukti transfer m-BCA dari Bpk. Syahira untuk iuran rutin bulan November. Mohon dicek dan diverifikasi ya, terima kasih!',
    status: 'pending',
    tanggalKirim: '2024-11-06 10:15',
  },
  {
    id: 'sub-2',
    siswaId: 'std-16',
    siswaNama: 'Kamila Syahira',
    kelasId: 'ku-10',
    kelasNama: 'KU-10',
    tipe: 'Iuran Rutin',
    bulan: 10,
    tahun: 2024,
    nominal: 100000,
    metodePembayaran: 'Transfer BCA',
    tanggalTransfer: '2024-10-05',
    buktiGambarUrl: SAMPLE_TRANSFER_PROOF_SVG,
    pesanSiswa: 'Iuran bulan Oktober via m-BCA a.n Syahira Senior.',
    status: 'verified',
    tanggalKirim: '2024-10-05 08:30',
    tanggalVerifikasi: '2024-10-05 09:15',
    diverifikasiOleh: 'Super Admin',
    catatanAdmin: 'Dana Rp 100.000 sudah masuk rekening BCA klub. Terverifikasi.',
    kuitansiId: 'INVSP-241005-007',
    transactionId: 'tx-2',
  },
  {
    id: 'sub-3',
    siswaId: 'std-16',
    siswaNama: 'Kamila Syahira',
    kelasId: 'ku-10',
    kelasNama: 'KU-10',
    tipe: 'Iuran Insidentil',
    nominal: 400000,
    metodePembayaran: 'Transfer BCA',
    tanggalTransfer: '2024-11-05',
    buktiGambarUrl: SAMPLE_TRANSFER_PROOF_SVG,
    pesanSiswa: 'Biaya pendaftaran Turnamen Familia Cup 2024.',
    status: 'verified',
    tanggalKirim: '2024-11-05 13:00',
    tanggalVerifikasi: '2024-11-05 14:00',
    diverifikasiOleh: 'Super Admin',
    catatanAdmin: 'Turnamen Familia Cup terverifikasi lunas.',
    kuitansiId: 'INVSP-241105-008',
    transactionId: 'tx-3',
  },
  {
    id: 'sub-4',
    siswaId: 'std-2',
    siswaNama: 'Alyaa Bening Bestari',
    kelasId: 'ku-10',
    kelasNama: 'KU-10',
    tipe: 'Iuran Rutin',
    bulan: 10,
    tahun: 2024,
    nominal: 100000,
    metodePembayaran: 'QRIS',
    tanggalTransfer: '2024-10-05',
    buktiGambarUrl: SAMPLE_TRANSFER_PROOF_SVG,
    pesanSiswa: 'Pembayaran SPP Oktober sudah lunas via QRIS.',
    status: 'verified',
    tanggalKirim: '2024-10-05 09:30',
    tanggalVerifikasi: '2024-10-05 10:00',
    diverifikasiOleh: 'Super Admin',
    catatanAdmin: 'Dana masuk rekening BCA verified. Kuitansi resmi diterbitkan.',
    kuitansiId: 'INVSP-241005-001',
    transactionId: 'tx-alyaa-oct',
  },
];

export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    // Start database completely clean from zero (kosong)
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.MONTHLY_DUES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EVENT_PARTICIPANTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_PROFILE));
    localStorage.setItem(STORAGE_KEYS.PAYMENT_SUBMISSIONS, JSON.stringify([]));
  }
}

export function clearDatabaseToZero() {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
  localStorage.setItem(STORAGE_KEYS.MONTHLY_DUES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EVENT_PARTICIPANTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_PROFILE));
  localStorage.setItem(STORAGE_KEYS.PAYMENT_SUBMISSIONS, JSON.stringify([]));
}

export function resetToSeedData() {
  const seed = generateSeedData();
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(seed.students));
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(seed.classes));
  localStorage.setItem(STORAGE_KEYS.MONTHLY_DUES, JSON.stringify(seed.monthlyDues));
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(seed.events));
  localStorage.setItem(STORAGE_KEYS.EVENT_PARTICIPANTS, JSON.stringify(seed.eventParticipants));
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(seed.attendanceSessions));
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(seed.transactions));
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(seed.profile));
  localStorage.setItem(STORAGE_KEYS.PAYMENT_SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
}

// Data Getters & Setters
export function getStudents(): Student[] {
  initializeStorage();
  return readJSON(STORAGE_KEYS.STUDENTS, []);
}

export function saveStudents(students: Student[]) {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
}

export function getClasses(): ClassGroup[] {
  initializeStorage();
  return readJSON(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
}

export function saveClasses(classes: ClassGroup[]) {
  localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
}

export function getMonthlyDues(): MonthlyDueRecord[] {
  initializeStorage();
  return readJSON(STORAGE_KEYS.MONTHLY_DUES, []);
}

export function saveMonthlyDues(dues: MonthlyDueRecord[]) {
  localStorage.setItem(STORAGE_KEYS.MONTHLY_DUES, JSON.stringify(dues));
}

export function getEvents(): ClubEvent[] {
  initializeStorage();
  return readJSON(STORAGE_KEYS.EVENTS, []);
}

export function saveEvents(events: ClubEvent[]) {
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
}

export function getEventParticipants(): EventParticipant[] {
  initializeStorage();
  return readJSON(STORAGE_KEYS.EVENT_PARTICIPANTS, []);
}

export function saveEventParticipants(participants: EventParticipant[]) {
  localStorage.setItem(STORAGE_KEYS.EVENT_PARTICIPANTS, JSON.stringify(participants));
}

export function getAttendanceSessions(): AttendanceSession[] {
  initializeStorage();
  return readJSON(STORAGE_KEYS.ATTENDANCE, []);
}

export function saveAttendanceSessions(sessions: AttendanceSession[]) {
  localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(sessions));
}

export function getTransactions(): PaymentTransaction[] {
  initializeStorage();
  return readJSON(STORAGE_KEYS.TRANSACTIONS, []);
}

export function saveTransactions(transactions: PaymentTransaction[]) {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function getClubProfile(): ClubProfile {
  initializeStorage();
  return readJSON(STORAGE_KEYS.PROFILE, INITIAL_PROFILE);
}

export function saveClubProfile(profile: ClubProfile) {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
}

/**
 * Nomor kuitansi berurutan per hari: INVSP-YYMMDD-NNN.
 * Urutan diambil dari nomor terbesar yang sudah tersimpan untuk hari ini,
 * sehingga tidak ada dua kuitansi dengan nomor yang sama.
 */
export function generateReceiptNumber(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const prefix = `INVSP-${yy}${mm}${dd}-`;

  const used = [
    ...readJSON<PaymentTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []).map((t) => t.nomorKuitansi),
    ...readJSON<PaymentSubmission[]>(STORAGE_KEYS.PAYMENT_SUBMISSIONS, []).map((s) => s.kuitansiId),
  ];
  const maxSeq = used.reduce((max, no) => {
    if (!no || !no.startsWith(prefix)) return max;
    const seq = parseInt(no.slice(prefix.length), 10);
    return Number.isFinite(seq) && seq > max ? seq : max;
  }, 0);

  return `${prefix}${(maxSeq + 1).toString().padStart(3, '0')}`;
}

export function getPaymentSubmissions(): PaymentSubmission[] {
  initializeStorage();
  return readJSON<PaymentSubmission[]>(STORAGE_KEYS.PAYMENT_SUBMISSIONS, []);
}

export function savePaymentSubmissions(submissions: PaymentSubmission[]) {
  localStorage.setItem(STORAGE_KEYS.PAYMENT_SUBMISSIONS, JSON.stringify(submissions));
}

// ─── COACHES ─────────────────────────────────────────────────────────────────

export const INITIAL_COACHES: Coach[] = [
  {
    id: 'coach-dimas',
    nama: 'Coach Dimas',
    noHp: '0812-3456-7890',
    email: 'dimas@sportkit.id',
    spesialisasi: 'Basket & Atletik',
    status: 'Aktif',
    tanggalBergabung: '2022-01-15',
    catatan: 'Pelatih utama KU-10 & KU-12. Berpengalaman 8 tahun.',
  },
  {
    id: 'coach-rian',
    nama: 'Coach Rian',
    noHp: '0813-9876-5432',
    email: 'rian@sportkit.id',
    spesialisasi: 'Basket',
    status: 'Aktif',
    tanggalBergabung: '2022-03-01',
    catatan: 'Asisten pelatih KU-10. Spesialis teknik dribbling.',
  },
  {
    id: 'coach-wahyu',
    nama: 'Coach Wahyu',
    noHp: '0857-1234-5678',
    email: 'wahyu@sportkit.id',
    spesialisasi: 'Basket Kompetisi',
    status: 'Aktif',
    tanggalBergabung: '2021-06-10',
    catatan: 'Pelatih KU-12. Fokus persiapan kejuaraan antar sekolah.',
  },
  {
    id: 'coach-hendra',
    nama: 'Coach Hendra',
    noHp: '0878-8765-4321',
    email: 'hendra@sportkit.id',
    spesialisasi: 'Akademi Prestasi',
    status: 'Aktif',
    tanggalBergabung: '2020-09-01',
    catatan: 'Pelatih senior KU-14. Mantan atlet nasional.',
  },
  {
    id: 'coach-sarah',
    nama: 'Coach Sarah',
    noHp: '0819-1122-3344',
    email: 'sarah@sportkit.id',
    spesialisasi: 'Renang',
    status: 'Aktif',
    tanggalBergabung: '2021-01-20',
    catatan: 'Pelatih Renang ACM 1 & 2. Sertifikasi PRSI Level 2.',
  },
  {
    id: 'coach-michael',
    nama: 'Coach Michael',
    noHp: '0856-5544-3322',
    email: 'michael@sportkit.id',
    spesialisasi: 'English Sport Academy',
    status: 'Aktif',
    tanggalBergabung: '2023-02-01',
    catatan: 'Pelatih English Class. Native speaker, lulusan luar negeri.',
  },
];

export function getCoaches(): Coach[] {
  if (!localStorage.getItem(STORAGE_KEYS.COACHES)) {
    localStorage.setItem(STORAGE_KEYS.COACHES, JSON.stringify(INITIAL_COACHES));
    return INITIAL_COACHES;
  }
  return readJSON<Coach[]>(STORAGE_KEYS.COACHES, INITIAL_COACHES);
}

export function saveCoaches(coaches: Coach[]) {
  localStorage.setItem(STORAGE_KEYS.COACHES, JSON.stringify(coaches));
}
