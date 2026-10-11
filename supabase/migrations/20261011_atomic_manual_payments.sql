begin;

do $$
begin
  if to_regprocedure('public.admin_review_payment(text,text,text,text)') is null
     or to_regclass('public.security_audit_log') is null then
    raise exception 'Pembaruan keamanan belum lengkap. Terapkan seluruh supabase/schema.sql terbaru.';
  end if;
end $$;

-- Internal idempotency ledger; browser roles must never read or write these payloads.
create table if not exists public.admin_payment_requests (
  id uuid primary key,
  actor_id uuid not null,
  payload jsonb not null,
  transaction_id text not null,
  created_at timestamptz not null default now()
);
alter table public.admin_payment_requests enable row level security;
revoke all on public.admin_payment_requests from public, anon, authenticated;

create or replace function public.admin_record_payment(p_request_id uuid, p jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_request public.admin_payment_requests;
  v_student public.students;
  v_class public.classes;
  v_part public.event_participants;
  v_due public.monthly_dues;
  v_tx public.transactions;
  v_result jsonb;
  v_sub_id text;
  v_type text := p->>'tipe';
  v_sub_type text;
  v_date date;
  v_month int;
  v_year int;
  v_amount bigint;
  v_initial bigint;
  v_path text := coalesce(p->>'bukti_path', '');
  v_today text := to_char(now() at time zone 'Asia/Jakarta', 'YYYY-MM-DD');
begin
  if not public.is_admin() then return jsonb_build_object('error', 'Akses admin diperlukan.'); end if;
  if p_request_id is null or p is null or jsonb_typeof(p) <> 'object' or octet_length(p::text) > 10000
     or coalesce(p->>'siswa_id','') = '' or char_length(p->>'siswa_id') > 128
     or v_type is null or v_type not in ('Iuran Rutin','Angsuran','Iuran Insidentil','Pendaftaran Siswa Baru')
     or coalesce(p->>'nominal','') !~ '^[1-9][0-9]{0,11}$'
     or coalesce(p->>'tanggal','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
     or coalesce(p->>'metode_pembayaran','') not in ('Transfer BCA','QRIS','Tunai','EDC BCA','Kartu Kredit','Transfer Mandiri','Transfer BRI')
     or char_length(coalesce(p->>'catatan','')) > 2000
     or char_length(coalesce(p->>'pesan','')) > 500
     or char_length(coalesce(p->>'terbilang','')) > 500
     or char_length(coalesce(p->>'keterangan','')) > 1000 then
    return jsonb_build_object('error', 'Data pembayaran tidak valid.');
  end if;
  v_amount := (p->>'nominal')::bigint;
  begin
    v_date := (p->>'tanggal')::date;
    if to_char(v_date,'YYYY-MM-DD') <> p->>'tanggal' or v_date < date '1950-01-01' or v_date > date '2100-12-31' then
      return jsonb_build_object('error', 'Tanggal pembayaran tidak valid.');
    end if;
  exception when datetime_field_overflow or invalid_datetime_format then
    return jsonb_build_object('error', 'Tanggal pembayaran tidak valid.');
  end;

  -- Serialize retries before touching balances, even if the first response was lost.
  perform pg_advisory_xact_lock(hashtextextended('sportkit:manual:' || p_request_id::text, 0));
  select * into v_request from public.admin_payment_requests where id=p_request_id;
  if found then
    if v_request.actor_id <> auth.uid() or v_request.payload <> p then
      return jsonb_build_object('error', 'Permintaan ini sudah digunakan untuk pembayaran berbeda.');
    end if;
    select * into v_tx from public.transactions where id=v_request.transaction_id;
    if not found then return jsonb_build_object('error', 'Arsip transaksi tidak ditemukan. Hubungi pengurus.'); end if;
    return jsonb_build_object('transaction',to_jsonb(v_tx));
  end if;

  select * into v_student from public.students where id=p->>'siswa_id' for update;
  if not found then return jsonb_build_object('error', 'Siswa tidak ditemukan. Muat ulang data.'); end if;
  select * into v_class from public.classes where id=v_student.kelas_id;

  if v_type in ('Iuran Rutin','Angsuran') then
    if coalesce(p->>'bulan','') !~ '^(0?[1-9]|1[0-2])$' or coalesce(p->>'tahun','') !~ '^[0-9]{4}$' then
      return jsonb_build_object('error', 'Periode iuran tidak valid.');
    end if;
    v_month := (p->>'bulan')::int;
    v_year := (p->>'tahun')::int;
    if v_year not between 1950 and 2100 then return jsonb_build_object('error', 'Periode iuran tidak valid.'); end if;
    if (select count(*) from public.monthly_dues where siswa_id=v_student.id and bulan=v_month and tahun=v_year) > 1 then
      return jsonb_build_object('error', 'Tagihan periode ini memiliki duplikat. Hubungi pengurus.');
    end if;
    select * into v_due from public.monthly_dues
      where siswa_id=v_student.id and bulan=v_month and tahun=v_year limit 1 for update;
    if v_student.status='Calon' or (v_due.id is null and (
      (left(v_student.tanggal_bergabung,7) ~ '^[0-9]{4}-[0-9]{2}$'
        and to_char(make_date(v_year,v_month,1),'YYYY-MM') < left(v_student.tanggal_bergabung,7))
      or (v_student.status in ('Cuti','Nonaktif') and to_char(make_date(v_year,v_month,1),'YYYY-MM') >=
        coalesce(nullif(left(v_student.tanggal_status,7),''),left(v_today,7)))
    )) then return jsonb_build_object('error', 'Bulan ini tidak ditagih. Pilih periode lain.'); end if;
    v_sub_type := 'Iuran Rutin';
  elsif v_type='Iuran Insidentil' then
    select * into v_part from public.event_participants where id=p->>'participant_id' and siswa_id=v_student.id for update;
    if not found or not exists(select 1 from public.events where id=v_part.event_id) then
      return jsonb_build_object('error', 'Peserta event tidak ditemukan.');
    end if;
    if (select count(*) from public.event_participants where event_id=v_part.event_id and siswa_id=v_student.id) <> 1 then
      return jsonb_build_object('error', 'Peserta event memiliki duplikat. Hubungi pengurus.');
    end if;
    v_sub_type := 'Iuran Insidentil';
  else
    if v_student.status <> 'Calon' then return jsonb_build_object('error', 'Pendaftaran siswa ini sudah diproses.'); end if;
    v_sub_type := 'Pendaftaran';
  end if;

  if v_path <> '' and (v_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    or not exists(select 1 from storage.objects where bucket_id='payment-proofs' and name=v_path)) then
    return jsonb_build_object('error', 'Bukti pembayaran tidak ditemukan. Unggah ulang gambar.');
  end if;

  v_sub_id := 'manual-' || p_request_id::text;
  insert into public.payment_submissions(id,siswa_id,siswa_nama,kelas_id,kelas_nama,tipe,bulan,tahun,event_id,event_nama,
    nominal,metode_pembayaran,tanggal_transfer,bukti_gambar_url,pesan_siswa,status,tanggal_kirim)
  values(v_sub_id,v_student.id,v_student.nama,v_student.kelas_id,coalesce(v_class.nama,''),v_sub_type,v_month,v_year,
    v_part.event_id,(select nama from public.events where id=v_part.event_id),v_amount,p->>'metode_pembayaran',
    to_char(v_date,'YYYY-MM-DD'),v_path,coalesce(p->>'pesan',''),'pending',to_char(now() at time zone 'Asia/Jakarta','YYYY-MM-DD HH24:MI'));

  -- Reuse the same receipt allocator and balance locks as portal verification.
  v_result := public.admin_review_payment(v_sub_id,'verified',coalesce(p->>'catatan',''),coalesce(p->>'terbilang',''));
  if v_result ? 'error' then raise exception using message=v_result->>'error', errcode='P0001'; end if;
  update public.transactions set tanggal=to_char(v_date,'YYYY-MM-DD'),tipe=v_type,
    keterangan=coalesce(nullif(p->>'keterangan',''), keterangan)
    where id=v_result->'transaction'->>'id' returning * into v_tx;

  if v_type='Pendaftaran Siswa Baru' then
    update public.students set tanggal_bergabung=to_char(v_date,'YYYY-MM-DD'),tanggal_status=to_char(v_date,'YYYY-MM-DD') where id=v_student.id;
    v_initial := least(greatest(0,v_amount-coalesce(v_class.biaya_pendaftaran,v_student.biaya_pendaftaran,0)),
      coalesce(v_class.iuran_bulanan,v_student.iuran_bulanan,0));
    if v_initial > 0 then
      v_month := extract(month from v_date)::int;
      v_year := extract(year from v_date)::int;
      if (select count(*) from public.monthly_dues where siswa_id=v_student.id and bulan=v_month and tahun=v_year) > 1 then
        raise exception 'Tagihan iuran perdana memiliki duplikat. Hubungi pengurus.';
      end if;
      select * into v_due from public.monthly_dues where siswa_id=v_student.id and bulan=v_month and tahun=v_year limit 1 for update;
      if v_due.id is null then
        insert into public.monthly_dues(id,siswa_id,tahun,bulan,status,nominal,terbayar,tanggal_bayar,kuitansi_id)
        values('due-'||v_student.id||'-'||v_year||'-'||v_month,v_student.id,v_year,v_month,
          case when v_initial >= coalesce(v_class.iuran_bulanan,v_student.iuran_bulanan) then 'lunas' else 'belum_lunas' end,
          coalesce(v_class.iuran_bulanan,v_student.iuran_bulanan),v_initial,to_char(v_date,'YYYY-MM-DD'),v_tx.nomor_kuitansi);
      else
        update public.monthly_dues set terbayar=terbayar+v_initial,
          status=case when terbayar+v_initial>=nominal then 'lunas' else 'belum_lunas' end,
          tanggal_bayar=to_char(v_date,'YYYY-MM-DD'),kuitansi_id=v_tx.nomor_kuitansi where id=v_due.id;
      end if;
    end if;
  end if;
  insert into public.admin_payment_requests(id,actor_id,payload,transaction_id) values(p_request_id,auth.uid(),p,v_tx.id);
  return jsonb_build_object('transaction',to_jsonb(v_tx));
exception when sqlstate 'P0001' then
  -- This block rolls back ALL writes, including the staged proof, before returning an error.
  return jsonb_build_object('error',sqlerrm);
end $$;
revoke all on function public.admin_record_payment(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.admin_record_payment(uuid,jsonb) to authenticated;

notify pgrst, 'reload schema';
commit;
