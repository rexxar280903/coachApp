import { createClient } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'node:http';

type ReceiptRow = { id: string; pengurus_ttd?: string | null };
export interface ReceiptImageDependencies {
  supabaseUrl: string;
  portalData(hp: string, kode: string): Promise<{ transactions: ReceiptRow[] } | null>;
  sign(paths: string[]): Promise<Map<string, string>>;
}
type Result = { status: number; body: { images?: Record<string, string>; error?: string } };

/** Only immutable club images referenced by this student's own receipts may be signed. */
export async function resolveReceiptImages(body: unknown, deps: ReceiptImageDependencies): Promise<Result> {
  if (!body || typeof body !== 'object') return { status: 400, body: { error: 'Permintaan tidak valid.' } };
  const { hp, kode, transactionIds } = body as Record<string, unknown>;
  if (typeof hp !== 'string' || !hp.trim() || hp.length > 40 || typeof kode !== 'string' || !kode.trim() || kode.length > 64
    || !Array.isArray(transactionIds) || transactionIds.length < 1 || transactionIds.length > 100
    || transactionIds.some(id => typeof id !== 'string' || !id || id.length > 128)) {
    return { status: 400, body: { error: 'Permintaan tidak valid.' } };
  }
  try {
    // Use the anon client here: database portal authentication and rate limits stay in effect.
    const bundle = await deps.portalData(hp, kode);
    if (!bundle) return { status: 401, body: { error: 'Sesi portal tidak valid atau percobaan dibatasi.' } };
    const ownReceipts = new Map(bundle.transactions.map(tx => [tx.id, tx]));
    const requestedPaths = new Map<string, string>();
    for (const id of transactionIds as string[]) {
      const tx = ownReceipts.get(id);
      if (!tx) return { status: 403, body: { error: 'Kuitansi tidak dapat diakses.' } };
      if (!tx.pengurus_ttd) continue; // Empty snapshots never adopt the current club signature.
      const url = new URL(tx.pengurus_ttd);
      const match = /^\/storage\/v1\/object\/(?:public|sign)\/avatars\/(club\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp))$/.exec(url.pathname);
      if (url.origin !== new URL(deps.supabaseUrl).origin || !match) return { status: 403, body: { error: 'Referensi tanda tangan tidak valid.' } };
      requestedPaths.set(id, match[1]);
    }
    const paths = [...new Set(requestedPaths.values())];
    const signed = paths.length ? await deps.sign(paths) : new Map<string, string>();
    if (paths.some(path => !signed.get(path))) throw new Error('Incomplete signing result');
    return { status: 200, body: { images: Object.fromEntries([...requestedPaths].map(([id, path]) => [id, signed.get(path)!])) } };
  } catch {
    return { status: 502, body: { error: 'Tanda tangan kuitansi belum dapat dimuat. Coba muat ulang halaman.' } };
  }
}

export function receiptImageDependencies(env: Record<string, string | undefined>): ReceiptImageDependencies | null {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceKey) return null;
  const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
  const portalClient = createClient(url, anonKey, options);
  const signer = createClient(url, serviceKey, options);
  return {
    supabaseUrl: url,
    async portalData(hp, kode) {
      const { data, error } = await portalClient.rpc('portal_data', { p_hp: hp, p_kode: kode });
      if (error) throw new Error('Portal unavailable');
      if (!data || data.error) return null;
      if (!Array.isArray(data.transactions)) throw new Error('Invalid portal result');
      return data;
    },
    async sign(paths) {
      const { data, error } = await signer.storage.from('avatars').createSignedUrls(paths, 3600);
      if (error) throw new Error('Storage unavailable');
      return new Map((data ?? []).filter(item => !item.error && item.signedUrl && item.path).map(item => [item.path!, item.signedUrl!]));
    },
  };
}

type Request = IncomingMessage & { body?: unknown };
export function createReceiptImagesHandler(env: Record<string, string | undefined>, deps?: ReceiptImageDependencies) {
  return async (req: Request, res: ServerResponse) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status: number, body: Result['body']) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); send(405, { error: 'Gunakan POST.' }); return; }
    if (!(req.headers['content-type'] ?? '').startsWith('application/json')) { send(415, { error: 'Gunakan JSON.' }); return; }
    try {
      let body = req.body;
      if (Number(req.headers['content-length']) > 16384) { send(413, { error: 'Permintaan terlalu besar.' }); return; }
      if (body === undefined) {
        const chunks: Buffer[] = []; let length = 0;
        for await (const chunk of req) {
          length += Buffer.byteLength(chunk);
          if (length > 16384) { send(413, { error: 'Permintaan terlalu besar.' }); return; }
          chunks.push(Buffer.from(chunk));
        }
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } else if (typeof body === 'string') {
        if (Buffer.byteLength(body) > 16384) { send(413, { error: 'Permintaan terlalu besar.' }); return; }
        body = JSON.parse(body);
      } else if (Buffer.byteLength(JSON.stringify(body)) > 16384) {
        send(413, { error: 'Permintaan terlalu besar.' }); return;
      }
      const dependencies = deps ?? receiptImageDependencies(env);
      if (!dependencies) { send(503, { error: 'Layanan tanda tangan belum dikonfigurasi. Hubungi pengurus.' }); return; }
      const result = await resolveReceiptImages(body, dependencies);
      send(result.status, result.body);
    } catch { send(400, { error: 'Permintaan tidak dapat diproses.' }); }
  };
}
