import { RaporItem, RaporTemplate } from '../types/sportkit';
import { newRaporId } from './rapor';

/** Kurikulum dari dokumen pengguna; identitas dan tanggal contoh tidak disalin. */
export const SWIMMING_CURRICULUM = [
  {
    judul: 'LEVEL 1: ADAPTASI AIR, KESELAMATAN & DASAR (NOL DASAR)',
    rekap: 'Level 1: Adaptasi Air & Safety',
    pertemuan: [
      {
        label: 'Pertemuan 1 (Pengenalan Air)',
        materi: ['Berani masuk ke kolam tanpa cemas/menangis', 'Berjalan, melompat kecil & menyiram air ke wajah secara mandiri', 'Latihan tiup gelembung di permukaan air (Blowing)', 'Membasahi & memasukkan seluruh wajah ke dalam air'],
        indikator: 'Otot tubuh rileks, tidak takut air, respon pernapasan awal bagus.',
      },
      {
        label: 'Pertemuan 2 (Pernapasan & Water Safety)',
        materi: ['Menahan napas di dalam air (Submersion) minimal 5-10 detik', 'Latihan Bobbing (ambil napas di udara, buang di dalam air) 10-15x', 'Keselamatan dasar: cara berpegangan tepi kolam & keluar kolam mandiri', 'Mengambil benda di dasar kolam dangkal'],
        indikator: 'Irama bernapas (bobbing) lancar tanpa tersedak.',
      },
      {
        label: 'Pertemuan 3 (Mengapung / Floating)',
        materi: ['Mengapung tengkurap (Prone Float / Starfish Float) 5-10 detik', 'Mengapung telentang (Back Float) dengan tenang 5-10 detik', 'Berdiri kembali ke posisi tegak dari posisi mengapung secara mandiri', 'Kesadaran buoyansi (daya apung tubuh)'],
        indikator: 'Tubuh tidak tegang saat telentang, posisi kepala stabil.',
      },
      {
        label: 'Pertemuan 4 (Meluncur / Streamline)',
        materi: ['Postur posisi meluncur lurus (Streamline) dengan dorongan dinding', 'Menjaga kepala terkunci di antara kedua lengan saat meluncur', 'Meluncur tengkurap sejauh 3-5 meter tanpa gerakan kaki/tangan', 'Evaluasi kelulusan Level 1 (Dasar Keselamatan)'],
        indikator: 'Streamline sejajar permukaan air, posisi hidung/wajah menghadap bawah.',
      },
    ],
  },
  {
    judul: 'LEVEL 2: GAYA BEBAS (FREESTYLE / CRAWL STROKE)',
    rekap: 'Level 2: Gaya Bebas (Freestyle)',
    pertemuan: [
      {
        label: 'Pertemuan 5 (Tendangan Kaki Bebas)',
        materi: ['Teknik Flutter Kick (gerakan kaki dari pangkal paha, lutut rileks)', 'Latihan kaki gaya bebas di tepi kolam & menggunakan papan pelampung (Kickboard)', 'Meluncur + gerakan kaki sejauh 8-10 meter', 'Menjaga posisi tubuh tetap horizontal (High Body Position)'],
        indikator: 'Cambukan kaki efektif, tidak memukul air berlebihan.',
      },
      {
        label: 'Pertemuan 6 (Putaran Lengan / Arm Stroke)',
        materi: ['Teknik putaran lengan gaya bebas di darat (Dry Land Drill) & air', 'Fase Catch, Pull, Push, dan Recovery lengan', 'Kombinasi meluncur + gerakan kaki + putaran tangan (tanpa ambil napas)', 'Jarak tempuh kombinasi 8-10 meter'],
        indikator: 'Tangan masuk air selebar bahu, putaran teratur.',
      },
      {
        label: 'Pertemuan 7 (Pernapasan Samping)',
        materi: ['Teknik memutar kepala ke samping (Side Breathing) 90 derajat', 'Menjaga satu mata/telinga tetap menempel di air saat bernapas', 'Kombinasi irama: 2-3 kayuhan tangan + 1x pengambilan napas', 'Latihan koordinasi kaki, tangan, dan napas dengan pelampung'],
        indikator: 'Kepala tidak diangkat ke atas, posisi tubuh tidak tenggelam saat bernapas.',
      },
      {
        label: 'Pertemuan 8 (Integrasi & Ketahanan Gaya Bebas)',
        materi: ['Renang Gaya Bebas penuh (Full Stroke) jarak 15-25 meter nonstop', 'Latihan pernapasan bilateral (kiri & kanan) jika memungkinkan', 'Latihan meluncur cepat dari dinding (Push Off & Glide)', 'Ujian capaian Level 2 (Gaya Bebas)'],
        indikator: 'Mampu menyelesaikan 15-25 meter dengan irama stabil.',
      },
    ],
  },
  {
    judul: 'LEVEL 3: GAYA DADA / KATAK (BREASTSTROKE)',
    rekap: 'Level 3: Gaya Dada (Breaststroke)',
    pertemuan: [
      {
        label: 'Pertemuan 9 (Tendangan Kaki Katak)',
        materi: ['Pengenalan tekukan & putaran pergelangan kaki (Flex Feet)', 'Pola gerakan kaki gaya dada: Tarik - Buka/Putar - Tendang - Rapatkan (Glide)', 'Latihan kaki gaya dada dengan papan pelampung sejauh 10-15 meter', 'Merasakan jeda meluncur (Glide Phase) minimal 2 detik setelah menendang'],
        indikator: 'Dorongan kaki kuat, pergelangan kaki memutar sempurna.',
      },
      {
        label: 'Pertemuan 10 (Gerakan Tangan Dada)',
        materi: ['Teknik pendayungan tangan gaya dada (Outsweep, Insweep, Recovery)', 'Ukuran bukaan tangan tidak melebihi lebar bahu (bentuk jantung/mangkuk)', 'Kombinasi tangan gaya dada + jepit pelampung di paha', 'Pengambilan napas lurus ke depan saat tangan menarik air'],
        indikator: 'Tangan tidak ditarik terlalu jauh ke bawah dada.',
      },
      {
        label: 'Pertemuan 11 (Koordinasi & Ritme Dada)',
        materi: ['Formula koordinasi: Tarik Tangan & Angkat Napas -> Tendang Kaki -> Meluncur', 'Latihan koordinasi penuh Gaya Dada jarak 10-15 meter', 'Penekanan pada efisiensi jeda meluncur (Glide Time)', 'Menjaga tubuh tetap streamline di antara setiap kayuhan'],
        indikator: 'Ritme koordinasi tepat, tidak terburu-buru.',
      },
      {
        label: 'Pertemuan 12 (Penyempurnaan Gaya Dada)',
        materi: ['Renang Gaya Dada penuh jarak 25 meter nonstop', 'Teknik pembalikan dinding sederhana (Touch Turn)', 'Latihan menginjak-injak air (Water Treading / Doggie Paddle) 30-60 detik', 'Ujian capaian Level 3 (Gaya Dada)'],
        indikator: 'Jarak tempuh 25m lancar, stamina baik.',
      },
    ],
  },
  {
    judul: 'LEVEL 4: GAYA PUNGGUNG (BACKSTROKE)',
    rekap: 'Level 4: Gaya Punggung (Backstroke)',
    pertemuan: [
      {
        label: 'Pertemuan 13 (Posisi Tubuh & Kaki Punggung)',
        materi: ['Adaptasi posisi telentang sejajar air (Supine Streamline)', 'Menjaga pinggul tetap tinggi di permukaan air (Head & Hip Position)', 'Gerakan kaki gaya punggung (Flutter kick terbalik, cambukan ke atas)', 'Latihan kaki punggung dengan pelampung di dada sejauh 15 meter'],
        indikator: 'Wajah tetap kering/bebas air, panggul tidak terbenam.',
      },
      {
        label: 'Pertemuan 14 (Kayuhan Lengan Punggung)',
        materi: ['Teknik putaran lengan lurus keluar air dengan jempol terlebih dahulu', 'Memutar lengan di udara & masuk air dengan kelingking terlebih dahulu (Pinky First)', 'Latihan kayuhan satu lengan bergantian (Single Arm Backstroke Drill)', 'Kombinasi kaki + gerakan tangan 10-15 meter'],
        indikator: 'Lengan melintas di dekat telinga, posisi bahu berotasi.',
      },
      {
        label: 'Pertemuan 15 (Pernapasan & Ritme Punggung)',
        materi: ['Pola pernapasan konsisten: hirup saat satu lengan recovery, hembus saat lengan lain', 'Renang Gaya Punggung penuh (Full Stroke Backstroke) 15-20 meter', 'Orientasi arah renang tanpa melihat ke belakang (Counting Strokes)', 'Keberanian & ketenangan berenang telentang di lintasan'],
        indikator: 'Gaya stabil, tidak melenceng ke samping.',
      },
      {
        label: 'Pertemuan 16 (Ketahanan Gaya Punggung)',
        materi: ['Renang Gaya Punggung penuh jarak 25 meter nonstop', 'Kombinasi rangkaian: 25m Gaya Bebas + 25m Gaya Dada + 25m Gaya Punggung', 'Latihan pemulihan posisi & keselamatan air dalam', 'Ujian capaian Level 4 (Gaya Punggung)'],
        indikator: 'Ketahanan fisik terjaga, penguasaan 3 gaya stabil.',
      },
    ],
  },
  {
    judul: 'LEVEL 5: GAYA KUPU-KUPU (BUTTERFLY) & KOMBINASI 4 GAYA',
    rekap: 'Level 5: Gaya Kupu-Kupu (Butterfly)',
    pertemuan: [
      {
        label: 'Pertemuan 17 (Lakukan Gerakan Dolphin Kick)',
        materi: ['Teknik lekukan tubuh & pinggul (Undulation / Body Wave)', 'Gerakan kaki Dolphin Kick (kedua kaki rapat bergerak bersamaan)', 'Latihan Dolphin Kick dengan pelampung & tanpa pelampung (Streamline Dolphin)', 'Meluncur dengan gerakan dolphin kick sejauh 8-10 meter'],
        indikator: 'Lekukan berasal dari dada mendayung hingga ujung kaki.',
      },
      {
        label: 'Pertemuan 18 (Gerakan Lengan & Pernapasan Kupu-Kupu)',
        materi: ['Teknik kayuhan lengan simultan (Keyhole Pull Pattern) & Recovery di atas air', 'Pengambilan napas ke depan saat dada terangkat di awal pull', 'Latihan Single Arm Butterfly Drill (1 kiri, 1 kanan, 1 penuh)', 'Kombinasi 2 kali tendangan kaki per 1 kali kayuhan lengan'],
        indikator: 'Lengan mampu melewati permukaan air bersamaan.',
      },
      {
        label: 'Pertemuan 19 (Integrasi Full Gaya Kupu-Kupu)',
        materi: ['Renang Gaya Kupu-Kupu penuh (Full Stroke Butterfly) 10-15 meter', 'Menjaga irama & ritme ledakan tenaga yang efisien', 'Latihan Start Melompat dari Tepi Kolam (Diving Start / Streamline Dive)', 'Latihan pembalikan lintasan (Flip Turn / Open Turn)'],
        indikator: 'Ritme 2 tendangan per kayuhan pas, lompatan start aman.',
      },
      {
        label: 'Pertemuan 20 (Evaluasi Akhir & Ujian Medley 4 Gaya)',
        materi: ['Ujian simulasi renang 4 gaya (Individual Medley / IM): Bebas, Dada, Punggung, Kupu-kupu', 'Menempuh total jarak 50-100 meter kombinasi', 'Evaluasi ketahanan fisik, teknik akhir, & penetapan kelulusan', 'Penyerahan rapor akhir & sertifikat capaian'],
        indikator: 'Menguasai teknik dasar 4 gaya renang dengan aman & mandiri.',
      },
    ],
  },
] as const;

export function createSwimmingEvaluationTemplate(footer = ''): RaporTemplate {
  const item = (tipe: RaporItem['tipe'], label: string, extra: Partial<RaporItem> = {}): RaporItem => ({
    ...extra, id: newRaporId('itm'), tipe, label,
  });
  return {
    id: newRaporId('tpl'),
    nama: 'Evaluasi & Kurikulum Les Berenang (5 Level / 20 Pertemuan)',
    header: 'RAPOR EVALUASI & KURIKULUM LES BERENANG',
    items: [
      ...SWIMMING_CURRICULUM.flatMap((level, i) => [
        item('judul', level.judul),
        ...level.pertemuan.map((p) => item('pertemuan', p.label, { materi: [...p.materi], indikator: p.indikator })),
        item('paragraf', `Catatan tambahan pelatih Level ${i + 1}`),
      ]),
      item('judul', 'REKAPITULASI CAPAIAN & KELULUSAN AKHIR'),
      ...SWIMMING_CURRICULUM.map((level) => item('kelulusan', level.rekap)),
    ],
    footer,
  };
}
