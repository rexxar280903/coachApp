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
`portal_submit_payment`, dan dua bucket storage: `avatars` (publik) dan `payment-proofs` (privat).

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
| Admin | `/` | Email + kata sandi | Semua tabel (RLS `is_admin()`) |
| Pelatih | `/sesi-absensi`, `/rapor` | Email + kata sandi | Baca siswa/kelas/pelatih/template & folder rapor, baca-tulis absensi & isian rapor |
| Siswa / wali | `/portal` | No. HP + **kode akses** | Hanya data siswa itu (termasuk rapor dari folder yang *diterbitkan*), lewat fungsi `portal_*` |
| Calon siswa | `/daftar` | Tanpa login | Hanya mengirim pendaftaran (status selalu *Calon*) |

Tautan untuk bio Instagram / WhatsApp: `https://domain-anda/daftar`. Tautan portal: `https://domain-anda/portal`.

**Kode akses siswa** dibuat otomatis (8 karakter). Admin melihat / menyalin / mengirimnya via WhatsApp dari
*Profil Siswa → Biodata → Akses Portal*. Kode bisa dibuat ulang kapan saja. Delapan kali salah kode untuk satu
nomor HP dalam 15 menit mengunci login portal untuk nomor itu selama 15 menit.

## Catatan keamanan & batasan

- Foto siswa dan logo ada di bucket **publik** dengan nama acak (tidak dapat ditebak, tidak dapat dilist).
  Bukti transfer ada di bucket **privat**; hanya admin yang dapat melihatnya (tautan bertanda tangan 8 jam).
- Pelatih dapat membaca tabel `students`, termasuk kolom `kode_akses`. Berikan peran `coach` hanya kepada orang tepercaya.
- Siswa/wali tidak melihat gambar bukti yang pernah dikirim (hanya statusnya), karena bucket bukti privat.
- Pendaftaran publik dibatasi per nama+HP (1 hari) dan 60 pendaftaran/jam; belum ada CAPTCHA.
- Tidak ada foreign key antar tabel (ID dibuat aplikasi). Hindari mengedit tabel langsung dari dashboard kecuali perlu.
- Aktifkan **Database → Backups** (paket Pro) atau ekspor berkala (`pg_dump`) untuk cadangan data.
