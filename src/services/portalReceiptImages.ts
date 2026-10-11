import type { PaymentTransaction } from '../types/sportkit';

/** Keep the portal usable on signing failure, but never show a public/current signature fallback. */
export async function portalReceiptImages(
  transactions: PaymentTransaction[],
  credentials: { hp: string; kode: string },
  fetcher: typeof fetch = fetch,
): Promise<{ transactions: PaymentTransaction[]; receiptImagesError: boolean }> {
  const ids = transactions.filter(tx => tx.pengurusTtd).map(tx => tx.id);
  const images = new Map<string, string>();
  let receiptImagesError = false;
  for (let offset = 0; offset < ids.length; offset += 100) {
    const requested = ids.slice(offset, offset + 100);
    try {
      const response = await fetcher('/api/portal-receipt-images', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...credentials, transactionIds: requested }),
        cache: 'no-store', signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error('Signing unavailable');
      const data = await response.json();
      if (requested.some(id => typeof data.images?.[id] !== 'string' || !data.images[id])) throw new Error('Incomplete result');
      for (const id of requested) images.set(id, data.images[id]);
    } catch { receiptImagesError = true; }
  }
  return {
    transactions: transactions.map(tx => ({ ...tx, pengurusTtd: images.get(tx.id) ?? '' })),
    receiptImagesError,
  };
}
