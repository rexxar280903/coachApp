-- =============================================================================
-- SportKit Club Administration — skema Supabase
-- Jalankan seluruh file ini di Supabase Dashboard → SQL Editor (aman diulang).
-- Setelah itu jalankan seed.sql (opsional) lalu ikuti supabase/README.md.
--
-- Catatan desain:
--  * Semua tanggal disimpan sebagai TEXT agar format aplikasi (YYYY-MM-DD /
--    "YYYY-MM-DD HH:mm") tidak berubah.
--  * ID dibuat oleh aplikasi (text), tanpa foreign key, supaya penyimpanan
--    per-tabel tidak bergantung pada urutan tulis. Integritas dijaga aplikasi.
--  * Staf (admin/pelatih) login via Supabase Auth; peran ada di tabel profiles.
--  * Siswa/wali TIDAK punya akun Auth: login memakai No. HP + Kode Akses lewat
--    fungsi RPC (security definer) yang hanya mengembalikan data milik siswa itu.
-- =============================================================================

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ─── Peran staf ──────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nama       text not null default '',
  role       text not null check (role in ('admin', 'coach')),
  created_at timestamptz not null default now()
);

create or replace function public.current_staff_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_staff_role() = 'admin', false)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_staff_role() in ('admin', 'coach'), false)
$$;

-- ─── Util ────────────────────────────────────────────────────────────────────

-- Kode akses portal siswa: 8 karakter tanpa karakter yang mudah tertukar (0/O, 1/I).
create or replace function public.gen_kode_akses()
returns text language plpgsql volatile security definer set search_path = public, extensions as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 karakter
  r text := '';
  i int;
begin
  for i in 1..8 loop
    r := r || substr(chars, (get_byte(gen_random_bytes(1), 0) % 32) + 1, 1);
  end loop;
  return r;
end $$;

-- Normalisasi nomor HP: 62812… / +62 812… / 812… → 0812…
create or replace function public.norm_hp(p text)
returns text language sql immutable as $$
  select case
    when d like '62%' then '0' || substr(d, 3)
    when d like '8%'  then '0' || d
    else d
  end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) x
$$;

-- ─── Tabel data ──────────────────────────────────────────────────────────────

create table if not exists public.club_profile (
  id              int primary key default 1 check (id = 1),
  nama_klub       text not null default '',
  cabang_olahraga text not null default '',
  alamat          text not null default '',
  kota            text not null default '',
  no_hp           text not null default '',
  email           text not null default '',
  no_whatsapp     text not null default '',
  logo_url        text,
  nama_bank       text,   -- rekening tujuan transfer yang ditampilkan di Portal Siswa
  no_rekening     text,
  atas_nama       text
);
-- Untuk database yang dibuat dari versi skema sebelumnya:
alter table public.club_profile add column if not exists nama_bank text;
alter table public.club_profile add column if not exists no_rekening text;
alter table public.club_profile add column if not exists atas_nama text;
insert into public.club_profile (id, nama_klub) values (1, 'Nama Klub Anda')
  on conflict (id) do nothing;

create table if not exists public.classes (
  id                text primary key,
  nama              text not null,
  deskripsi         text not null default '',
  iuran_bulanan     bigint not null default 0,
  biaya_pendaftaran bigint not null default 0,
  pelatih_ids       text[] not null default '{}',
  pelatih           text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.coaches (
  id                text primary key,
  nama              text not null,
  no_hp             text not null default '',
  email             text,
  spesialisasi      text not null default '',
  status            text not null default 'Aktif' check (status in ('Aktif', 'Nonaktif')),
  catatan           text,
  tanggal_bergabung text not null default '',
  foto              text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id                       text primary key,
  nama                     text not null,
  kelas_id                 text not null,
  jenis_kelamin            text not null check (jenis_kelamin in ('Laki-laki', 'Perempuan')),
  tempat_lahir             text not null default '',
  tanggal_lahir            text not null default '',
  no_hp                    text not null default '',
  email                    text,
  alamat                   text not null default '',
  orang_tua                jsonb not null default '{}'::jsonb,
  status                   text not null default 'Calon' check (status in ('Calon', 'Aktif', 'Cuti', 'Nonaktif')),
  catatan                  text,
  tanggal_bergabung        text not null default '',
  tanggal_status           text,   -- YYYY-MM-DD status terakhir diubah (awal cuti / nonaktif)
  biaya_pendaftaran        bigint not null default 0,
  iuran_bulanan            bigint not null default 0,
  total_biaya_pendaftaran  bigint not null default 0,
  foto                     text,
  kode_akses               text not null default public.gen_kode_akses(),
  created_at               timestamptz not null default now()
);
-- Untuk database yang dibuat dari versi skema sebelumnya:
alter table public.students add column if not exists tanggal_status text;
create unique index if not exists students_kode_akses_key on public.students (kode_akses);
create index if not exists students_kelas_idx on public.students (kelas_id);
create index if not exists students_status_idx on public.students (status);

create table if not exists public.monthly_dues (
  id            text primary key,
  siswa_id      text not null,
  tahun         int  not null,
  bulan         int  not null check (bulan between 1 and 12),
  status        text not null,
  nominal       bigint not null default 0,
  terbayar      bigint not null default 0,
  tanggal_bayar text,
  kuitansi_id   text,
  created_at timestamptz not null default now()
);
create index if not exists monthly_dues_siswa_idx on public.monthly_dues (siswa_id, tahun, bulan);

create table if not exists public.events (
  id            text primary key,
  nama          text not null,
  deskripsi     text not null default '',
  nominal       bigint not null default 0,
  tanggal       text not null default '',
  lokasi        text not null default '',
  total_peserta int not null default 0,
  peserta_lunas int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.event_participants (
  id            text primary key,
  event_id      text not null,
  siswa_id      text not null,
  status        text not null,
  nominal       bigint not null default 0,
  terbayar      bigint not null default 0,
  tanggal_bayar text,
  kuitansi_id   text,
  created_at timestamptz not null default now()
);
create index if not exists event_participants_event_idx on public.event_participants (event_id);
create index if not exists event_participants_siswa_idx on public.event_participants (siswa_id);

create table if not exists public.attendance_sessions (
  id         text primary key,
  tanggal    text not null,
  kelas_id   text not null,
  catatan    text not null default '',
  pelatih_id text,
  pelatih    text not null default '',
  kehadiran  jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists attendance_kelas_idx on public.attendance_sessions (kelas_id, tanggal);

create table if not exists public.transactions (
  id                text primary key,
  nomor_kuitansi    text not null,
  siswa_id          text not null,
  siswa_nama        text not null,
  kelas_nama        text not null default '',
  tanggal           text not null,
  nominal           bigint not null,
  terbilang         text not null default '',
  metode_pembayaran text not null,
  tipe              text not null,
  keterangan        text not null default '',
  catatan           text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_siswa_idx on public.transactions (siswa_id);
-- Pengaman agar dua kuitansi tidak pernah memiliki nomor yang sama.
create unique index if not exists transactions_nomor_kuitansi_key on public.transactions (nomor_kuitansi);

create table if not exists public.payment_submissions (
  id                 text primary key,
  siswa_id           text not null,
  siswa_nama         text not null,
  kelas_id           text not null default '',
  kelas_nama         text not null default '',
  tipe               text not null,
  bulan              int,
  tahun              int,
  event_id           text,
  event_nama         text,
  nominal            bigint not null,
  metode_pembayaran  text not null,
  tanggal_transfer   text not null,
  bukti_gambar_url   text not null default '',   -- path di bucket payment-proofs
  pesan_siswa        text,
  status             text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  tanggal_kirim      text not null,
  tanggal_verifikasi text,
  diverifikasi_oleh  text,
  catatan_admin      text,
  kuitansi_id        text,
  transaction_id     text,
  created_at timestamptz not null default now()
);
create index if not exists payment_submissions_siswa_idx on public.payment_submissions (siswa_id);
create index if not exists payment_submissions_status_idx on public.payment_submissions (status);

-- Rapor: template (blangko) → folder (periode + kelas) → isian per siswa.
create table if not exists public.rapor_templates (
  id         text primary key,
  nama       text not null,
  header     text not null default '',
  items      jsonb not null default '[]'::jsonb,   -- RaporItem[]
  footer     text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.rapor_folders (
  id              text primary key,
  nama            text not null,
  awal_penilaian  text not null default '',
  akhir_penilaian text not null default '',
  kelas_id        text not null,
  template_id     text not null,
  diterbitkan     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists rapor_folders_kelas_idx on public.rapor_folders (kelas_id);

create table if not exists public.rapor_entries (
  id          text primary key,
  folder_id   text not null,
  siswa_id    text not null,
  jawaban     jsonb not null default '{}'::jsonb,  -- { [item_id]: string | string[] }
  diisi_oleh  text not null default '',
  tanggal_isi text not null default '',
  created_at timestamptz not null default now()
);
create unique index if not exists rapor_entries_folder_siswa_key on public.rapor_entries (folder_id, siswa_id);
create index if not exists rapor_entries_siswa_idx on public.rapor_entries (siswa_id);

-- Percobaan login portal yang gagal (anti tebak-tebakan kode). Tidak punya policy
-- sama sekali → hanya bisa diakses fungsi security definer di bawah.
create table if not exists public.portal_login_failures (
  id  bigserial primary key,
  hp  text not null,
  at  timestamptz not null default now()
);
create index if not exists portal_login_failures_hp_idx on public.portal_login_failures (hp, at);

-- ─── Row Level Security ──────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'club_profile', 'classes', 'coaches', 'students', 'monthly_dues',
    'events', 'event_participants', 'attendance_sessions', 'transactions',
    'payment_submissions', 'portal_login_failures',
    'rapor_templates', 'rapor_folders', 'rapor_entries'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- Admin: akses penuh ke semua tabel data.
  foreach t in array array[
    'profiles', 'club_profile', 'classes', 'coaches', 'students', 'monthly_dues',
    'events', 'event_participants', 'attendance_sessions', 'transactions',
    'payment_submissions', 'rapor_templates', 'rapor_folders', 'rapor_entries'
  ] loop
    execute format('drop policy if exists admin_all on public.%I', t);
    execute format(
      'create policy admin_all on public.%I for all to authenticated
         using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  -- Pelatih: hanya baca data dasar.
  foreach t in array array[
    'students', 'classes', 'coaches', 'attendance_sessions',
    'rapor_templates', 'rapor_folders', 'rapor_entries'
  ] loop
    execute format('drop policy if exists coach_read on public.%I', t);
    execute format(
      'create policy coach_read on public.%I for select to authenticated
         using (public.current_staff_role() = ''coach'')', t);
  end loop;
end $$;

-- Pelatih boleh mencatat / mengubah absensi.
drop policy if exists coach_write on public.attendance_sessions;
create policy coach_write on public.attendance_sessions for all to authenticated
  using (public.current_staff_role() = 'coach')
  with check (public.current_staff_role() = 'coach');

-- Pelatih boleh mengisi rapor siswa (template & folder tetap diatur admin).
drop policy if exists coach_write on public.rapor_entries;
create policy coach_write on public.rapor_entries for all to authenticated
  using (public.current_staff_role() = 'coach')
  with check (public.current_staff_role() = 'coach');

-- Setiap staf boleh membaca profilnya sendiri (untuk mengetahui perannya).
drop policy if exists own_profile_read on public.profiles;
create policy own_profile_read on public.profiles for select to authenticated
  using (id = auth.uid());

-- Data non-sensitif untuk halaman pendaftaran publik & header.
drop policy if exists public_read on public.classes;
create policy public_read on public.classes for select to anon, authenticated using (true);
drop policy if exists public_read on public.club_profile;
create policy public_read on public.club_profile for select to anon, authenticated using (true);

-- ─── RPC: pendaftaran publik (tanpa login) ───────────────────────────────────

create or replace function public.public_register(p jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_nama   text := btrim(coalesce(p->>'nama', ''));
  v_kelas  public.classes;
  v_hp     text := coalesce(nullif(btrim(p->>'no_hp'), ''), '');
  v_ortu   jsonb := coalesce(p->'orang_tua', '{}'::jsonb);
  v_lahir  date;
  v_id     text;
begin
  if char_length(v_nama) < 2 or char_length(v_nama) > 100 then
    raise exception 'Nama siswa tidak valid' using errcode = 'P0001';
  end if;

  select * into v_kelas from public.classes where id = p->>'kelas_id';
  if not found then
    raise exception 'Kelas tidak ditemukan' using errcode = 'P0001';
  end if;

  if coalesce(p->>'jenis_kelamin', '') not in ('Laki-laki', 'Perempuan') then
    raise exception 'Jenis kelamin tidak valid' using errcode = 'P0001';
  end if;

  if char_length(public.norm_hp(v_hp)) < 9
     and char_length(public.norm_hp(v_ortu->>'noHpAyah')) < 9
     and char_length(public.norm_hp(v_ortu->>'noHpIbu')) < 9 then
    raise exception 'Nomor HP wajib diisi (siswa atau orang tua)' using errcode = 'P0001';
  end if;

  begin
    v_lahir := (p->>'tanggal_lahir')::date;
  exception when others then
    raise exception 'Tanggal lahir tidak valid' using errcode = 'P0001';
  end;
  if v_lahir is null or v_lahir < date '1950-01-01' or v_lahir > current_date then
    raise exception 'Tanggal lahir tidak valid' using errcode = 'P0001';
  end if;

  -- Pembatasan sederhana anti-spam.
  if exists (
    select 1 from public.students
    where status = 'Calon' and lower(nama) = lower(v_nama)
      and public.norm_hp(no_hp) = public.norm_hp(v_hp)
      and created_at > now() - interval '1 day'
  ) then
    raise exception 'Pendaftaran yang sama sudah diterima. Mohon tunggu konfirmasi pengurus.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.students
      where status = 'Calon' and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'Terlalu banyak pendaftaran. Coba lagi beberapa saat lagi.' using errcode = 'P0001';
  end if;

  v_id := 'std-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

  insert into public.students (
    id, nama, kelas_id, jenis_kelamin, tempat_lahir, tanggal_lahir, no_hp, email, alamat,
    orang_tua, status, catatan, tanggal_bergabung,
    biaya_pendaftaran, iuran_bulanan, total_biaya_pendaftaran
  ) values (
    v_id, v_nama, v_kelas.id, p->>'jenis_kelamin',
    left(coalesce(p->>'tempat_lahir', ''), 100), to_char(v_lahir, 'YYYY-MM-DD'),
    left(v_hp, 20), left(nullif(btrim(p->>'email'), ''), 150),
    left(coalesce(p->>'alamat', ''), 300),
    jsonb_build_object(
      'namaAyah', left(coalesce(v_ortu->>'namaAyah', ''), 100),
      'noHpAyah', left(coalesce(v_ortu->>'noHpAyah', ''), 20),
      'namaIbu',  left(coalesce(v_ortu->>'namaIbu', ''), 100),
      'noHpIbu',  left(coalesce(v_ortu->>'noHpIbu', ''), 20)
    ),
    'Calon', left(nullif(btrim(p->>'catatan'), ''), 500),
    to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD'),
    -- Biaya selalu dari data kelas, bukan dari input pendaftar.
    v_kelas.biaya_pendaftaran, v_kelas.iuran_bulanan,
    v_kelas.biaya_pendaftaran + v_kelas.iuran_bulanan
  );

  return jsonb_build_object('id', v_id, 'nama', v_nama);
end $$;

-- ─── RPC: portal siswa / wali (No. HP + Kode Akses) ──────────────────────────

-- Mengembalikan id siswa jika kombinasi benar, null jika salah.
create or replace function public.portal_resolve(p_hp text, p_kode text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_hp text := public.norm_hp(p_hp);
  v_id text;
begin
  if v_hp = '' or btrim(coalesce(p_kode, '')) = '' then
    return null;
  end if;

  if (select count(*) from public.portal_login_failures
      where hp = v_hp and at > now() - interval '15 minutes') >= 8 then
    raise exception 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' using errcode = 'P0001';
  end if;

  select id into v_id from public.students
  where upper(kode_akses) = upper(btrim(p_kode))
    and v_hp in (
      public.norm_hp(no_hp),
      public.norm_hp(orang_tua->>'noHpAyah'),
      public.norm_hp(orang_tua->>'noHpIbu')
    )
  limit 1;

  if v_id is null then
    delete from public.portal_login_failures where at < now() - interval '1 day';
    insert into public.portal_login_failures (hp) values (v_hp);
  end if;
  return v_id;
end $$;

create or replace function public.portal_data(p_hp text, p_kode text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id text := public.portal_resolve(p_hp, p_kode);
  v_student public.students;
begin
  if v_id is null then
    return null;
  end if;
  select * into v_student from public.students where id = v_id;

  return jsonb_build_object(
    'student', to_jsonb(v_student),
    'classes', coalesce((select jsonb_agg(to_jsonb(c)) from public.classes c where c.id = v_student.kelas_id), '[]'::jsonb),
    'monthly_dues', coalesce((select jsonb_agg(to_jsonb(d)) from public.monthly_dues d where d.siswa_id = v_id), '[]'::jsonb),
    -- Sesi absensi hanya memuat status kehadiran siswa ini (bukan siswa lain).
    'attendance_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'tanggal', a.tanggal, 'kelas_id', a.kelas_id, 'catatan', a.catatan,
        'pelatih_id', a.pelatih_id, 'pelatih', a.pelatih,
        'kehadiran', jsonb_build_object(v_id, a.kehadiran -> v_id)
      ) order by a.tanggal desc)
      from public.attendance_sessions a where a.kehadiran ? v_id
    ), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(to_jsonb(t) order by t.tanggal desc) from public.transactions t where t.siswa_id = v_id), '[]'::jsonb),
    -- bukti_gambar_url berisi path di bucket privat; portal tidak bisa membukanya.
    'payment_submissions', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.tanggal_kirim desc)
      from public.payment_submissions s where s.siswa_id = v_id
    ), '[]'::jsonb),
    -- Rapor hanya dari folder yang sudah diterbitkan admin.
    'rapor_entries', coalesce((
      select jsonb_agg(to_jsonb(e))
      from public.rapor_entries e
      join public.rapor_folders f on f.id = e.folder_id and f.diterbitkan
      where e.siswa_id = v_id
    ), '[]'::jsonb),
    'rapor_folders', coalesce((
      select jsonb_agg(to_jsonb(f) order by f.akhir_penilaian desc)
      from public.rapor_folders f
      where f.diterbitkan and exists (
        select 1 from public.rapor_entries e where e.folder_id = f.id and e.siswa_id = v_id
      )
    ), '[]'::jsonb),
    'rapor_templates', coalesce((
      select jsonb_agg(to_jsonb(t))
      from public.rapor_templates t
      where exists (
        select 1 from public.rapor_folders f
        join public.rapor_entries e on e.folder_id = f.id and e.siswa_id = v_id
        where f.diterbitkan and f.template_id = t.id
      )
    ), '[]'::jsonb),
    'club_profile', (select to_jsonb(cp) from public.club_profile cp where cp.id = 1)
  );
end $$;

create or replace function public.portal_submit_payment(p_hp text, p_kode text, p jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id      text := public.portal_resolve(p_hp, p_kode);
  v_student public.students;
  v_class   public.classes;
  v_bulan   int;
  v_tahun   int;
  v_nominal bigint;
  v_path    text := coalesce(p->>'bukti_path', '');
  v_new     public.payment_submissions;
begin
  if v_id is null then
    raise exception 'Nomor HP atau kode akses salah' using errcode = 'P0001';
  end if;
  select * into v_student from public.students where id = v_id;
  select * into v_class from public.classes where id = v_student.kelas_id;
  if v_student.status = 'Calon' then
    raise exception 'Siswa belum aktif. Iuran bulanan mulai ditagih setelah pendaftaran dikonfirmasi pengurus.' using errcode = 'P0001';
  end if;

  v_bulan := (p->>'bulan')::int;
  v_tahun := (p->>'tahun')::int;
  v_nominal := (p->>'nominal')::bigint;
  if coalesce(v_bulan, 0) not between 1 and 12 or coalesce(v_tahun, 0) not between 2000 and 2100 then
    raise exception 'Periode iuran tidak valid' using errcode = 'P0001';
  end if;
  if coalesce(v_nominal, 0) <= 0 or v_nominal > 100000000 then
    raise exception 'Nominal tidak valid' using errcode = 'P0001';
  end if;
  if coalesce(p->>'metode_pembayaran', '') not in ('Transfer BCA', 'QRIS', 'Tunai', 'EDC BCA', 'Kartu Kredit', 'Transfer Mandiri', 'Transfer BRI') then
    raise exception 'Metode pembayaran tidak valid' using errcode = 'P0001';
  end if;
  if v_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$' then
    raise exception 'Bukti transfer tidak valid' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.payment_submissions
    where siswa_id = v_id and bulan = v_bulan and tahun = v_tahun and status = 'pending'
  ) then
    raise exception 'Bukti untuk periode ini sudah dikirim dan masih menunggu verifikasi admin.' using errcode = 'P0001';
  end if;
  -- Cicilan (sudah dibayar sebagian) boleh dilunasi sisanya; yang ditolak hanya bulan yang
  -- sudah lunas atau dikunci tidak ditagih (cuti / nonaktif).
  if exists (
    select 1 from public.monthly_dues
    where siswa_id = v_id and bulan = v_bulan and tahun = v_tahun
      and (status in ('lunas', 'cuti', 'nonaktif', 'belum_bergabung') or (nominal > 0 and terbayar >= nominal))
  ) then
    raise exception 'Iuran periode ini sudah lunas atau tidak ditagih.' using errcode = 'P0001';
  end if;

  insert into public.payment_submissions (
    id, siswa_id, siswa_nama, kelas_id, kelas_nama, tipe, bulan, tahun, nominal,
    metode_pembayaran, tanggal_transfer, bukti_gambar_url, pesan_siswa, status, tanggal_kirim
  ) values (
    'sub-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
    v_id, v_student.nama, v_student.kelas_id, coalesce(v_class.nama, ''), 'Iuran Rutin',
    v_bulan, v_tahun, v_nominal, p->>'metode_pembayaran',
    left(coalesce(p->>'tanggal_transfer', to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD')), 10),
    v_path, left(nullif(btrim(p->>'pesan_siswa'), ''), 500), 'pending',
    to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI')
  ) returning * into v_new;

  return to_jsonb(v_new);
end $$;

revoke all on function public.public_register(jsonb) from public;
revoke all on function public.portal_resolve(text, text) from public, anon, authenticated;
revoke all on function public.portal_data(text, text) from public;
revoke all on function public.portal_submit_payment(text, text, jsonb) from public;
grant execute on function public.public_register(jsonb) to anon, authenticated;
grant execute on function public.portal_data(text, text) to anon, authenticated;
grant execute on function public.portal_submit_payment(text, text, jsonb) to anon, authenticated;

-- ─── Storage ─────────────────────────────────────────────────────────────────
-- avatars        : publik (foto siswa/pelatih & logo klub), hanya admin yang menulis.
-- payment-proofs : privat; siapa pun boleh mengunggah (siswa tanpa akun) dengan
--                  nama file UUID, hanya admin yang boleh melihat/menghapus.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_admin_write on storage.objects;
create policy avatars_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and public.is_admin())
  with check (bucket_id = 'avatars' and public.is_admin());

drop policy if exists proofs_upload on storage.objects;
create policy proofs_upload on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'payment-proofs'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
  );

drop policy if exists proofs_admin_read on storage.objects;
create policy proofs_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

drop policy if exists proofs_admin_delete on storage.objects;
create policy proofs_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());
