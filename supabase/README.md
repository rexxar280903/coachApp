# Setup Supabase untuk SportKit

Urutan kerja (±30 menit). Semua langkah di sini dilakukan sekali.

## 1. Buat project

1. Daftar / login di <https://supabase.com> → **New project** (pilih region terdekat, mis. Singapore).
2. Simpan *database password* di password manager.

## 2. Jalankan skema

1. Dashboard → **SQL Editor** → **New query**.
2. Tempel seluruh isi [`schema.sql`](./schema.sql) → **Run**. Aman diulang bila perlu.
3. (Opsional) Jalankan [`seed.sql`](./seed.sql) untuk profil klub dan kelas contoh. Ubah isinya dulu sesuai klub Anda.

Skema membuat tabel, kebijakan Row Level Security (RLS), fungsi `public_register` / `portal_data` /
`portal_submit_payment` / `portal_create_upload` / `admin_review_payment`, dan dua bucket privat: `avatars` dan `payment-proofs`.
Logo profil klub memiliki policy baca publik tersendiri.

### Pembaruan keamanan (8 Okt 2026 — wajib diterapkan bersama frontend baru)

Database yang sudah dibuat sebelumnya **harus menjalankan ulang seluruh `schema.sql`** sekali (aman diulang).
Pembaruan keamanan menutup akses pelatih ke kode/biodata sensitif siswa,
membuat bucket foto privat, serta mengganti unggahan bukti anonim dengan izin unggah yang kedaluwarsa.
Versi frontend lama tidak mendukung perubahan ini. Terapkan skema dan deploy frontend baru dalam
jendela pemeliharaan yang sama. Panduan lengkap dan batas pengujian ada di [`../SECURITY.md`](../SECURITY.md).

Authenticator sementara dinonaktifkan sesuai keputusan pemilik aplikasi. Admin dan pelatih login dengan
email + kata sandi. Jika versi skema dengan MFA wajib sudah diterapkan, jalankan
[`migrations/20261008_disable_staff_mfa.sql`](./migrations/20261008_disable_staff_mfa.sql) bersama frontend
terbaru untuk menghapus syarat MFA tanpa mengubah policy akses data lainnya. Database baru atau yang
belum menerima pembaruan keamanan tetap memakai seluruh `schema.sql` terbaru.

## 3. Pengaturan Auth

Dashboard → **Authentication**:

- **Sign In / Providers → Email**: aktif. **Matikan "Allow new users to sign up"** (akun pengurus dibuat manual,
  lihat langkah 4). Akun tanpa baris di tabel `profiles` memang tidak bisa membaca data apa pun, tetapi tidak ada
  alasan membiarkan pendaftaran terbuka.
- **URL Configuration**:
  - *Site URL*: alamat aplikasi Anda, mis. `https://sportkit-anda.vercel.app`
  - *Redirect URLs*: tambahkan `https://sportkit-anda.vercel.app/reset-password`
    (dan `http://localhost:3000/reset-password` untuk uji lokal).
    Tanpa ini tautan "Lupa kata sandi" tidak akan berfungsi.
- **Login pengurus**: email + kata sandi. Alur enrollment/verifikasi authenticator dan syarat
  JWT `aal2` dinonaktifkan sementara; akses tetap memerlukan sesi Auth valid dan peran di `profiles`.
- **Password security**: atur minimal 12 karakter dan aktifkan penolakan kata sandi yang bocor bila
  tersedia pada paket Anda. Validasi frontend hanya membantu pengguna; pengaturan Auth menegakkan
  kebijakan untuk permintaan langsung ke API.
- **Session settings**: gunakan JWT expiry yang pendek sesuai kebutuhan operasional (mis. 15–30 menit)
  serta batas sesi/inaktivitas server bila tersedia. Logout mencabut refresh session, sedangkan access
  JWT yang sudah diterbitkan tetap berlaku sampai kedaluwarsa.
- (Disarankan) **Emails → SMTP**: pakai SMTP sendiri bila email reset password perlu dikirim ke banyak orang;
  layanan bawaan Supabase dibatasi jumlah email per jam.

## 4. Buat admin pertama

1. **Authentication → Users → Add user → Create new user**: isi email + kata sandi, centang *Auto Confirm User*.
2. Jalankan di SQL Editor (ganti email):

```sql
insert into public.profiles (id, nama, role)
select id, 'Nama Admin', 'admin' from auth.users where email = 'admin@klubanda.com';
```

### Menambah pelatih / admin lain

Ulangi langkah di atas, dengan `role` = `'coach'` (hanya bisa melihat data dasar dan mengisi absensi) atau `'admin'`.
Mencabut akses: `delete from public.profiles where id = '<uuid>';` (dan hapus user di Authentication).

## 5. Hubungkan aplikasi

Salin `.env.example` → `.env` lalu isi dari **Project Settings → API**:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...   # anon / public key
```

```bash
npm install
npm run dev     # http://localhost:3000
```

Setelah login sebagai admin, buka **Pengaturan Klub** dan isi profil klub, logo, serta **rekening tujuan
transfer** (ditampilkan kepada siswa di Portal Siswa).

## 6. Deploy ke Vercel

1. Import repo di <https://vercel.com> (framework Vite terdeteksi otomatis; `vercel.json` sudah memuat rewrite SPA).
2. **Settings → Environment Variables**: isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
3. Deploy, lalu masukkan domain final ke *Site URL* / *Redirect URLs* di Supabase (langkah 3).

## Cara kerja akses

| Pengguna | Halaman | Login | Akses data |
| --- | --- | --- | --- |
| Admin | `/` | Email + kata sandi | Tabel data melalui RLS `is_admin()`; audit hanya baca |
| Pelatih | `/sesi-absensi`, `/rapor` | Email + kata sandi | Data siswa dasar melalui `coach_students()`; kelas/pelatih/rapor, baca-tulis absensi & isian rapor |
| Siswa / wali | `/portal` | No. HP + **kode akses** | Hanya data siswa itu (termasuk rapor dari folder yang *diterbitkan*), lewat fungsi `portal_*` |
| Calon siswa | `/daftar` | Tanpa login | Hanya mengirim pendaftaran (status selalu *Calon*) |

Tautan untuk bio Instagram / WhatsApp: `https://domain-anda/daftar`. Tautan portal: `https://domain-anda/portal`.

**Kode akses siswa** baru dibuat otomatis (12 karakter / 60 bit). Kode lama 8 karakter tetap valid sampai
dibuat ulang oleh admin. Admin melihat / menyalin / mengirimnya via WhatsApp dari
*Profil Siswa → Biodata → Akses Portal*. Kode bisa dibuat ulang kapan saja. Delapan kali salah kode untuk satu
nomor HP dalam jendela 15 menit membatasi login portal sampai percobaan lama keluar dari jendela tersebut.
Penghitung berlaku pada semua RPC portal, termasuk permintaan unggah/pembayaran dengan kode salah.

## Catatan keamanan & batasan

- Foto siswa/pelatih ada di bucket **privat**, hanya dapat dibaca staf yang berhak melalui signed URL
  berdurasi 1 jam. Logo yang dirujuk profil klub dapat dibaca publik. Foto siswa tidak dikirim ke portal
  tanpa akun Auth; portal menggunakan inisial sebagai pengganti foto.
- Pelatih tidak dapat membaca tabel `students`. RPC khusus hanya mengirim nama, kelas, jenis kelamin,
  status, tanggal bergabung, dan referensi foto; kode akses serta kontak keluarga tidak dikirim.
- Bukti transfer privat; pengurus admin melihatnya melalui signed URL 1 jam. Portal hanya menampilkan
  pratinjau lokal unggahan pada sesi berjalan. Izin unggah berlaku 10 menit, terikat siswa/kode akses,
  dan tidak dapat dipakai untuk bukti milik siswa lain atau digunakan kembali setelah dikirim.
- Pendaftaran dibatasi 60 permintaan valid/jam secara global dan 3/nomor kontak/hari, termasuk nomor
  orang tua. Unggahan portal dibatasi 3/siswa/10 menit dan 100/global/10 menit. Batas global sengaja
  menolak permintaan saat kuota habis; perlu disesuaikan jika volume klub meningkat.
- Pembatasan database bukan perlindungan DDoS. CAPTCHA terverifikasi server dan rate limit di lapisan
  hosting diperlukan bila endpoint publik terkena bot. CAPTCHA belum diintegrasikan pada pendaftaran.
- `security_audit_log` mencatat aktor, tabel, ID, aksi, dan waktu perubahan penting tanpa menyalin
  kode akses/biodata. API browser hanya mengizinkan admin membaca log, tidak mengubah atau menghapusnya.
- Tidak ada foreign key antar tabel (ID dibuat aplikasi). Hindari mengedit tabel langsung dari dashboard kecuali perlu.
- Aktifkan **Database → Backups** (paket Pro) atau ekspor berkala (`pg_dump`) untuk cadangan data.
