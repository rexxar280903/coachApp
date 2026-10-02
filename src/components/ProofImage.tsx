import React from 'react';
import { ImageOff } from 'lucide-react';

interface ProofImageProps {
  src?: string;
  alt: string;
  className?: string;
}

/** Gambar bukti transfer; menampilkan penanda "Tanpa bukti" bila pembayaran dicatat tanpa foto. */
export const ProofImage: React.FC<ProofImageProps> = ({ src, alt, className = '' }) =>
  src ? (
    <img src={src} alt={alt} className={className} />
  ) : (
    <div
      className={`${className} flex flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400 text-[9px] font-semibold`}
      role="img"
      aria-label="Tanpa bukti gambar"
    >
      <ImageOff className="w-4 h-4" />
      <span>Tanpa bukti</span>
    </div>
  );
