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

begin;

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
returns text language sql stable security definer set search_path = '' as $$
  -- MFA is temporarily disabled; staff access still requires a valid Auth session and assigned role.
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_staff_role() = 'admin', false)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_staff_role() in ('admin', 'coach'), false)
$$;

-- ─── Util ────────────────────────────────────────────────────────────────────

-- Kode baru 12 karakter (60 bit). Kode lama 8 karakter tetap dapat dipakai sampai dirotasi admin.
create or replace function public.gen_kode_akses()
returns text language plpgsql volatile security definer set search_path = '' as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 karakter
  r text := '';
  i int;
begin
  for i in 1..12 loop
    r := r || substr(chars, (get_byte(extensions.gen_random_bytes(1), 0) % 32) + 1, 1);
  end loop;
  return r;
end $$;

-- Normalisasi nomor HP: 62812… / +62 812… / 812… → 0812…
create or replace function public.norm_hp(p text)
returns text language sql immutable set search_path = '' as $$
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
-- Pengurus penanda tangan kuitansi (pengurus_ttd = path gambar di bucket avatars).
alter table public.club_profile add column if not exists pengurus_nama text;
alter table public.club_profile add column if not exists pengurus_jabatan text;
alter table public.club_profile add column if not exists pengurus_ttd text;
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
  pengurus_nama     text,
  pengurus_jabatan  text,
  pengurus_ttd      text,
  created_at timestamptz not null default now()
);
create index if not exists transactions_siswa_idx on public.transactions (siswa_id);
-- Pengaman agar dua kuitansi tidak pernah memiliki nomor yang sama.
create unique index if not exists transactions_nomor_kuitansi_key on public.transactions (nomor_kuitansi);
alter table public.transactions add column if not exists pengurus_nama text;
alter table public.transactions add column if not exists pengurus_jabatan text;
alter table public.transactions add column if not exists pengurus_ttd text;

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

-- Kolom tanda tangan (RaporTtd[]); null = bawaan aplikasi.
alter table public.rapor_templates add column if not exists ttd jsonb;

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

-- Internal counters and one-use upload capabilities. No direct API/table access.
create table if not exists public.security_rate_limits (
  key text primary key,
  hits int not null,
  expires_at timestamptz not null
);
create table if not exists public.portal_upload_tickets (
  path text primary key,
  siswa_id text not null,
  kode_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);
create index if not exists portal_upload_tickets_siswa_idx on public.portal_upload_tickets (siswa_id);

create or replace function public.take_rate_limit(p_key text, p_limit int, p_seconds int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_hits int;
begin
  delete from public.security_rate_limits where expires_at < now() - interval '1 day';
  insert into public.security_rate_limits as r (key, hits, expires_at)
  values (p_key, 1, now() + make_interval(secs => p_seconds))
  on conflict (key) do update set
    hits = case when r.expires_at <= now() then 1 else least(r.hits + 1, p_limit + 1) end,
    expires_at = case when r.expires_at <= now() then excluded.expires_at else r.expires_at end
  returning hits into v_hits;
  return v_hits <= p_limit;
end $$;

-- ─── Row Level Security ──────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'club_profile', 'classes', 'coaches', 'students', 'monthly_dues',
    'events', 'event_participants', 'attendance_sessions', 'transactions',
    'payment_submissions', 'portal_login_failures', 'security_rate_limits', 'portal_upload_tickets',
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
    'classes', 'coaches', 'attendance_sessions',
    'rapor_templates', 'rapor_folders', 'rapor_entries'
  ] loop
    execute format('drop policy if exists coach_read on public.%I', t);
    execute format(
      'create policy coach_read on public.%I for select to authenticated
         using (public.current_staff_role() = ''coach'')', t);
  end loop;
end $$;

-- RLS applies to entire rows: coaches must not read the students table containing portal credentials.
drop policy if exists coach_read on public.students;
create or replace function public.coach_students()
returns table (
  id text, nama text, kelas_id text, jenis_kelamin text, status text,
  tanggal_bergabung text, foto text, created_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select s.id, s.nama, s.kelas_id, s.jenis_kelamin, s.status, s.tanggal_bergabung, s.foto, s.created_at
  from public.students s where public.current_staff_role() = 'coach'
$$;

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
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_nama   text := btrim(coalesce(p->>'nama', ''));
  v_kelas  public.classes;
  v_hp     text := coalesce(nullif(btrim(p->>'no_hp'), ''), '');
  v_ortu   jsonb := coalesce(p->'orang_tua', '{}'::jsonb);
  v_lahir  date;
  v_id     text;
  v_contact text;
begin
  if p is null or jsonb_typeof(p) <> 'object' or octet_length(p::text) > 16384
     or jsonb_typeof(v_ortu) <> 'object' then
    return jsonb_build_object('error', 'Data pendaftaran tidak valid.');
  end if;
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

  if public.norm_hp(v_hp) !~ '^0[0-9]{8,14}$'
     and public.norm_hp(v_ortu->>'noHpAyah') !~ '^0[0-9]{8,14}$'
     and public.norm_hp(v_ortu->>'noHpIbu') !~ '^0[0-9]{8,14}$' then
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

  if char_length(v_hp) > 24 or char_length(coalesce(v_ortu->>'noHpAyah', '')) > 24
     or char_length(coalesce(v_ortu->>'noHpIbu', '')) > 24 then
    return jsonb_build_object('error', 'Nomor HP tidak valid.');
  end if;
  v_contact := case when public.norm_hp(v_hp) ~ '^0[0-9]{8,14}$' then public.norm_hp(v_hp)
    when public.norm_hp(v_ortu->>'noHpAyah') ~ '^0[0-9]{8,14}$' then public.norm_hp(v_ortu->>'noHpAyah')
    else public.norm_hp(v_ortu->>'noHpIbu') end;

  -- Serialize the quota check; concurrent requests cannot all pass the same count.
  perform pg_advisory_xact_lock(hashtextextended('sportkit:registration', 0));
  if not public.take_rate_limit('register:global', 60, 3600)
     or not public.take_rate_limit('register:phone:' || encode(extensions.digest(v_contact, 'sha256'), 'hex'), 3, 86400) then
    return jsonb_build_object('error', 'Terlalu banyak pendaftaran. Coba lagi nanti.');
  end if;
  if exists (
    select 1 from public.students
    where lower(nama) = lower(v_nama)
      and v_contact in (public.norm_hp(no_hp), public.norm_hp(orang_tua->>'noHpAyah'), public.norm_hp(orang_tua->>'noHpIbu'))
      and created_at > now() - interval '1 day'
  ) then
    return jsonb_build_object('error', 'Pendaftaran yang sama sudah diterima. Mohon tunggu konfirmasi pengurus.');
  end if;
  if (select count(*) from public.students
      where status = 'Calon' and created_at > now() - interval '1 hour') >= 60 then
    return jsonb_build_object('error', 'Terlalu banyak pendaftaran. Coba lagi beberapa saat lagi.');
  end if;

  v_id := 'std-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12);

  insert into public.students (
    id, nama, kelas_id, jenis_kelamin, tempat_lahir, tanggal_lahir, no_hp, email, alamat,
    orang_tua, status, catatan, tanggal_bergabung,
    biaya_pendaftaran, iuran_bulanan, total_biaya_pendaftaran
  ) values (
    v_id, v_nama, v_kelas.id, p->>'jenis_kelamin',
    left(coalesce(p->>'tempat_lahir', ''), 100), to_char(v_lahir, 'YYYY-MM-DD'),
    public.norm_hp(v_hp), left(nullif(btrim(p->>'email'), ''), 150),
    left(coalesce(p->>'alamat', ''), 300),
    jsonb_build_object(
      'namaAyah', left(coalesce(v_ortu->>'namaAyah', ''), 100),
      'noHpAyah', public.norm_hp(v_ortu->>'noHpAyah'),
      'namaIbu',  left(coalesce(v_ortu->>'namaIbu', ''), 100),
      'noHpIbu',  public.norm_hp(v_ortu->>'noHpIbu')
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
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_hp text;
  v_id text;
begin
  if char_length(coalesce(p_hp, '')) > 24 or char_length(coalesce(p_kode, '')) > 32
     then
    return null;
  end if;
  v_hp := public.norm_hp(p_hp);
  if v_hp !~ '^0[0-9]{8,14}$' then return null; end if;

  if not public.take_rate_limit('portal:global', 600, 60) then return null; end if;
  perform pg_advisory_xact_lock(hashtextextended('sportkit:portal:' || v_hp, 0));

  if (select count(*) from public.portal_login_failures
      where hp = v_hp and at > now() - interval '15 minutes') >= 8 then
    return null;
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
  else
    delete from public.portal_login_failures where hp = v_hp;
  end if;
  return v_id;
end $$;

create or replace function public.portal_data(p_hp text, p_kode text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id text := public.portal_resolve(p_hp, p_kode);
  v_student public.students;
begin
  if v_id is null then
    return null;
  end if;
  select * into v_student from public.students where id = v_id;

  return jsonb_build_object(
    'student', to_jsonb(v_student) - array['kode_akses', 'catatan', 'foto'],
    'classes', coalesce((select jsonb_agg(to_jsonb(c)) from public.classes c where c.id = v_student.kelas_id), '[]'::jsonb),
    'monthly_dues', coalesce((select jsonb_agg(to_jsonb(d)) from public.monthly_dues d where d.siswa_id = v_id), '[]'::jsonb),
    -- Sesi absensi hanya memuat status kehadiran siswa ini (bukan siswa lain).
    'attendance_sessions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'tanggal', a.tanggal, 'kelas_id', a.kelas_id,
        'pelatih_id', a.pelatih_id, 'pelatih', a.pelatih,
        'kehadiran', jsonb_build_object(v_id, a.kehadiran -> v_id)
      ) order by a.tanggal desc)
      from public.attendance_sessions a where a.kehadiran ? v_id
    ), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(to_jsonb(t) - 'catatan' order by t.tanggal desc) from public.transactions t where t.siswa_id = v_id), '[]'::jsonb),
    -- bukti_gambar_url berisi path di bucket privat; portal tidak bisa membukanya.
    'payment_submissions', coalesce((
      select jsonb_agg(to_jsonb(s) - array['bukti_gambar_url', 'diverifikasi_oleh'] order by s.tanggal_kirim desc)
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

-- An unguessable path is a short-lived, one-use upload capability issued only after portal login.
create or replace function public.portal_upload_allowed(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.portal_upload_tickets t join public.students s on s.id = t.siswa_id
    where t.path = p_path and t.used_at is null and t.expires_at > now()
      and t.kode_hash = encode(extensions.digest(s.kode_akses, 'sha256'), 'hex')
  )
$$;

create or replace function public.portal_create_upload(p_hp text, p_kode text, p_ext text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id text := public.portal_resolve(p_hp, p_kode);
  v_path text;
begin
  -- Do not raise on bad credentials: exceptions roll back the failed-login counter.
  if v_id is null then return jsonb_build_object('error', 'Nomor HP atau kode akses salah, atau percobaan dibatasi.'); end if;
  if p_ext is null or p_ext not in ('jpg', 'png', 'webp') then
    return jsonb_build_object('error', 'Format bukti tidak valid.');
  end if;
  if not public.take_rate_limit('upload:global', 100, 600)
     or not public.take_rate_limit('upload:student:' || v_id, 3, 600) then
    return jsonb_build_object('error', 'Terlalu banyak unggahan. Coba lagi dalam 10 menit.');
  end if;
  if not exists (select 1 from public.students where id = v_id and status <> 'Calon') then
    return jsonb_build_object('error', 'Pendaftaran belum dikonfirmasi pengurus.');
  end if;
  delete from public.portal_upload_tickets where expires_at < now() - interval '1 day';
  v_path := gen_random_uuid()::text || '.' || p_ext;
  insert into public.portal_upload_tickets(path, siswa_id, kode_hash, expires_at)
  select v_path, id, encode(extensions.digest(kode_akses, 'sha256'), 'hex'), now() + interval '10 minutes'
  from public.students where id = v_id;
  return jsonb_build_object('path', v_path);
end $$;

create or replace function public.portal_submit_payment(p_hp text, p_kode text, p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id      text := public.portal_resolve(p_hp, p_kode);
  v_student public.students;
  v_class   public.classes;
  v_bulan   int;
  v_tahun   int;
  v_nominal bigint;
  v_path    text := coalesce(p->>'bukti_path', '');
  v_new     public.payment_submissions;
  v_date    date;
  v_period  text;
  v_since   text;
begin
  if v_id is null then
    return jsonb_build_object('error', 'Nomor HP atau kode akses salah, atau percobaan dibatasi.');
  end if;
  if p is null or jsonb_typeof(p) <> 'object' or octet_length(p::text) > 8192 then
    return jsonb_build_object('error', 'Data pembayaran tidak valid.');
  end if;
  if not public.take_rate_limit('payment:student:' || v_id, 10, 600) then
    return jsonb_build_object('error', 'Terlalu banyak permintaan pembayaran. Coba lagi nanti.');
  end if;
  -- Serialize submissions for this student, including the duplicate pending-period check.
  select * into v_student from public.students where id = v_id for update;
  select * into v_class from public.classes where id = v_student.kelas_id;
  if v_student.status = 'Calon' then
    return jsonb_build_object('error', 'Siswa belum aktif. Pendaftaran harus dikonfirmasi pengurus.');
  end if;

  begin
    v_bulan := (p->>'bulan')::int;
    v_tahun := (p->>'tahun')::int;
    v_nominal := (p->>'nominal')::bigint;
    v_date := (p->>'tanggal_transfer')::date;
  exception when invalid_text_representation or numeric_value_out_of_range or datetime_field_overflow or invalid_datetime_format then
    return jsonb_build_object('error', 'Periode, nominal, atau tanggal tidak valid.');
  end;
  if v_date is null or coalesce(p->>'tanggal_transfer', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
     or v_date < date '2000-01-01' or v_date > (now() at time zone 'Asia/Jakarta')::date then
    return jsonb_build_object('error', 'Tanggal transfer tidak valid.');
  end if;
  if coalesce(v_bulan, 0) not between 1 and 12 or coalesce(v_tahun, 0) not between 2000 and 2100 then
    return jsonb_build_object('error', 'Periode iuran tidak valid.');
  end if;
  if coalesce(v_nominal, 0) <= 0 or v_nominal > 100000000 then
    return jsonb_build_object('error', 'Nominal tidak valid.');
  end if;
  if coalesce(p->>'metode_pembayaran', '') not in ('Transfer BCA', 'QRIS', 'Tunai', 'EDC BCA', 'Kartu Kredit', 'Transfer Mandiri', 'Transfer BRI') then
    return jsonb_build_object('error', 'Metode pembayaran tidak valid.');
  end if;
  -- Enforce non-billable periods even when the due row has not been created yet.
  if not exists (select 1 from public.monthly_dues where siswa_id=v_id and bulan=v_bulan and tahun=v_tahun) then
    v_period := v_tahun::text || '-' || lpad(v_bulan::text, 2, '0');
    if v_student.tanggal_bergabung ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
       and v_period < left(v_student.tanggal_bergabung, 7) then
      return jsonb_build_object('error', 'Periode sebelum siswa bergabung tidak ditagih.');
    end if;
    if v_student.status in ('Cuti', 'Nonaktif') then
      v_since := case when v_student.tanggal_status ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
        then left(v_student.tanggal_status, 7) else to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM') end;
      if v_period >= v_since then return jsonb_build_object('error', 'Periode cuti atau nonaktif tidak ditagih.'); end if;
    end if;
  end if;
  if v_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$' then
    return jsonb_build_object('error', 'Bukti transfer tidak valid.');
  end if;
  if not exists (
    select 1 from public.portal_upload_tickets t
    where t.path = v_path and t.siswa_id = v_id and public.portal_upload_allowed(t.path)
  ) or not exists (
    select 1 from storage.objects where bucket_id = 'payment-proofs' and name = v_path
  ) then
    return jsonb_build_object('error', 'Bukti transfer belum diunggah, kedaluwarsa, atau bukan milik siswa ini.');
  end if;
  if exists (
    select 1 from public.payment_submissions
    where siswa_id = v_id and bulan = v_bulan and tahun = v_tahun and status = 'pending'
  ) then
    return jsonb_build_object('error', 'Bukti untuk periode ini sudah dikirim dan masih menunggu verifikasi admin.');
  end if;
  -- Cicilan (sudah dibayar sebagian) boleh dilunasi sisanya; yang ditolak hanya bulan yang
  -- sudah lunas atau dikunci tidak ditagih (cuti / nonaktif).
  if exists (
    select 1 from public.monthly_dues
    where siswa_id = v_id and bulan = v_bulan and tahun = v_tahun
      and (status in ('lunas', 'cuti', 'nonaktif', 'belum_bergabung') or (nominal > 0 and terbayar >= nominal))
  ) then
    return jsonb_build_object('error', 'Iuran periode ini sudah lunas atau tidak ditagih.');
  end if;

  insert into public.payment_submissions (
    id, siswa_id, siswa_nama, kelas_id, kelas_nama, tipe, bulan, tahun, nominal,
    metode_pembayaran, tanggal_transfer, bukti_gambar_url, pesan_siswa, status, tanggal_kirim
  ) values (
    'sub-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
    v_id, v_student.nama, v_student.kelas_id, coalesce(v_class.nama, ''), 'Iuran Rutin',
    v_bulan, v_tahun, v_nominal, p->>'metode_pembayaran',
    to_char(v_date, 'YYYY-MM-DD'),
    v_path, left(nullif(btrim(p->>'pesan_siswa'), ''), 500), 'pending',
    to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD HH24:MI')
  ) returning * into v_new;

  update public.portal_upload_tickets set used_at = now() where path = v_path;

  return to_jsonb(v_new);
end $$;

-- Review is one transaction: receipt, balance, enrollment and proof status succeed or fail together.
create or replace function public.admin_review_payment(p_id text, p_action text, p_note text, p_terbilang text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_sub public.payment_submissions;
  v_student public.students;
  v_due public.monthly_dues;
  v_part public.event_participants;
  v_tx public.transactions;
  v_today text := to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD');
  v_prefix text := 'INVSP-' || to_char(now() at time zone 'Asia/Jakarta', 'YYMMDD') || '-';
  v_receipt text;
  v_seq int;
  v_nominal bigint;
  v_paid bigint;
  v_label text;
  v_actor text;
begin
  if not public.is_admin() then return jsonb_build_object('error', 'Akses admin diperlukan.'); end if;
  if p_id is null or char_length(p_id) > 128 or p_action is null or p_action not in ('verified', 'rejected')
     or char_length(coalesce(p_note, '')) > 2000 or char_length(coalesce(p_terbilang, '')) > 500 then
    return jsonb_build_object('error', 'Data verifikasi tidak valid.');
  end if;
  select * into v_sub from public.payment_submissions where id = p_id for update;
  if not found or v_sub.status <> 'pending' then
    return jsonb_build_object('error', 'Bukti sudah diproses atau tidak ditemukan. Muat ulang data.');
  end if;
  select nama into v_actor from public.profiles where id = auth.uid();
  if p_action = 'rejected' then
    if btrim(coalesce(p_note, '')) = '' then return jsonb_build_object('error', 'Alasan penolakan wajib diisi.'); end if;
    update public.payment_submissions set status = 'rejected', catatan_admin = p_note,
      tanggal_verifikasi = v_today, diverifikasi_oleh = v_actor where id = p_id;
    return jsonb_build_object('ok', true);
  end if;
  select * into v_student from public.students where id = v_sub.siswa_id for update;
  if not found or v_sub.nominal <= 0 then return jsonb_build_object('error', 'Data siswa atau nominal tidak valid.'); end if;

  if v_sub.tipe = 'Iuran Rutin' then
    if v_sub.bulan is null or v_sub.bulan not between 1 and 12 or v_sub.tahun is null then
      return jsonb_build_object('error', 'Periode iuran tidak valid.');
    end if;
    select * into v_due from public.monthly_dues
      where siswa_id = v_sub.siswa_id and bulan = v_sub.bulan and tahun = v_sub.tahun limit 1 for update;
    if found and (v_due.status in ('lunas', 'cuti', 'nonaktif', 'belum_bergabung')
      or (v_due.nominal > 0 and v_due.terbayar >= v_due.nominal)) then
      return jsonb_build_object('error', 'Tagihan sudah lunas atau tidak ditagih. Tolak bukti jika pembayaran ganda.');
    end if;
    select coalesce(nullif(v_due.nominal, 0), nullif(c.iuran_bulanan, 0), nullif(v_student.iuran_bulanan, 0), v_sub.nominal)
      into v_nominal from public.classes c where c.id = v_student.kelas_id;
    v_nominal := coalesce(v_nominal, nullif(v_due.nominal, 0), nullif(v_student.iuran_bulanan, 0), v_sub.nominal);
    v_paid := coalesce(v_due.terbayar, 0) + v_sub.nominal;
    v_label := 'Iuran Rutin ' || (array['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'])[v_sub.bulan] || ' ' || v_sub.tahun;
  elsif v_sub.tipe = 'Iuran Insidentil' then
    select * into v_part from public.event_participants where event_id = v_sub.event_id and siswa_id = v_sub.siswa_id limit 1 for update;
    if not found or v_part.status = 'lunas' then return jsonb_build_object('error', 'Peserta tidak ditemukan atau tagihan sudah lunas.'); end if;
    v_label := 'Iuran Insidentil ' || coalesce(v_sub.event_nama, '');
  elsif v_sub.tipe = 'Pendaftaran' then
    v_label := 'Pendaftaran Siswa Baru';
  else
    return jsonb_build_object('error', 'Tipe pembayaran tidak valid.');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('sportkit:receipt:' || v_prefix, 0));
  select coalesce(max(substring(nomor_kuitansi from char_length(v_prefix) + 1)::int), 0) + 1 into v_seq
  from public.transactions where nomor_kuitansi ~ ('^' || v_prefix || '[0-9]+$');
  v_receipt := v_prefix || case when v_seq < 1000 then lpad(v_seq::text, 3, '0') else v_seq::text end;
  insert into public.transactions(id,nomor_kuitansi,siswa_id,siswa_nama,kelas_nama,tanggal,nominal,terbilang,
    metode_pembayaran,tipe,keterangan,catatan,pengurus_nama,pengurus_jabatan,pengurus_ttd)
  values ('tx-' || gen_random_uuid()::text,v_receipt,v_sub.siswa_id,v_sub.siswa_nama,v_sub.kelas_nama,
    v_today,v_sub.nominal,coalesce(p_terbilang,''),v_sub.metode_pembayaran,
    case when v_sub.tipe='Pendaftaran' then 'Pendaftaran Siswa Baru' else v_sub.tipe end,
    v_label || ' (Verifikasi Bukti Transfer Siswa)',p_note,
    (select pengurus_nama from public.club_profile where id = 1),
    (select pengurus_jabatan from public.club_profile where id = 1),
    (select pengurus_ttd from public.club_profile where id = 1)) returning * into v_tx;

  if v_sub.tipe = 'Iuran Rutin' then
    if v_due.id is null then
      insert into public.monthly_dues(id,siswa_id,tahun,bulan,status,nominal,terbayar,tanggal_bayar,kuitansi_id)
      values ('due-' || v_sub.siswa_id || '-' || v_sub.tahun || '-' || v_sub.bulan,v_sub.siswa_id,v_sub.tahun,v_sub.bulan,
        case when v_paid>=v_nominal then 'lunas' else 'belum_lunas' end,v_nominal,v_paid,v_sub.tanggal_transfer,v_receipt);
    else
      update public.monthly_dues set nominal=v_nominal,terbayar=v_paid,
        status=case when v_paid>=v_nominal then 'lunas' else 'belum_lunas' end,
        tanggal_bayar=v_sub.tanggal_transfer,kuitansi_id=v_receipt where id=v_due.id;
    end if;
  elsif v_sub.tipe = 'Iuran Insidentil' then
    update public.event_participants set terbayar=terbayar+v_sub.nominal,
      status=case when terbayar+v_sub.nominal>=nominal then 'lunas' else 'belum_lunas' end,
      tanggal_bayar=v_sub.tanggal_transfer,kuitansi_id=v_receipt where id=v_part.id;
    update public.events set
      total_peserta=(select count(*) from public.event_participants where event_id=v_sub.event_id),
      peserta_lunas=(select count(*) from public.event_participants where event_id=v_sub.event_id and status='lunas')
      where id=v_sub.event_id;
  elsif v_sub.tipe = 'Pendaftaran' and v_student.status = 'Calon' then
    update public.students set status='Aktif',tanggal_bergabung=v_today,tanggal_status=v_today where id=v_student.id;
  end if;
  update public.payment_submissions set status='verified',tanggal_verifikasi=v_today,diverifikasi_oleh=v_actor,
    catatan_admin=p_note,kuitansi_id=v_receipt,transaction_id=v_tx.id where id=p_id;
  return jsonb_build_object('transaction',to_jsonb(v_tx));
end $$;
revoke all on function public.admin_review_payment(text,text,text,text) from public, anon, authenticated;
grant execute on function public.admin_review_payment(text,text,text,text) to authenticated;

revoke all on function public.public_register(jsonb) from public, anon, authenticated;
revoke all on function public.portal_resolve(text, text) from public, anon, authenticated;
revoke all on function public.portal_data(text, text) from public, anon, authenticated;
revoke all on function public.portal_submit_payment(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.take_rate_limit(text, int, int) from public, anon, authenticated;
revoke all on function public.portal_create_upload(text, text, text) from public, anon, authenticated;
revoke all on function public.portal_upload_allowed(text) from public, anon, authenticated;
revoke all on function public.coach_students() from public, anon, authenticated;
revoke all on function public.gen_kode_akses() from public, anon, authenticated;
revoke all on function public.current_staff_role(), public.is_admin(), public.is_staff(), public.norm_hp(text) from public, anon, authenticated;
grant execute on function public.current_staff_role(), public.is_admin(), public.is_staff() to anon, authenticated;
grant execute on function public.coach_students(), public.gen_kode_akses() to authenticated;
grant execute on function public.portal_create_upload(text, text, text), public.portal_upload_allowed(text) to anon, authenticated;
grant execute on function public.public_register(jsonb) to anon, authenticated;
grant execute on function public.portal_data(text, text) to anon, authenticated;
grant execute on function public.portal_submit_payment(text, text, jsonb) to anon, authenticated;

-- ─── Storage ─────────────────────────────────────────────────────────────────
-- avatars: private. Staff can read photos; public readers can only read the configured club logo.
-- payment-proofs: private. Portal upload requires a short-lived capability bound to a student.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.is_club_logo(p_path text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_path like 'club/%' and exists (
    select 1 from public.club_profile where id = 1
      and split_part(logo_url, '/storage/v1/object/public/avatars/', 2) = p_path
  )
$$;
revoke all on function public.is_club_logo(text) from public, anon, authenticated;
grant execute on function public.is_club_logo(text) to anon, authenticated;

drop policy if exists avatars_staff_read on storage.objects;
create policy avatars_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and public.is_staff());
drop policy if exists avatars_club_read on storage.objects;
create policy avatars_club_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'avatars' and public.is_club_logo(name));

drop policy if exists avatars_admin_write on storage.objects;
create policy avatars_admin_write on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and public.is_admin())
  with check (bucket_id = 'avatars' and public.is_admin());

drop policy if exists proofs_upload on storage.objects;
create policy proofs_upload on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'payment-proofs'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and (public.is_admin() or public.portal_upload_allowed(name))
  );

drop policy if exists proofs_admin_read on storage.objects;
create policy proofs_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

drop policy if exists proofs_admin_delete on storage.objects;
create policy proofs_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- Explicit API privileges: table TRUNCATE and REFERENCES are not governed by RLS.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'club_profile', 'classes', 'coaches', 'students', 'monthly_dues', 'events',
    'event_participants', 'attendance_sessions', 'transactions', 'payment_submissions',
    'rapor_templates', 'rapor_folders', 'rapor_entries', 'portal_login_failures',
    'security_rate_limits', 'portal_upload_tickets'
  ] loop
    execute format('revoke all on table public.%I from public, anon, authenticated', t);
    if t not in ('portal_login_failures', 'security_rate_limits', 'portal_upload_tickets') then
      execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    end if;
  end loop;
end $$;
grant select on public.classes, public.club_profile to anon;
revoke all on sequence public.portal_login_failures_id_seq from public, anon, authenticated;
revoke create on schema public from public, anon, authenticated;

-- Append-only audit through the browser API. Do not store passwords, codes or row contents.
create table if not exists public.security_audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  table_name text not null,
  record_id text,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE'))
);
create index if not exists security_audit_log_time_idx on public.security_audit_log(occurred_at desc);
alter table public.security_audit_log enable row level security;
revoke all on public.security_audit_log from public, anon, authenticated;
revoke all on sequence public.security_audit_log_id_seq from public, anon, authenticated;
grant select on public.security_audit_log to authenticated;
drop policy if exists audit_admin_read on public.security_audit_log;
create policy audit_admin_read on public.security_audit_log for select to authenticated using (public.is_admin());

create or replace function public.record_security_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.security_audit_log(actor_id, table_name, record_id, action)
  values (auth.uid(), tg_table_name, case when tg_op = 'DELETE' then old.id::text else new.id::text end, tg_op);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.record_security_change() from public, anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'students', 'coaches', 'classes', 'club_profile', 'monthly_dues',
    'events', 'event_participants', 'transactions', 'payment_submissions',
    'attendance_sessions', 'rapor_templates', 'rapor_folders', 'rapor_entries'
  ] loop
    execute format('drop trigger if exists security_change on public.%I', t);
    execute format('create trigger security_change after insert or update or delete on public.%I
      for each row execute function public.record_security_change()', t);
  end loop;
end $$;

commit;
