import { ClubProfile, RaporEntry, RaporFolder, Student } from '../../src/types/sportkit';
import { createSwimmingEvaluationTemplate } from '../../src/utils/swimmingRaporTemplate';

// Data sintetis untuk pengujian lokal; tidak mengakses Supabase.
export const raporTestTemplate = createSwimmingEvaluationTemplate('Klub Uji');
export const raporTestProfile: ClubProfile = {
  namaKlub: 'Klub Uji', cabangOlahraga: 'Renang', alamat: '', kota: 'Kota Uji', noHp: '', email: '', noWhatsApp: '',
};
export const raporTestStudent: Student = {
  id: 'student-test', nama: 'Siswa Uji', kelasId: 'class-test', jenisKelamin: 'Perempuan',
  tempatLahir: '', tanggalLahir: '2018-09-10', noHp: '', alamat: '',
  orangTua: { namaAyah: 'Orangtua Uji', namaIbu: '', noHpAyah: '', noHpIbu: '' },
  status: 'Aktif', tanggalBergabung: '2026-08-01', biayaPendaftaran: 0, iuranBulanan: 0, totalBiayaPendaftaran: 0,
};
export const raporTestFolder: RaporFolder = {
  id: 'folder-test', nama: 'Evaluasi Agustus - Oktober 2026', awalPenilaian: '2026-08-01', akhirPenilaian: '2026-10-08',
  kelasId: 'class-test', templateId: raporTestTemplate.id, diterbitkan: false,
};
export const raporTestEntry: RaporEntry = {
  id: 'entry-test', folderId: raporTestFolder.id, siswaId: raporTestStudent.id, diisiOleh: 'Pelatih Uji', tanggalIsi: '2026-10-08 10:00',
  jawaban: Object.fromEntries(raporTestTemplate.items.filter((it) => it.tipe !== 'judul').map((it, i) => [it.id,
    it.tipe === 'pertemuan' ? [['B', 'C', 'M'][i % 3], 'Gerakan semakin stabil.\nLatihan berikutnya fokus pada koordinasi napas dan posisi tubuh.']
      : it.tipe === 'kelulusan' ? ['Lulus', '2026-10-08', 'Pelatih Uji'] : 'Perkembangan baik; lanjutkan latihan sesuai arahan pelatih.',
  ])),
};
