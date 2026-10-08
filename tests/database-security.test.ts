import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const db = new PGlite({ extensions: { pgcrypto } });
const admin = '00000000-0000-0000-0000-000000000001';
const coach = '00000000-0000-0000-0000-000000000002';
const outsider = '00000000-0000-0000-0000-000000000003';
const hp = '081234567890';
const code = 'ABCDEFGH2345';

before(async () => {
  // Minimal Supabase Auth/Storage contracts; all application SQL and RLS are real PostgreSQL.
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select jsonb_build_object('aal', current_setting('request.jwt.claim.aal', true))
    $$;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, unique(bucket_id, name));
    alter table storage.objects enable row level security;
    grant usage on schema public, auth, storage to anon, authenticated;
    grant select, insert, update, delete on storage.objects to anon, authenticated;
    -- Emulate Supabase's older broad grants so migration revocations are tested too.
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant all on sequences to anon, authenticated;
  `);
  const schema = await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
  await db.exec(schema);
  await db.exec(schema); // Existing installations must be safely upgradeable.
  await db.query('insert into auth.users values ($1), ($2), ($3)', [admin, coach, outsider]);
  await db.query("insert into public.profiles(id, nama, role) values ($1, 'Admin', 'admin'), ($2, 'Coach', 'coach')", [admin, coach]);
  await db.exec("insert into public.classes(id,nama,iuran_bulanan) values ('class-1','Renang',100000)");
  await db.query(`insert into public.students(id,nama,kelas_id,jenis_kelamin,no_hp,status,kode_akses,foto,catatan)
    values ('student-1','Siswa Satu','class-1','Perempuan',$1,'Aktif',$2,
      'https://example.supabase.co/storage/v1/object/public/avatars/people/photo.jpg','catatan internal'),
      ('student-2','Siswa Dua','class-1','Laki-laki','089999999999','Aktif','JKLMNPQR2345',null,null)`, [hp, code]);
  await db.exec(`insert into public.monthly_dues(id,siswa_id,tahun,bulan,status,nominal) values
    ('due-1','student-1',2026,10,'belum_bayar',100000), ('due-2','student-2',2026,10,'belum_bayar',100000);
    insert into public.attendance_sessions(id,tanggal,kelas_id,catatan,kehadiran)
      values ('attendance-1','2026-10-01','class-1','private notes','{"student-1":true,"student-2":false}');
    insert into storage.objects(bucket_id,name) values ('avatars','people/private.jpg'),('avatars','club/logo.jpg');
    update public.club_profile set logo_url='https://example.supabase.co/storage/v1/object/public/avatars/club/logo.jpg' where id=1;
  `);
});
after(async () => { await db.close(); });

async function asRole<T>(role: 'anon' | 'authenticated', id: string | null, operation: () => Promise<T>, aal = 'aal1'): Promise<T> {
  await db.query("select set_config('request.jwt.claim.sub', $1, false), set_config('request.jwt.claim.aal', $2, false)", [id ?? '', aal]);
  await db.exec(`set role ${role}`);
  try { return await operation(); }
  finally { await db.exec('reset role'); }
}
async function portal(phone = hp, accessCode = code): Promise<any> {
  return (await db.query<{ result: any }>('select public.portal_data($1,$2) as result', [phone, accessCode])).rows[0].result;
}
async function reserve(phone = hp, accessCode = code): Promise<any> {
  return (await db.query<{ result: any }>("select public.portal_create_upload($1,$2,'jpg') as result", [phone, accessCode])).rows[0].result;
}
async function submit(phone: string, accessCode: string, path: string): Promise<any> {
  return (await db.query<{ result: any }>('select public.portal_submit_payment($1,$2,$3::jsonb) as result', [phone, accessCode,
    JSON.stringify({ bulan: 10, tahun: 2026, nominal: 100000, metode_pembayaran: 'Transfer BCA', tanggal_transfer: '2026-10-01', bukti_path: path })])).rows[0].result;
}

test('anonymous visitors and unassigned accounts cannot read students, credentials or finances', async () => {
  await asRole('anon', null, async () => {
    await assert.rejects(db.query('select * from public.students'), /permission denied/);
    await assert.rejects(db.query('select * from public.portal_upload_tickets'), /permission denied/);
    await assert.rejects(db.query("select public.take_rate_limit('attacker', 9999, 1)"), /permission denied/);
    await assert.rejects(db.query('select * from public.coach_students()'), /permission denied/);
    assert.ok((await db.query('select * from public.classes')).rows.length);
  });
  await asRole('authenticated', outsider, async () => {
    assert.equal((await db.query('select * from public.students')).rows.length, 0);
    assert.equal((await db.query('select * from public.coach_students()')).rows.length, 0);
    assert.equal((await db.query('select * from public.monthly_dues')).rows.length, 0);
  });
});

test('coach API only returns basic student information and cannot escalate roles or modify finances', async () => {
  await asRole('authenticated', coach, async () => {
    assert.equal((await db.query('select * from public.students')).rows.length, 0);
    const students = (await db.query('select * from public.coach_students()')).rows;
    assert.equal(students.length, 2);
    for (const field of ['kode_akses', 'orang_tua', 'no_hp', 'alamat', 'catatan']) assert.ok(!(field in students[0]));
    await assert.rejects(db.query("insert into public.profiles(id,role) values ($1,'admin')", [outsider]), /row-level security/);
    assert.equal((await db.query("update public.profiles set role='admin' where id=$1 returning id", [coach])).rows.length, 0);
    await assert.rejects(db.exec('truncate public.students'), /permission denied/);
  });
});

test('password-only staff sessions can access data only according to their assigned role', async () => {
  await asRole('authenticated', admin, async () => {
    assert.equal((await db.query('select public.current_staff_role() as role')).rows[0].role, 'admin');
    assert.equal((await db.query('select * from public.students')).rows.length, 2);
    assert.equal((await db.query('select * from public.profiles where id=$1', [admin])).rows.length, 1);
  });
  await asRole('authenticated', coach, async () => {
    assert.equal((await db.query('select public.current_staff_role() as role')).rows[0].role, 'coach');
    assert.equal((await db.query('select * from public.students')).rows.length, 0);
    assert.equal((await db.query('select * from public.coach_students()')).rows.length, 2);
  });
  await asRole('authenticated', outsider, async () => {
    assert.equal((await db.query('select public.current_staff_role() as role')).rows[0].role, null);
    await assert.rejects(db.query("insert into public.classes(id,nama) values ('blocked','Blocked')"), /row-level security/);
  }, 'aal2');
});

test('disabling MFA does not let a coach read finances or call admin-only operations', async () => {
  await asRole('authenticated', coach, async () => {
    assert.equal((await db.query('select * from public.monthly_dues')).rows.length, 0);
    assert.equal((await db.query('select * from public.transactions')).rows.length, 0);
    await assert.rejects(db.query("insert into public.classes(id,nama) values ('coach-escalation','Blocked')"), /row-level security/);
    assert.ok((await db.query<{ result: any }>("select public.admin_review_payment('unknown','verified','note','') as result")).rows[0].result.error);
  });
});

test('portal responses isolate the student and omit access codes, private photo paths and internal notes', async () => {
  const data = await asRole('anon', null, () => portal());
  assert.equal(data.student.id, 'student-1');
  for (const field of ['kode_akses', 'foto', 'catatan']) assert.ok(!(field in data.student));
  assert.equal(data.monthly_dues.length, 1);
  assert.deepEqual(data.attendance_sessions[0].kehadiran, { 'student-1': true });
  assert.ok(!('catatan' in data.attendance_sessions[0]));
});

test('bad login attempts persist across all portal RPCs and lock a phone after eight failures', async () => {
  for (let n = 0; n < 8; n++) {
    await asRole('anon', null, async () => {
      if (n % 3 === 0) assert.equal(await portal(hp, 'WRONG123'), null);
      else if (n % 3 === 1) assert.ok((await reserve(hp, 'WRONG123')).error);
      else assert.ok((await submit(hp, 'WRONG123', '00000000-0000-0000-0000-000000000000.jpg')).error);
    });
  }
  assert.equal((await db.query('select count(*)::int as n from public.portal_login_failures where hp=$1', [hp])).rows[0].n, 8);
  assert.equal(await asRole('anon', null, () => portal()), null);
  await db.exec('delete from public.portal_login_failures');
});

test('private storage rejects anonymous arbitrary uploads and hides student photos while serving the logo', async () => {
  await asRole('anon', null, async () => {
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('payment-proofs','00000000-0000-0000-0000-000000000000.jpg')"), /row-level security/);
    assert.deepEqual((await db.query("select name from storage.objects where bucket_id='avatars'")).rows, [{ name: 'club/logo.jpg' }]);
  });
  assert.equal((await db.query("select public from storage.buckets where id='avatars'")).rows[0].public, false);
});

test('upload capabilities expire, belong to one student, cannot be reused or overwrite existing objects', async () => {
  const ticket = await asRole('anon', null, () => reserve());
  assert.ok(ticket.path);
  await asRole('anon', null, async () => {
    await db.query("insert into storage.objects(bucket_id,name) values ('payment-proofs',$1)", [ticket.path]);
    assert.equal((await db.query("update storage.objects set name='overwritten.jpg' where name=$1 returning id", [ticket.path])).rows.length, 0);
    assert.ok((await submit('089999999999', 'JKLMNPQR2345', ticket.path)).error);
    assert.ok((await submit(hp, code, '00000000-0000-0000-0000-000000000000.jpg')).error);
    const result = await submit(hp, code, ticket.path);
    assert.equal(result.siswa_id, 'student-1');
    assert.ok((await submit(hp, code, ticket.path)).error);
    assert.equal((await db.query('select public.portal_upload_allowed($1) as allowed', [ticket.path])).rows[0].allowed, false);
  });
  const expired = await asRole('anon', null, () => reserve());
  await db.query("update public.portal_upload_tickets set expires_at=now()-interval '1 minute' where path=$1", [expired.path]);
  await asRole('anon', null, async () => {
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('payment-proofs',$1)", [expired.path]), /row-level security/);
  });
});

test('rotating the portal code revokes unconsumed upload capabilities', async () => {
  const ticket = await asRole('anon', null, () => reserve('089999999999', 'JKLMNPQR2345'));
  await db.query("update public.students set kode_akses='JKLMNPQR6789' where id='student-2'");
  await asRole('anon', null, async () => {
    assert.equal((await db.query('select public.portal_upload_allowed($1) as allowed', [ticket.path])).rows[0].allowed, false);
  });
});

test('malformed payment fields cannot roll back request quotas through SQL cast errors', async () => {
  await db.exec("delete from public.security_rate_limits where key='payment:student:student-1'");
  await asRole('anon', null, async () => {
    for (const input of [{ bulan: 'abc' }, { nominal: -1 }, { tanggal_transfer: 'garbage' }, { tahun: '999999999999999999999' }]) {
      const payload = { bulan: 10, tahun: 2026, nominal: 100000, metode_pembayaran: 'Transfer BCA',
        tanggal_transfer: '2026-10-01', bukti_path: '00000000-0000-0000-0000-000000000000.jpg', ...input };
      const result = await db.query<{ result: any }>('select public.portal_submit_payment($1,$2,$3::jsonb) as result', [hp, code, JSON.stringify(payload)]);
      assert.ok(result.rows[0].result.error);
    }
  });
  assert.equal((await db.query("select hits from public.security_rate_limits where key='payment:student:student-1'")).rows[0].hits, 4);
});

test('registration quotas handle parent-only phone numbers and ignore attacker supplied financial fields', async () => {
  const payload = { nama: 'Pendaftar Uji', kelas_id: 'class-1', jenis_kelamin: 'Perempuan', tanggal_lahir: '2015-01-01',
    no_hp: '', orang_tua: { noHpIbu: '+6281111111111' }, status: 'Aktif', iuran_bulanan: 0, kode_akses: 'ATTACKER' };
  const register = async (p: object) => (await db.query<{ result: any }>('select public.public_register($1::jsonb) as result', [JSON.stringify(p)])).rows[0].result;
  const first = await asRole('anon', null, () => register(payload));
  assert.ok(first.id);
  const saved = (await db.query('select status,iuran_bulanan,kode_akses from public.students where id=$1', [first.id])).rows[0];
  assert.equal(saved.status, 'Calon'); assert.equal(saved.iuran_bulanan, 100000); assert.equal(String(saved.kode_akses).length, 12);
  assert.ok((await asRole('anon', null, () => register(payload))).error);
  await asRole('anon', null, () => register({ ...payload, nama: 'Kedua' }));
  assert.ok((await asRole('anon', null, () => register({ ...payload, nama: 'Keempat' }))).error);
});

test('direct portal API calls cannot bypass non-billable periods hidden by the UI', async () => {
  await db.exec("delete from public.security_rate_limits where key='payment:student:student-1'; update public.students set tanggal_bergabung='2026-10-01' where id='student-1'");
  const request = async (bulan: number) => (await db.query<{ result: any }>('select public.portal_submit_payment($1,$2,$3::jsonb) as result', [hp,code,
    JSON.stringify({ bulan,tahun:2026,nominal:100000,metode_pembayaran:'Transfer BCA',tanggal_transfer:'2026-10-01',bukti_path:'00000000-0000-0000-0000-000000000000.jpg' })])).rows[0].result;
  assert.match((await asRole('anon', null, () => request(9))).error, /sebelum siswa bergabung/);
  await db.exec("update public.students set status='Cuti',tanggal_status='2026-10-01' where id='student-1'");
  assert.match((await asRole('anon', null, () => request(11))).error, /cuti atau nonaktif/);
  await db.exec("update public.students set status='Aktif',tanggal_status=null where id='student-1'");
});

async function review(id: string, action = 'verified'): Promise<any> {
  return (await db.query<{ result: any }>('select public.admin_review_payment($1,$2,$3,$4) as result', [id, action, 'Catatan admin', 'Seratus Ribu Rupiah'])).rows[0].result;
}

test('payment verification requires an assigned admin and rolls back every write if balance updates fail', async () => {
  const id = String((await db.query("select id from public.payment_submissions where siswa_id='student-1' and status='pending'")).rows[0].id);
  await asRole('anon', null, async () => { await assert.rejects(review(id), /permission denied/); });
  assert.ok((await asRole('authenticated', coach, () => review(id))).error);
  assert.ok((await asRole('authenticated', outsider, () => review(id))).error);
  await db.exec(`create function public.test_fail_due() returns trigger language plpgsql as $$ begin raise exception 'simulated failure'; end $$;
    create trigger test_fail_due before update on public.monthly_dues for each row execute function public.test_fail_due();`);
  await asRole('authenticated', admin, async () => { await assert.rejects(review(id), /simulated failure/); });
  assert.equal((await db.query('select count(*)::int as n from public.transactions')).rows[0].n, 0);
  assert.equal((await db.query('select status from public.payment_submissions where id=$1', [id])).rows[0].status, 'pending');
  assert.equal((await db.query("select terbayar from public.monthly_dues where id='due-1'")).rows[0].terbayar, 0);
  await db.exec('drop trigger test_fail_due on public.monthly_dues; drop function public.test_fail_due()');
});

test('payment review cannot credit or reject the same proof twice and uses server receipt numbers', async () => {
  const id = String((await db.query("select id from public.payment_submissions where siswa_id='student-1' and status='pending'")).rows[0].id);
  const first = await asRole('authenticated', admin, () => review(id));
  assert.match(first.transaction.nomor_kuitansi, /^INVSP-\d{6}-\d{3,}$/);
  assert.equal(first.transaction.nominal, 100000);
  assert.ok((await asRole('authenticated', admin, () => review(id))).error);
  assert.ok((await asRole('authenticated', admin, () => review(id, 'rejected'))).error);
  const due = (await db.query("select status,terbayar from public.monthly_dues where id='due-1'")).rows[0];
  assert.equal(due.terbayar, 100000); assert.equal(due.status, 'lunas');
  assert.equal((await db.query('select count(*)::int as n from public.transactions')).rows[0].n, 1);
});

test('atomic review preserves installment payments for events and activates approved enrollment', async () => {
  await db.exec(`insert into public.events(id,nama,nominal) values ('event-1','Kejuaraan',100000);
    insert into public.event_participants(id,event_id,siswa_id,status,nominal) values ('part-1','event-1','student-2','belum_bayar',100000);
    insert into public.payment_submissions(id,siswa_id,siswa_nama,tipe,event_id,event_nama,nominal,metode_pembayaran,tanggal_transfer,tanggal_kirim)
      values ('event-sub-1','student-2','Siswa Dua','Iuran Insidentil','event-1','Kejuaraan',40000,'Transfer BCA','2026-10-01','2026-10-01'),
        ('event-sub-2','student-2','Siswa Dua','Iuran Insidentil','event-1','Kejuaraan',60000,'Transfer BCA','2026-10-01','2026-10-01');
    insert into public.students(id,nama,kelas_id,jenis_kelamin,status) values ('candidate','Calon Uji','class-1','Perempuan','Calon');
    insert into public.payment_submissions(id,siswa_id,siswa_nama,tipe,nominal,metode_pembayaran,tanggal_transfer,tanggal_kirim)
      values ('enrollment-sub','candidate','Calon Uji','Pendaftaran',100000,'Transfer BCA','2026-10-01','2026-10-01');`);
  assert.ok((await asRole('authenticated', admin, () => review('event-sub-1'))).transaction);
  assert.equal((await db.query("select status from public.event_participants where id='part-1'")).rows[0].status, 'belum_lunas');
  assert.ok((await asRole('authenticated', admin, () => review('event-sub-2'))).transaction);
  assert.equal((await db.query("select peserta_lunas from public.events where id='event-1'")).rows[0].peserta_lunas, 1);
  assert.ok((await asRole('authenticated', admin, () => review('enrollment-sub'))).transaction);
  assert.equal((await db.query("select status from public.students where id='candidate'")).rows[0].status, 'Aktif');
});

test('security audit is readable by admins but cannot be forged or erased through browser roles', async () => {
  await asRole('authenticated', admin, async () => {
    const logs = (await db.query('select * from public.security_audit_log')).rows;
    assert.ok(logs.some((log) => log.table_name === 'payment_submissions' && log.action === 'INSERT'));
    assert.ok(logs.every((log) => !('kode_akses' in log) && !('old_data' in log)));
    await assert.rejects(db.exec('delete from public.security_audit_log'), /permission denied/);
  });
  await asRole('authenticated', coach, async () => {
    assert.equal((await db.query('select * from public.security_audit_log')).rows.length, 0);
    await assert.rejects(db.exec("insert into public.security_audit_log(table_name,record_id,action) values ('students','fake','DELETE')"), /permission denied/);
  });
});

test('the targeted migration disables previously enforced MFA and preserves data access restrictions', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20261008_disable_staff_mfa.sql', import.meta.url), 'utf8');
  await db.exec(`create or replace function public.current_staff_role()
    returns text language sql stable security definer set search_path = '' as $$
      select role from public.profiles where id = auth.uid() and auth.jwt()->>'aal'='aal2'
    $$;`);
  await asRole('authenticated', admin, async () => {
    assert.equal((await db.query('select public.current_staff_role() as role')).rows[0].role, null);
    assert.equal((await db.query('select * from public.students')).rows.length, 0);
  });
  await db.exec(migration);
  await db.exec(migration);
  await asRole('authenticated', admin, async () => {
    assert.equal((await db.query('select public.current_staff_role() as role')).rows[0].role, 'admin');
    assert.ok((await db.query('select * from public.students')).rows.length > 0);
  });
  await asRole('authenticated', coach, async () => {
    assert.equal((await db.query('select * from public.students')).rows.length, 0);
    assert.equal((await db.query('select * from public.monthly_dues')).rows.length, 0);
    assert.ok((await db.query('select * from public.coach_students()')).rows.length > 0);
  });
  await asRole('anon', null, async () => {
    await assert.rejects(db.query('select * from public.students'), /permission denied/);
    await assert.rejects(db.query("insert into storage.objects(bucket_id,name) values ('payment-proofs','00000000-0000-0000-0000-000000000001.jpg')"), /row-level security/);
  });
});
