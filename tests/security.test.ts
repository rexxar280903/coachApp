import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateSupabaseConfig, escapeCsvCell, passwordValidationError, PORTAL_SESSION_TTL_MS } from '../src/utils/security';
import { dataUrlToBlob } from '../src/utils/image';
import { generateKodeAkses } from '../src/utils/kodeAkses';
import { clearPortalSession, loadPortalSession, savePortalSession } from '../src/services/portalSession';

test('browser configuration rejects privileged keys and insecure production endpoints', () => {
  const jwt = (role: string) => `e30.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`;
  assert.equal(validateSupabaseConfig('https://example.supabase.co', jwt('anon'), true), true);
  assert.equal(validateSupabaseConfig('https://example.supabase.co', 'sb_publishable_test', true), true);
  for (const key of [jwt('service_role'), 'sb_secret_private', 'invalid']) {
    assert.throws(() => validateSupabaseConfig('https://example.supabase.co', key, true));
    assert.throws(() => validateSupabaseConfig('', key, true));
  }
  for (const url of ['http://example.supabase.co', 'http://localhost:54321', 'https://user:pass@example.supabase.co', 'https://example.supabase.co/path']) {
    assert.throws(() => validateSupabaseConfig(url, jwt('anon'), true));
  }
  assert.equal(validateSupabaseConfig('http://localhost:54321', jwt('anon')), true);
  assert.equal(validateSupabaseConfig('', ''), false);
  assert.throws(() => validateSupabaseConfig('', '', true), /wajib diisi/);
});

test('CSV export neutralizes formulas, including whitespace and control character prefixes', () => {
  for (const value of ['=HYPERLINK("evil")', '+cmd', '-cmd', '@SUM(1)', '  =1', '\t=1', '\r=1', '\u0000=1']) {
    assert.ok(escapeCsvCell(value).startsWith('"\''));
  }
  assert.equal(escapeCsvCell('Nama "Siswa"'), '"Nama ""Siswa"""');
  assert.equal(escapeCsvCell(12), '"12"');
});

test('image payloads reject spoofed MIME types, executable formats, oversized and broken base64', () => {
  assert.throws(() => dataUrlToBlob('data:image/svg+xml;base64,PHN2Zz4='));
  assert.throws(() => dataUrlToBlob('data:image/jpeg;base64,PHNjcmlwdD4='));
  assert.throws(() => dataUrlToBlob('data:image/png;base64,%%%'));
  assert.throws(() => dataUrlToBlob(`data:image/jpeg;base64,${Buffer.from([255, 216, 255, 0]).toString('base64')}`, 2));
  const jpeg = dataUrlToBlob(`data:image/jpeg;base64,${Buffer.from([255, 216, 255, 0]).toString('base64')}`);
  assert.equal(jpeg.type, 'image/jpeg');
});

test('new portal credentials have 60 bits of randomness and reset passwords have a minimum length', () => {
  const codes = new Set(Array.from({ length: 100 }, generateKodeAkses));
  assert.equal(codes.size, 100);
  for (const code of codes) assert.match(code, /^[A-HJ-NP-Z2-9]{12}$/);
  assert.ok(passwordValidationError('short'));
  assert.equal(passwordValidationError('a long unique passphrase'), null);
  assert.ok(passwordValidationError('a'.repeat(129)));
});

test('portal sessions expire, validate stored values, and normalize credentials', () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  const session = savePortalSession({ hp: '+62 812 3456 7890', kode: ' abcdefgh2345 ' });
  assert.equal(loadPortalSession()?.hp, '081234567890');
  assert.ok(session.expiresAt <= Date.now() + PORTAL_SESSION_TTL_MS);
  for (const stored of ['{', JSON.stringify({ hp: '081234567890', kode: 'ABCDEFGH' }),
    JSON.stringify({ ...session, expiresAt: Date.now() - 1 }), JSON.stringify({ ...session, hp: {} })]) {
    values.set('sportkit_portal_session', stored);
    assert.equal(loadPortalSession(), null);
  }
  clearPortalSession();
  assert.equal(values.size, 0);
});
