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
  if (file.size === 0) throw new Error('File gambar kosong.');

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('File gambar tidak dapat dibaca.'));
      el.src = objectUrl;
    });

    if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 40_000_000) {
      throw new Error('Resolusi gambar terlalu besar (maksimal 40 megapiksel).');
    }

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

export function dataUrlToBlob(dataUrl: string, maxBytes = 5 * 1024 * 1024): Blob {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || match[2].length > Math.ceil(maxBytes / 3) * 4) throw new Error('Format atau ukuran gambar tidak valid.');
  const [, mime, body] = match;
  let bin: string;
  try { bin = atob(body); } catch { throw new Error('Data gambar tidak valid.'); }
  if (!bin.length || bin.length > maxBytes) throw new Error('Ukuran gambar melampaui batas.');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const valid = mime === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : mime === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)
    : bin.startsWith('RIFF') && bin.slice(8, 12) === 'WEBP';
  if (!valid) throw new Error('Isi file tidak sesuai dengan format gambar.');
  return new Blob([bytes], { type: mime });
}
