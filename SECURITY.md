# Keamanan SportKit

Pembaruan 8 Oktober 2026 di branch `dev-next`. Perubahan ini mengurangi celah yang ditemukan pada
kode aplikasi dan skema database. Tidak menjamin aplikasi kebal serangan. Database dan konfigurasi
hosting produksi belum diubah oleh pekerjaan lokal ini.

Authenticator sementara dinonaktifkan sesuai keputusan pemilik aplikasi. Admin/pelatih login dengan
email + kata sandi; frontend tidak menampilkan enrollment atau meminta kode authenticator. Database
menggunakan sesi Auth valid dan peran `profiles` untuk otorisasi. Penonaktifan ini menghilangkan
verifikasi faktor kedua; pembatasan peran, sesi, storage, RPC, kuota, dan audit tetap berlaku.
Komponen `MfaView.tsx` disimpan sebagai kode nonaktif untuk pengembangan mendatang.

## Celah yang ditutup

| Temuan | Perubahan |
| --- | --- |
| Pelatih dapat mengambil kode akses dan biodata keluarga melalui `students` | Policy baca siswa untuk pelatih dicabut; `coach_students()` mengembalikan kolom dasar saja |
| Storage menerima bukti transfer dari siapa pun | Izin unggah UUID 10 menit diterbitkan setelah validasi portal; terikat siswa dan hash kode akses, dibatasi kuota |
| RPC pembayaran menerima path bukti tanpa memeriksa pemilik atau keberadaan file | Memeriksa izin, siswa, kedaluwarsa, objek storage, serta penggunaan ulang |
| Verifikasi menyimpan kuitansi/tagihan/status bukti melalui beberapa permintaan terpisah | RPC admin atomik dengan penguncian bukti/siswa, nomor kuitansi server, dan penolakan pemrosesan ulang |
| Kegagalan login dalam RPC pembayaran diikuti exception sehingga penghitung ikut rollback | Kode salah mengembalikan hasil normal; penghitung tetap tersimpan. Percobaan serentak diserialkan |
| Foto siswa berada di bucket publik | Bucket menjadi privat; staf memakai signed URL, pengunjung hanya boleh membaca logo profil klub |
| Portal menerima kode akses dan catatan internal melalui respons seluruh baris | Kolom rahasia/catatan staf disaring, absensi hanya memuat siswa yang bersangkutan |
| Pendaftaran dapat melewati duplikasi/kuota dengan permintaan serentak atau nomor orang tua | Validasi payload/kontak, penguncian transaksi, kuota global dan per kontak |
| Hak API mengikuti default Supabase yang mungkin terlalu luas | Grant CRUD eksplisit; akses tabel internal, TRUNCATE, sequence internal, dan helper RPC dicabut |
| Kredensial frontend dapat salah diisi dengan secret/service-role key | Validasi build menolak key selain publishable/anon dan menolak HTTP produksi |
| Token staf bertahan di localStorage | Penyimpanan per tab, logout setelah 30 menit tanpa aktivitas; portal maksimal 1 jam |
| Nama siswa pada CSV bisa dianggap formula Excel | Ekspor menetralkan awalan formula/control character sebelum quoting CSV |
| Perubahan data penting tidak memiliki jejak aplikasi | Audit INSERT/UPDATE/DELETE tanpa isi baris; log tidak bisa ditulis/dihapus melalui API browser |

Tambahan: kode portal baru memiliki 12 karakter acak; gambar dibatasi tipe, ukuran, signature, dan
resolusi sebelum unggah; kata sandi reset minimal 12 karakter; URL recovery hanya diproses pada
halaman reset; logout setelah reset password mencabut refresh session; header CSP, HSTS, anti-frame,
no-referrer dan Permissions-Policy ditambahkan; development server default hanya localhost.

## Penerapan ke produksi

1. Cadangkan database dan pastikan administrator Supabase tersedia untuk pemulihan akun pengurus.
2. Dalam satu jendela pemeliharaan, jalankan seluruh [`supabase/schema.sql`](supabase/schema.sql) di
   SQL Editor, lalu deploy frontend baru. Skema dibungkus transaksi dan diuji dapat dijalankan ulang.
   Jika seluruh pembaruan keamanan dengan MFA wajib sudah diterapkan, cukup jalankan
   [`supabase/migrations/20261008_disable_staff_mfa.sql`](supabase/migrations/20261008_disable_staff_mfa.sql)
   untuk menghapus syarat MFA. Migrasi tidak menghapus akun atau faktor authenticator yang sudah
   terdaftar di Supabase Auth; perubahannya hanya pada syarat akses data aplikasi.
   Jangan menerapkan skema ini sambil membiarkan frontend lama terus digunakan: login/unggah versi
   lama tidak kompatibel dengan aturan baru.
3. Ikuti konfigurasi Auth di [`supabase/README.md`](supabase/README.md): matikan signup publik staf,
   password policy minimal 12, redirect URL yang tepat, serta batas sesi server.
4. Pastikan hosting menggunakan [`vercel.json`](vercel.json). Hosting selain Vercel perlu memasang
   header yang setara. CSP saat ini mengizinkan Supabase `*.supabase.co`; jika memakai custom domain,
   tambahkan origin tepat ke `connect-src` dan `img-src`, bukan wildcard semua HTTPS.
5. Verifikasi admin login email + kata sandi, pelatih absensi/rapor, portal siswa, pendaftaran, upload/verifikasi
   pembayaran, serta logo pada halaman publik. Buat ulang kode lama 8 karakter melalui Profil Siswa
   secara bertahap dan kirim melalui kanal tepercaya. Rotasi kode membatalkan izin unggah yang belum dipakai.

Foto yang sebelumnya publik mungkin sudah diunduh atau masih tersimpan dalam cache lama. Perubahan
bucket tidak menarik salinan tersebut. Jika foto sangat sensitif, unggah ulang ke path baru dan
tangani objek/cache lama melalui API Storage. Referensi foto eksternal yang bukan Storage project
ini tidak lagi ditampilkan; unggah ulang melalui form aplikasi.

## Pemeriksaan dan pemantauan

```sh
npm ci
npm run lint
npm test
npm run build
npm audit --audit-level=moderate
```

Pengujian menjalankan skema asli pada PostgreSQL lokal berbasis PGlite + pgcrypto. Kontrak
`auth.uid()`, `auth.jwt()`, dan tabel Storage diemulasikan untuk menjalankan RLS dengan role
`anon`/`authenticated`. Uji ini mencakup hak akses dengan sesi password (`aal1`), isolasi portal, penghitung
kode salah, kuota pendaftaran, izin unggah, kepemilikan bukti, rotasi kode, dan audit append-only.
Verifikasi pembayaran diuji dengan kegagalan update tagihan yang disengaja (seluruh penulisan harus
rollback), permintaan berulang, cicilan event, serta aktivasi pendaftaran. Pencatatan pembayaran manual
di luar alur verifikasi masih memakai lapisan sinkronisasi per tabel yang sudah ada.
Tes utilitas mencakup key rahasia, CSV injection, payload gambar dan kedaluwarsa sesi.
Migrasi penonaktifan MFA diuji terhadap aturan database lama yang mewajibkan `aal2`, termasuk
pengulangan migrasi dan pembatasan peran yang tetap berlaku. Ini bukan pentest terhadap layanan
produksi, pengujian login browser dengan akun nyata, atau pengujian CDN Storage nyata.

Contoh pemeriksaan log oleh administrator database:

```sql
select occurred_at, actor_id, table_name, record_id, action
from public.security_audit_log
order by occurred_at desc
limit 100;
```

Log tidak menyimpan biodata/password/kode akses. Atur retensi audit dan alert sesuai kebutuhan klub.
Objek bukti dari unggahan yang ditinggalkan perlu dibersihkan berkala menggunakan API Storage dari
pekerjaan server tepercaya, setelah memastikan tidak dirujuk `payment_submissions`. Jangan menghapus
baris `storage.objects` secara langsung untuk membersihkan file.

Dependabot dan CI memeriksa dependensi rutin. Audit npm hanya mencakup kerentanan yang sudah dikenal.
Sesi yang dicuri tetap memerlukan pencabutan/rotasi di server; idle logout browser tidak membatalkan
JWT salinan penyerang. Access JWT dapat hidup sampai expiry walaupun refresh session telah dicabut.
Pembatasan database belum menggantikan WAF/DDoS protection atau CAPTCHA yang diverifikasi server
pada pendaftaran publik. Penyerang dapat menghabiskan kuota global dan menyebabkan penolakan sementara;
lapisan hosting perlu membatasi sumber trafik sebelum mencapai database.

Sumber implementasi: [keamanan fungsi Supabase](https://supabase.com/docs/guides/database/functions),
[sesi Supabase](https://supabase.com/docs/guides/auth/sessions), dan
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy).
