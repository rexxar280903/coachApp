-- Data awal opsional: profil klub + kelas contoh. Ubah sesuai klub Anda
-- (semuanya juga bisa diubah dari menu Pengaturan / Kelas di aplikasi).

update public.club_profile set
  nama_klub = 'Hans Swimming',
  cabang_olahraga = 'Basket, Renang & Akademi Olahraga',
  alamat = 'GOR Kertajaya, Kertajaya Indah Timur I No.1, Manyar Sabrangan, Kec. Mulyorejo',
  kota = 'Surabaya, Jawa Timur 60116',
  no_hp = '0897-2488-333',
  email = 'admin@sportkit.id',
  no_whatsapp = '628972488333'
where id = 1;

-- created_at digeser per detik supaya urutan kelas di aplikasi sesuai daftar ini.
insert into public.classes (id, nama, deskripsi, iuran_bulanan, biaya_pendaftaran, pelatih, created_at) values
  ('ku-10', 'KU-10', 'Kelompok Umur 10 Tahun (Basket & Atletik Junior)', 100000, 1000000, '', now()),
  ('ku-12', 'KU-12', 'Kelompok Umur 12 Tahun (Persiapan Kompetisi)', 120000, 1200000, '', now() + interval '1 second'),
  ('ku-14', 'KU-14', 'Kelompok Umur 14 Tahun (Akademi Prestasi)', 150000, 1350000, '', now() + interval '2 seconds'),
  ('renang-acm-1', 'RENANG ACM 1', 'Kelas Renang Pemula & Teknik Dasar', 150000, 1000000, '', now() + interval '3 seconds'),
  ('renang-acm-2', 'RENANG ACM 2', 'Kelas Renang Lanjutan & Endurance', 175000, 1000000, '', now() + interval '4 seconds'),
  ('english-class-v', 'ENGLISH CLASS V', 'Kelas Pengantar Olahraga Berbahasa Inggris', 100000, 800000, '', now() + interval '5 seconds')
on conflict (id) do nothing;
