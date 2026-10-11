import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { createReceiptImagesHandler, resolveReceiptImages, receiptImageDependencies, type ReceiptImageDependencies } from '../server/portalReceiptImages';
import { portalReceiptImages } from '../src/services/portalReceiptImages';
import type { PaymentTransaction } from '../src/types/sportkit';

const url = 'https://example.supabase.co';
const oldPath = 'club/10000000-0000-0000-0000-000000000001.png';
const reference = `${url}/storage/v1/object/public/avatars/${oldPath}`;
const credentials = { hp: '081234567890', kode: 'ABCDEFGH2345' };
const request = { ...credentials, transactionIds: ['old-receipt', 'empty-receipt'] };
function dependencies(overrides: Partial<ReceiptImageDependencies> = {}): ReceiptImageDependencies {
  return {
    supabaseUrl: url,
    async portalData(hp, kode) {
      return hp === credentials.hp && kode === credentials.kode ? { transactions: [
        { id: 'old-receipt', pengurus_ttd: reference }, { id: 'empty-receipt', pengurus_ttd: '' },
      ] } : null;
    },
    async sign(paths) { assert.deepEqual(paths, [oldPath]); return new Map([[oldPath, `${url}/storage/v1/object/sign/avatars/${oldPath}?token=temporary`]]); },
    ...overrides,
  };
}

test('portal receipt signer serves the historical image and never signs empty snapshots or the current profile', async () => {
  const result = await resolveReceiptImages(request, dependencies());
  assert.equal(result.status, 200);
  assert.ok(result.body.images?.['old-receipt']?.includes(oldPath));
  assert.ok(!('empty-receipt' in result.body.images!));
});

test('portal receipt signing rejects incorrect credentials and another student receipt before accessing storage', async () => {
  let calls = 0;
  const deps = dependencies({ async sign() { calls++; return new Map(); } });
  assert.equal((await resolveReceiptImages({ ...request, kode: 'WRONGCODE' }, deps)).status, 401);
  assert.equal((await resolveReceiptImages({ ...request, transactionIds: ['old-receipt', 'someone-else'] }, deps)).status, 403);
  assert.equal(calls, 0);
});

test('receipt signing rejects external images, student photos, traversal and arbitrary paths', async () => {
  for (const ref of [reference.replace(url, 'https://evil.example'), reference.replace('club/', 'people/'),
    `${url}/storage/v1/object/public/avatars/club/../people/photo.png`, 'data:image/png;base64,AA==',
    `${url}/storage/v1/object/public/payment-proofs/${oldPath}`, `${url}/storage/v1/object/public/avatars/club/any.png`]) {
    let calls = 0;
    const deps = dependencies({ async portalData() { return { transactions: [{ id: 'old-receipt', pengurus_ttd: ref }] }; }, async sign() { calls++; return new Map(); } });
    assert.notEqual((await resolveReceiptImages({ ...request, transactionIds: ['old-receipt'] }, deps)).status, 200);
    assert.equal(calls, 0);
  }
});

test('receipt signing bounds requests and masks backend failures without returning partial URLs', async () => {
  for (const body of [null, {}, { ...request, transactionIds: [] }, { ...request, transactionIds: Array(101).fill('old-receipt') }, { ...request, transactionIds: [42] }]) {
    assert.equal((await resolveReceiptImages(body, dependencies())).status, 400);
  }
  const result = await resolveReceiptImages(request, dependencies({ async sign() { throw new Error('server secret and SQL internals'); } }));
  assert.equal(result.status, 502);
  assert.ok(!JSON.stringify(result).includes('server secret'));
  assert.equal(result.body.images, undefined);
  assert.equal((await resolveReceiptImages(request, dependencies({ async sign() { return new Map(); } }))).status, 502);
  assert.equal(receiptImageDependencies({ VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: 'public' }), null);
});

test('HTTP receipt endpoint accepts POST JSON, disables caching and rejects malformed/oversized requests', async () => {
  const server = createServer(createReceiptImagesHandler({}, dependencies()));
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const endpoint = `http://127.0.0.1:${address.port}/api/portal-receipt-images`;
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok((await response.json()).images['old-receipt']);
    assert.equal((await fetch(endpoint)).status, 405);
    assert.equal((await fetch(endpoint, { method: 'POST', body: JSON.stringify(request) })).status, 415);
    assert.equal((await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' })).status, 400);
    assert.equal((await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...request, huge: 'x'.repeat(17000) }) })).status, 413);
  } finally { await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
});

const transactions = [
  { id: 'old-receipt', pengurusTtd: reference, pengurusNama: 'Pengurus Lama' },
  { id: 'empty-receipt', pengurusTtd: '', pengurusNama: '' },
] as PaymentTransaction[];

test('portal client uses its same-origin endpoint and retains receipt identity with signed images', async () => {
  const result = await portalReceiptImages(transactions, credentials, (async (endpoint, options) => {
    assert.equal(endpoint, '/api/portal-receipt-images'); assert.equal(options?.method, 'POST');
    assert.equal(options?.cache, 'no-store');
    assert.deepEqual(JSON.parse(options!.body as string), { ...credentials, transactionIds: ['old-receipt'] });
    return Response.json({ images: { 'old-receipt': 'signed-historical-image' } });
  }) as typeof fetch);
  assert.equal(result.receiptImagesError, false);
  assert.equal(result.transactions[0].pengurusTtd, 'signed-historical-image');
  assert.equal(result.transactions[0].pengurusNama, 'Pengurus Lama');
  assert.equal(result.transactions[1].pengurusTtd, '');
});

test('portal signing failure is explicit and removes inaccessible images without changing signer snapshots', async () => {
  for (const fetcher of [async () => Response.json({ error: 'Unavailable' }, { status: 503 }), async () => Response.json({ images: {} }), async () => { throw new Error('network'); }]) {
    const result = await portalReceiptImages(transactions, credentials, fetcher as typeof fetch);
    assert.equal(result.receiptImagesError, true);
    assert.equal(result.transactions[0].pengurusTtd, '');
    assert.equal(result.transactions[0].pengurusNama, 'Pengurus Lama');
  }
  const result = await portalReceiptImages([transactions[1]], credentials, (async () => { throw new Error('Must not fetch'); }) as typeof fetch);
  assert.equal(result.receiptImagesError, false);
});
