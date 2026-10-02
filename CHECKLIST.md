# 📋 CHECKLIST SEBELUM APP SIAP DIPAKAI (PRODUCTION-READY)

> **Nama Proyek:** SportKit Club Administration  
> **Versi Saat Ini:** 0.0.0  
> **Tanggal Audit:** 1 Oktober 2026  
> **Stack:** React 19 + Vite 8 + TailwindCSS 4 + TypeScript 7 + Supabase (Postgres, Auth, Storage)

---

## 🏗️ STATUS FITUR SAAT INI

### ✅ Sudah Selesai (Implemented)

| No | Fitur | File | Keterangan |
|----|-------|------|------------|
| 1 | Dashboard Admin | `DashboardView.tsx` | Statistik siswa, transaksi terakhir, navigasi cepat |
| 2 | Manajemen Kelas | `KelasManagerView.tsx` | CRUD kelas, reassign siswa saat hapus kelas |
| 3 | Pendaftaran Siswa Baru | `PendaftaranView.tsx` | Form lengkap, mode admin & public (bio IG) |
| 4 | Calon Siswa (Applicant) | `CalonSiswaView.tsx` | List calon, approve + bayar, hapus bulk |
| 5 | Daftar Siswa Aktif/Cuti/Nonaktif | `SiswaListView.tsx` | Filter per status, ubah status siswa |
| 6 | Profil Siswa Detail | `ProfilSiswaView.tsx` (101KB!) | Biodata, riwayat iuran, absensi, edit profil |
| 7 | Iuran Rutin (Bulanan) | `IuranRutinView.tsx` | Matrix per kelas & bulan, catat pembayaran |
| 8 | Iuran Insidentil (Event) | `IuranInsidentilView.tsx` | Event management, peserta, pembayaran |
| 9 | Verifikasi Pembayaran | `VerifikasiPembayaranView.tsx` | Approve/reject bukti transfer siswa |
| 10 | Angsuran & Laporan Iuran | `AngsuranLaporanView.tsx` | Dua mode: angsuran & laporan rekapan |
| 11 | Sesi Absensi | `SesiAbsensiView.tsx` | Input absensi per kelas, catat kehadiran |
| 12 | Laporan Absensi | `LaporanAbsensiView.tsx` | Rekap absensi per siswa & per sesi |
| 13 | Portal Siswa | `StudentPortalView.tsx` | View iuran, upload bukti bayar, lihat kuitansi |
| 14 | Payment Modal (Global) | `PaymentModal.tsx` | Proses pembayaran multi-tipe |
| 15 | Cetak Kuitansi | `ReceiptModal.tsx` | Preview & print kuitansi resmi |
| 16 | Pengaturan Klub | `PengaturanView.tsx` | Edit profil klub, reset/seed data |
| 17 | Multi-Role Switching | `Header.tsx` | Admin, Coach, Student, Public mode |
| 18 | Responsive Sidebar | `Sidebar.tsx` | Navigasi desktop + mobile drawer |
| 19 | Pendaftaran Online (Public) | `PendaftaranView.tsx` | Mode link publik untuk bio IG/WA |
| 20 | Manajemen Pelatih | `PelatihView.tsx`, `utils/coaches.ts` | CRUD, relasi kelas/sesi via ID (multi-pelatih), validasi HP & duplikat, pencarian, beban kelas |

---

## 🔴 KRITIS — Harus Diselesaikan Sebelum Production

> **Status (2 Okt 2026):** kode untuk poin 1–3 sudah selesai dan lolos `tsc`, build, uji skema/RLS di PostgreSQL, serta
> uji alur UI dengan Supabase tiruan. **Yang masih harus dilakukan manual:** membuat project Supabase, menjalankan
> `supabase/schema.sql`, mengisi env, dan uji end-to-end dengan project sungguhan — ikuti `supabase/README.md`.

### 1. 🗄️ Backend & Database ✅ (kode selesai — perlu setup project Supabase)

- [x] Supabase dipilih; skema untuk semua entity ada di `supabase/schema.sql` (+ `seed.sql` opsional)
- [x] `src/services/storage.ts` dimigrasi dari `localStorage` ke Supabase (sinkronisasi per baris, hanya yang berubah)
- [x] Row Level Security: admin penuh, pelatih baca data dasar + tulis absensi, anon hanya baca kelas/profil klub
- [ ] Buat project Supabase & jalankan `schema.sql` *(manual)*
- [ ] Migrasi data lama dari `localStorage` bila ada data yang perlu dipertahankan *(tidak ada migrasi otomatis)*

### 2. 🔐 Autentikasi & Otorisasi ✅ (kode selesai — perlu setup project Supabase)

- [x] Login pengurus (email + kata sandi, Supabase Auth) di `/login`, lupa/atur ulang kata sandi di `/reset-password`
- [x] Role admin/pelatih dari tabel `profiles`; saklar role di UI dihapus
- [x] Proteksi rute: tanpa login → `/login`; pelatih hanya Sesi Latihan & Rekap Absensi
- [x] Portal Siswa `/portal`: login sederhana No. HP + kode akses (8 karakter) lewat fungsi database; batas percobaan salah
- [x] Pendaftaran publik `/daftar` tanpa login (status selalu *Calon*, biaya diambil dari kelas di server)
- [ ] Buat admin pertama & nonaktifkan sign-up publik di Supabase *(manual, lihat `supabase/README.md`)*

### 3. 🖼️ Upload File / Foto ✅ (kode selesai)

- [x] Bukti transfer → bucket privat `payment-proofs` (admin melihat lewat tautan bertanda tangan)
- [x] Foto siswa (Profil → Biodata) dan logo klub (Pengaturan) → bucket publik `avatars`
- [x] Validasi tipe (JPG/PNG/WebP) & ukuran, gambar diperkecil di browser sebelum diunggah
- [x] Tombol "Contoh Struk" (bukti palsu) dihapus
- [ ] Crop foto *(belum; hanya resize)*

### 4. 🌐 Deployment & Hosting (siap, belum dijalankan)

- [x] `vercel.json` (rewrite SPA + header keamanan dasar), `.env.example`, GitHub Actions CI (lint + build)
- [ ] Deploy ke Vercel & isi `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- [ ] Domain / HTTPS (otomatis di Vercel) dan daftarkan URL ke Auth → URL Configuration di Supabase
- [ ] Isi rekening tujuan transfer di Pengaturan Klub (sebelumnya tertulis langsung di kode)

---

## 🟡 PENTING — Sangat Direkomendasikan

### 5. 📱 Progressive Web App (PWA)

Agar bisa dipakai seperti app native di HP coach/admin.

- [ ] Tambahkan `manifest.json` (nama app, icon, theme color)
- [ ] Buat icon app berbagai ukuran (192x192, 512x512)
- [ ] Register Service Worker untuk offline support
- [ ] Splash screen saat loading

### 6. 🔔 Notifikasi & Reminder

- [ ] Notifikasi WhatsApp otomatis ke siswa yang belum bayar iuran
- [ ] Reminder ke admin untuk verifikasi bukti bayar pending
- [ ] Push notification via browser (opsional)
- [ ] Integrasi WhatsApp API (Fonnte / Woowa API)

### 7. 📊 Export Data & Laporan

- [ ] Export data siswa ke Excel/CSV
- [ ] Export laporan iuran bulanan ke PDF
- [ ] Export rekap absensi ke Excel
- [ ] Cetak laporan keuangan per periode
- [ ] Download kuitansi sebagai PDF

### 8. 🔍 Pencarian & Filter Global

- [ ] Search bar global di header (cari siswa, transaksi, kuitansi)
- [ ] Filter transaksi per rentang tanggal
- [ ] Filter siswa per kelas di semua halaman
- [ ] Sort tabel (nama, tanggal, nominal)

### 9. ✅ Validasi & Error Handling

- [ ] Validasi form yang lebih ketat (no HP format, email format, tanggal lahir valid)
- [ ] Error boundary React untuk crash protection
- [ ] Toast notification system (success, error, warning) — gantikan `alert()`/`confirm()`
- [ ] Loading states & skeleton screens
- [ ] Handle edge case: data kosong, duplicate, concurrent edit

---

## 🟢 NICE TO HAVE — Bisa Nanti

### 10. 📈 Analitik & Insight

- [ ] Grafik tren pendapatan bulanan (chart.js / recharts)
- [ ] Persentase kehadiran siswa per bulan (visualisasi)
- [ ] Dashboard KPI: rasio lunas vs belum bayar
- [ ] Prediksi cashflow berdasarkan data historis

### 11. 🧑‍🏫 Fitur Coach (Enhanced)

- [ ] Coach bisa lihat jadwal latihan per kelas
- [ ] Coach bisa input catatan per siswa setelah sesi
- [ ] Evaluasi performa siswa per periode
- [ ] Kalender latihan interaktif

### 12. 👨‍👩‍👧 Fitur Orang Tua / Siswa (Enhanced)

- [ ] Portal khusus orang tua (login terpisah)
- [ ] Notifikasi email ringkasan bulanan ke orang tua
- [ ] Riwayat pembayaran downloadable
- [ ] Raport absensi & progress anak

### 13. 🛡️ Keamanan Tambahan

- [ ] Rate limiting pada API
- [ ] CSRF protection
- [ ] Input sanitization (XSS prevention)
- [ ] Audit log — siapa mengubah apa dan kapan
- [ ] Backup data otomatis

### 14. 🎨 Polish & UX

- [ ] Dark mode toggle
- [ ] Animasi transisi antar halaman (sudah ada `motion` di dependency, tapi belum terpakai di semua view)
- [ ] Onboarding wizard untuk admin baru
- [ ] Help/tooltip di setiap fitur
- [ ] Accessibility (keyboard navigation, screen reader, ARIA labels)
- [ ] Internationalization (multi-bahasa, jika perlu bahasa Inggris)

---

## ⚠️ MASALAH TEKNIS YANG PERLU DIPERBAIKI

| No | Masalah | Detail | Prioritas |
|----|---------|--------|-----------|
| 1 | `ProfilSiswaView.tsx` = **101KB** | File terlalu besar, sulit di-maintain. Pecah jadi sub-komponen. | 🟡 Sedang |
| 2 | `StudentPortalView.tsx` = **51KB** | Sama, perlu refactor jadi komponen modular. | 🟡 Sedang |
| 3 | `App.tsx` = **40KB**, 1141 baris | Semua state & handler terpusat. Perlu state management (Zustand/Context). | 🟡 Sedang |
| 4 | Semua state di `App.tsx` | Prop drilling sangat dalam (App → View → Sub-component). Gunakan React Context atau Zustand. | 🟡 Sedang |
| 5 | `confirm()` & `alert()` | Masih pakai dialog browser bawaan. Ganti dengan custom modal/toast. | 🟢 Rendah |
| 6 | Tidak ada routing library | Navigasi hanya state-based. Tidak bisa share URL. Tambahkan React Router. | 🟡 Sedang |
| 7 | `@google/genai` di dependencies | Dependency Gemini AI ada tapi tidak terlihat digunakan di code. Hapus atau implementasikan. | 🟢 Rendah |
| 8 | `express` di dependencies | Ada tapi tidak ada server file. Hapus atau buat backend. | 🟡 Sedang |
| 9 | Tidak ada unit test | Belum ada test sama sekali. Tambahkan Vitest + React Testing Library. | 🟡 Sedang |
| 10 | Version masih `0.0.0` | Update ke semantic versioning (misal `1.0.0-beta`). | 🟢 Rendah |

---

## 🐞 PERBAIKAN BUG (Audit 1 Okt 2026) — SELESAI ✅

| No | Masalah | Perbaikan |
|----|---------|-----------|
| 1 | Bayar event/pendaftaran ikut melunasi iuran Desember 2024 | Periode bulan/tahun hanya dikirim untuk Iuran Rutin; handler dipisah per tipe pembayaran |
| 2 | Angsuran/cicilan langsung dianggap lunas & menimpa nominal | Pembayaran kumulatif (`utils/payments.ts`), status `belum_lunas` sampai tertutup penuh |
| 3 | Peserta event lunas tanpa cek nominal, `pesertaLunas` selalu +1 | Cicilan event + hitung ulang dari data peserta |
| 4 | "Bayar Langsung" mengaktifkan siswa sebelum bayar | Siswa tetap `Calon` sampai pembayaran tercatat; iuran perdana pakai tarif kelas |
| 5 | Data demo bukti bayar muncul lagi setelah reset | Injeksi `INITIAL_SUBMISSIONS` dihapus dari `getPaymentSubmissions` |
| 6 | Pembayaran ganda (bulan lunas / bukti pending) | Diblokir di portal siswa, verifikasi admin, dan input admin |
| 7 | Event baru tidak bisa diberi peserta | Modal "Tambah Peserta" + hapus peserta yang belum bayar |
| 8 | Sesi absensi salah saat ganti kelas, tidak bisa diedit | Daftar hadir di-reset per kelas, fitur edit sesi, peringatan sesi dobel |
| 9 | Tahun default 2024 & dropdown tahun hardcoded | `getCurrentYear()` / `getYearOptions()` |
| 10 | Tanggal pakai UTC (salah sebelum 07:00 WIB) | `getTodayISO()` memakai zona waktu lokal |
| 11 | Nomor kuitansi bisa kembar | Nomor urut harian `INVSP-YYMMDD-NNN` |
| 12 | Hapus kelas meninggalkan data yatim | Iuran, peserta event, sesi absensi ikut dibersihkan/dipindah |
| 13 | Pendaftaran mengisi data palsu, tanpa validasi | Validasi HP/email/tanggal lahir, tanpa data dummy |
| 14 | Verifikasi selalu bertipe "Iuran Rutin" | Tipe transaksi mengikuti tipe bukti bayar |
| 15 | Masih ada 18 `alert()` | Semua diganti toast |
| 16 | Role bisa akses halaman admin lewat URL, hilang saat refresh | Route guard per role + role disimpan |
| 17 | localStorage rusak → layar putih | Parse aman + `ErrorBoundary` |

---

## 🐞 PERBAIKAN BUG TAHAP 2 — SELESAI ✅

| No | Masalah | Perbaikan |
|----|---------|-----------|
| 1 | Cetak kuitansi ikut mencetak halaman di belakangnya | Kuitansi dirender via portal; `#root` disembunyikan saat print |
| 2 | Bulan sebelum tanggal bergabung tampil menunggak | Status efektif dari `tanggalBergabung` (`effectiveDueStatus`), bulan itu tidak bisa dibayar |
| 3 | Siswa Cuti/Nonaktif tetap terlihat menunggak | Status `cuti`/`nonaktif` sejak `tanggalStatus`; dikunci saat siswa aktif kembali; siswa nonaktif disembunyikan di matriks (opsional ditampilkan) |
| 4 | Portal siswa menampilkan cicilan sebagai LUNAS | Status dari record tagihan, tampil terbayar & sisa, tombol "Bayar Sisa" |
| 5 | Ekspor CSV terpotong oleh `#`, kutip tidak di-escape | Ekspor via Blob, escape RFC 4180, BOM UTF-8 |
| 6 | Edit biodata tanpa validasi | Validasi nama, nomor HP, email |
| 7 | Kelebihan bayar tidak diperingatkan | Konfirmasi di modal pembayaran, peringatan di verifikasi & input admin |
| 8 | Ubah tarif kelas tidak berlaku ke siswa | Tarif calon & siswa aktif ikut kelas (juga saat pindah kelas); record iuran lama tidak diubah |
| 9 | Catatan verifikasi selalu "lunas" | Catatan & peringatan mengikuti hasil (lunas / cicilan / kelebihan) |
| 10 | Data demo terkunci di 2024 | Tanggal demo digeser relatif ke bulan berjalan |

---

## 📝 LANGKAH REKOMENDASI (Urutan Prioritas yang Diperbarui)

> ✅ **Keputusan:** Pilih **Opsi A** — rapikan fondasi frontend terlebih dahulu sebelum integrasi Supabase.
> Alasan: Menghindari kerja dua kali. Dengan React Router terpasang, integrasi Auth Supabase nanti jauh lebih mudah.

```
Phase 1: RAPIKAN FRONTEND — OPSI A ✅ (SELESAI ✅)
├── 1. [x] Pasang React Router v7
│         → URL jadi /dashboard, /siswa, /iuran, /absensi, dll
│         → Navigasi sinkron dengan browser URL (bisa refresh, back/forward)
│         → Siap dipasangi halaman /login saat Supabase terpasang
│
├── 2. [x] Buat sistem Custom Toast / Notification
│         → Ganti semua alert() & confirm() bawaan browser
│         → Toast animasi elegan (success ✅, error ❌, warning ⚠️, info ℹ️)
│         → Custom confirm dialog dengan tombol Batal / Ya, Lanjutkan
│
└── 3. [x] Bersihkan dependency yang tidak terpakai
          → Hapus: express, dotenv, @types/express, @google/genai
          → 118 package dihapus, bundle lebih ringan
          → Tambah: react-router-dom@7

Phase 2: BACKEND — SUPABASE (kode SELESAI; tinggal setup project)
├── 4. [ ] Buat project di Supabase (gratis)
├── 5. [ ] Jalankan skrip SQL untuk semua tabel (skrip siap: supabase/schema.sql)
│         (students, classes, monthly_dues, events,
│          event_participants, attendance_sessions,
│          transactions, payment_submissions, club_profile)
├── 6. [x] Migrasi storage.ts: localStorage → Supabase client
├── 7. [x] Setup Supabase Storage bucket
│         → Bucket: avatars (foto profil siswa)
│         → Bucket: payment-proofs (bukti transfer)
└── 8. [x] Implementasi Auth (Login + Role Management)
          → Halaman /login (email + password)
          → Protected routes per role (Admin, Coach, Student)
          → Fitur lupa password

Phase 3: DEPLOYMENT (Setelah Phase 2 Selesai)
├── 9.  [x] Build production & test (npm run build)
├── 10. [ ] Deploy ke Vercel (gratis, connect GitHub)
├── 11. [ ] Setup environment variables di Vercel
│          → VITE_SUPABASE_URL
│          → VITE_SUPABASE_ANON_KEY
└── 12. [ ] Test end-to-end di production (multi-device)

Phase 4: POLISH & ENHANCEMENT (Ongoing)
├── 13. [ ] Refactor file besar
│          → ProfilSiswaView.tsx (101KB) → pecah jadi sub-komponen
│          → StudentPortalView.tsx (51KB) → pecah jadi sub-komponen
│          → App.tsx (40KB) → pindahkan state ke Context/Zustand
├── 14. [ ] Implementasi PWA (manifest, service worker, app icon)
├── 15. [ ] Export data (Excel/CSV & PDF laporan)
├── 16. [ ] Notifikasi WhatsApp otomatis (Fonnte API)
├── 17. [ ] Grafik & analitik dashboard (recharts)
├── 18. [ ] Dark mode & animasi lanjutan (motion)
├── 19. [ ] Testing (Vitest + React Testing Library)
└── 20. [ ] Fitur enhanced: coach notes, portal orang tua
```

---

## 📂 STRUKTUR FILE SAAT INI

```
coachApp/
├── index.html              ← Entry point HTML
├── package.json            ← Dependencies & scripts
├── vite.config.ts          ← Vite + Tailwind + React
├── tsconfig.json           ← TypeScript config
├── .env.example            ← Environment variables template
├── .gitignore
├── metadata.json           ← App metadata (AI Studio)
│
└── src/
    ├── main.tsx            ← React root mount
    ├── App.tsx             ← 🟡 Main app (1141 lines, semua state)
    ├── index.css           ← Global styles
    │
    ├── components/
    │   ├── Header.tsx      ← Top bar + role switcher
    │   ├── Sidebar.tsx     ← Navigation sidebar
    │   ├── PaymentModal.tsx ← Global payment processor
    │   └── ReceiptModal.tsx ← Kuitansi preview & print
    │
    ├── views/
    │   ├── DashboardView.tsx
    │   ├── KelasManagerView.tsx
    │   ├── PendaftaranView.tsx
    │   ├── CalonSiswaView.tsx
    │   ├── SiswaListView.tsx
    │   ├── ProfilSiswaView.tsx      ← 🟡 101KB, perlu dipecah
    │   ├── IuranRutinView.tsx
    │   ├── IuranInsidentilView.tsx
    │   ├── VerifikasiPembayaranView.tsx
    │   ├── AngsuranLaporanView.tsx
    │   ├── SesiAbsensiView.tsx
    │   ├── LaporanAbsensiView.tsx
    │   ├── StudentPortalView.tsx    ← 🟡 51KB, perlu dipecah
    │   └── PengaturanView.tsx
    │
    ├── services/
    │   └── storage.ts      ← 🔴 localStorage only, perlu migrasi
    │
    ├── types/
    │   └── sportkit.ts     ← Type definitions (sudah lengkap)
    │
    └── utils/
        ├── constants.ts    ← Nama bulan, helper tanggal
        └── numberToWordsId.ts ← Angka → terbilang (Rupiah)
```

---

## ✍️ CATATAN AKHIR

Secara **fitur frontend**, app ini sudah **sangat lengkap** (~90% UI selesai) dengan 14 halaman/view yang berfungsi penuh. Yang paling krusial sekarang adalah:

1. **Backend + Database** — tanpa ini, app tidak bisa dipakai real karena data hilang
2. **Login system** — tanpa ini, siapa saja bisa akses semua data
3. **File upload** — tanpa ini, foto & bukti transfer tidak bisa benar-benar di-upload

Setelah 3 hal di atas selesai, app sudah bisa dipakai secara basic untuk manajemen klub olahraga.

---

> 💡 **Saran:** Gunakan **Supabase** (gratis tier: 500MB database, 1GB storage, unlimited API calls) sebagai backend tercepat. Bisa setup dalam 1 hari dan sudah include auth, database (PostgreSQL), dan storage.
