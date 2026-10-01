# 📋 CHECKLIST SEBELUM APP SIAP DIPAKAI (PRODUCTION-READY)

> **Nama Proyek:** SportKit Club Administration  
> **Versi Saat Ini:** 0.0.0  
> **Tanggal Audit:** 1 Oktober 2026  
> **Stack:** React 19 + Vite 8 + TailwindCSS 4 + TypeScript 7 + localStorage

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

### 1. 🗄️ Backend & Database (BELUM ADA)

Saat ini **semua data disimpan di `localStorage` browser**. Ini berarti:
- ❌ Data hilang jika user clear browser / ganti device
- ❌ Tidak bisa diakses multi-user (admin di PC A tidak bisa lihat data admin di PC B)
- ❌ Tidak aman — siswa bisa manipulasi data via DevTools
- ❌ Kapasitas terbatas (~5-10MB)

**Yang perlu dibuat:**
- [ ] Pilih database: **Supabase** (recommended, gratis), Firebase, atau PostgreSQL + Express
- [ ] Buat skema tabel untuk semua entity (`students`, `classes`, `monthly_dues`, `events`, `event_participants`, `attendance_sessions`, `transactions`, `payment_submissions`, `club_profile`)
- [ ] Migrasi semua fungsi di `storage.ts` dari `localStorage` ke API calls
- [ ] Implementasi REST API atau Supabase client

### 2. 🔐 Autentikasi & Otorisasi (BELUM ADA)

Saat ini role (Admin/Coach/Student/Public) hanya **switch UI biasa**, tanpa login.

**Yang perlu dibuat:**
- [ ] Sistem login (email + password / Google OAuth)
- [ ] Role-based access control (RBAC) yang real
- [ ] Tabel `users` dengan role masing-masing
- [ ] Proteksi route — coach tidak bisa akses halaman admin
- [ ] Session management (JWT / cookie)
- [ ] Halaman login/register
- [ ] Fitur lupa password

### 3. 🖼️ Upload File / Foto (BELUM ADA)

Saat ini foto profil siswa dan bukti transfer hanya menggunakan **SVG placeholder inline**.

**Yang perlu dibuat:**
- [ ] Integrasi storage (Supabase Storage / Firebase Storage / AWS S3)
- [ ] Upload foto profil siswa (dengan crop/resize)
- [ ] Upload bukti transfer pembayaran (gambar)
- [ ] Upload logo klub di pengaturan
- [ ] Validasi file type & size limit

### 4. 🌐 Deployment & Hosting (BELUM)

App belum di-deploy ke server mana pun.

**Yang perlu dilakukan:**
- [ ] Pilih hosting: **Vercel** (recommended, gratis), Netlify, atau VPS
- [ ] Setup domain (opsional, bisa pakai subdomain gratis)
- [ ] Setup environment variables (`.env`)
- [ ] Setup CI/CD pipeline (auto deploy dari Git push)
- [ ] Testing build production (`npm run build`)
- [ ] Setup HTTPS/SSL

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

Phase 2: BACKEND — SUPABASE (Setelah Phase 1 Selesai)
├── 4. [ ] Buat project di Supabase (gratis)
├── 5. [ ] Jalankan skrip SQL untuk semua tabel
│         (students, classes, monthly_dues, events,
│          event_participants, attendance_sessions,
│          transactions, payment_submissions, club_profile)
├── 6. [ ] Migrasi storage.ts: localStorage → Supabase client
├── 7. [ ] Setup Supabase Storage bucket
│         → Bucket: avatars (foto profil siswa)
│         → Bucket: payment-proofs (bukti transfer)
└── 8. [ ] Implementasi Auth (Login + Role Management)
          → Halaman /login (email + password)
          → Protected routes per role (Admin, Coach, Student)
          → Fitur lupa password

Phase 3: DEPLOYMENT (Setelah Phase 2 Selesai)
├── 9.  [ ] Build production & test (npm run build)
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
