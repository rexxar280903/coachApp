const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_INPUT_BYTES = 10 * 1024 * 1024;

export interface ImageOptions {
  /** Sisi terpanjang hasil (px). */
  maxDim?: number;
  /** Kualitas JPEG 0–1. */
  quality?: number;
}

/**
 * Validasi (tipe & ukuran) lalu perkecil gambar dan kembalikan sebagai data URL JPEG.
 * Melempar Error berbahasa Indonesia jika file tidak valid.
 */
export async function fileToCompressedDataUrl(
  file: File,
  { maxDim = 1280, quality = 0.82 }: ImageOptions = {},
): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format gambar harus JPG, PNG, atau WebP.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Ukuran file maksimal 10 MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('File gambar tidak dapat dibaca.'));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser tidak mendukung pemrosesan gambar.');
    // Latar putih agar PNG transparan tidak menjadi hitam saat jadi JPEG.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg';
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
