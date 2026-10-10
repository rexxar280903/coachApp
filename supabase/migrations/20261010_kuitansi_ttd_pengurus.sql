-- 1. Kolom pengurus penanda tangan pada Profil Klub (Pengaturan → Profil Klub)
alter table public.club_profile add column if not exists pengurus_nama text;
alter table public.club_profile add column if not exists pengurus_jabatan text;
alter table public.club_profile add column if not exists pengurus_ttd text; -- path gambar TTD di bucket avatars

-- 2. Kolom snapshot pengurus pada transaksi (kuitansi terkunci permanen sejak diterbitkan)
alter table public.transactions add column if not exists pengurus_nama text;
alter table public.transactions add column if not exists pengurus_jabatan text;
alter table public.transactions add column if not exists pengurus_ttd text;

-- 3. Kunci kuitansi yang sudah ada sebelumnya dengan data pengurus dari profil saat ini
-- agar kuitansi lama tidak ikut berubah jika profil diedit lagi di masa depan.
update public.transactions t
set
  pengurus_nama = coalesce(t.pengurus_nama, cp.pengurus_nama),
  pengurus_jabatan = coalesce(t.pengurus_jabatan, cp.pengurus_jabatan),
  pengurus_ttd = coalesce(t.pengurus_ttd, cp.pengurus_ttd)
from public.club_profile cp
where cp.id = 1 and t.pengurus_nama is null;

-- 4. Perbarui fungsi verifikasi bukti transfer agar menyimpan snapshot pengurus ke transaksi
create or replace function public.admin_review_payment(
  p_id text,
  p_action text,
  p_note text,
  p_terbilang text default ''
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_sub record;
  v_student record;
  v_due record;
  v_part record;
  v_tx record;
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

notify pgrst, 'reload schema';
