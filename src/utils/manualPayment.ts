/** A lost response may follow a committed payment; retry the same request in that case. */
export class ManualPaymentError extends Error {
  constructor(message: string, public readonly uncertain = false) {
    super(message);
    this.name = 'ManualPaymentError';
  }
}

/** Schema/auth failures happen before execution; lost connections can follow a commit. */
export function manualPaymentRpcError(code?: string): ManualPaymentError {
  if (['PGRST202', 'PGRST203', 'PGRST204'].includes(code ?? '')) {
    return new ManualPaymentError('Pembayaran belum disimpan. Database pembayaran belum sesuai versi aplikasi. Terapkan migrasi Supabase terbaru terlebih dahulu.');
  }
  if (['PGRST301', 'PGRST302', 'PGRST303', '42501'].includes(code ?? '')) {
    return new ManualPaymentError('Pembayaran belum disimpan. Sesi atau izin admin tidak valid. Masuk ulang sebagai admin lalu coba kembali.');
  }
  const sqlRollback = /^[0-9A-Z]{5}$/.test(code ?? '') && !code?.startsWith('08') && code !== '40003';
  return new ManualPaymentError('Pembayaran belum dapat dikonfirmasi. Coba simpan kembali; jangan membuat pembayaran baru.', !sqlRollback);
}
