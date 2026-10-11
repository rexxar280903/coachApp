# Template evaluasi berenang

Template bawaan mengikuti dokumen `fitur tambahan/rapor evaluasi berenang.docx`:
5 level, 20 pertemuan, materi dan indikator utama tiap pertemuan, nilai B/C/M,
catatan evaluasi, catatan tambahan per level, serta rekap kelulusan 5 level.
Identitas dan tanggal contoh dalam dokumen tidak disalin menjadi data siswa.

## Menggunakan template

1. Sebagai admin, buka **Rapor Siswa → Template Rapor → Gunakan Template Berenang**.
2. Periksa materi melalui **Pratinjau**, sesuaikan jika perlu, lalu **Simpan Template**.
3. Buka tab **Folder Rapor**, buat folder untuk kelas dan periode penilaian,
   lalu pilih template evaluasi berenang yang tadi disimpan.
4. Admin atau pelatih membuka folder dan mengisi rapor siswa. Pilih bagian
   penilaian untuk berpindah level. Jawaban bagian lain tetap tersimpan di form.
5. Pilih satu nilai per pertemuan: B (Belum Mampu), C (Cukup / Dalam Proses),
   atau M (Mahir / Mandiri). Isi catatan jika diperlukan. **Simpan** bisa dilakukan
   bertahap; pertemuan yang belum dinilai tetap kosong.
6. Di rekap akhir, pelatih menentukan **Lulus** atau **Mengulang** per level.
   Status Lulus membutuhkan tanggal yang valid dan nama pelatih penandatangan.
   Status Mengulang tidak memakai tanggal lulus. Tidak ada kelulusan otomatis.
7. Gunakan **Lihat / cetak PDF** untuk mencetak atau menyimpan rapor sebagai PDF
   melalui dialog cetak browser. Ruang tanda tangan diisi secara manual;
   nama yang tercetak bukan tanda tangan digital.
8. Admin memilih **Terbitkan ke Portal** agar wali dapat melihat rapor tersebut.
   Folder yang belum diterbitkan tidak muncul di Portal Siswa.

Usia dihitung pada akhir periode penilaian dari tanggal lahir siswa. Nama kelas
dipakai sebagai kategori. Kop, kota, dan kontak mengikuti profil klub. Nama
pelatih diisi dari akun pengisi dan bisa disesuaikan pada form penilaian.

## Kompatibilitas

Template dan jawaban lama tetap memakai format yang sama. Item baru disimpan
di kolom JSON `items`; jawaban pertemuan berupa `[nilai, catatan]` dan jawaban
kelulusan berupa `[status, tanggalLulus, namaPelatih]` dalam kolom JSON `jawaban`.
Tidak dibutuhkan migrasi database baru jika tabel rapor sudah tersedia.

Template bawaan tidak otomatis ditulis ke database; admin menyimpannya melalui
editor. Untuk mengubah kurikulum yang sudah dipakai folder lama, duplikat
template lebih dahulu agar arsip lama tidak ikut berubah.

## Pengujian lokal

`npm run test` mencakup struktur template, validasi nilai dan kelulusan,
kompatibilitas template lama, markup cetak, penyimpanan JSON PostgreSQL,
serta pembatasan akses portal.

Untuk pengujian interaktif dengan data sintetis, jalankan `npm run dev`, lalu
buka `/tests/fixtures/rapor-preview.html`. Halaman ini tidak mengakses Supabase
dan tidak masuk build produksi. Template, folder, dan jawaban uji hanya ada
di memori dan hilang saat halaman dimuat ulang. Pemeriksaan visual dan cetak
tetap perlu dilakukan di browser yang tersedia.
