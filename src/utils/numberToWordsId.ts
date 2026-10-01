/**
 * Converts a number to Indonesian terbilang words (WITHOUT "Rupiah" suffix).
 * Example: 1100000 -> "Satu Juta Seratus Ribu"
 */
export function terbilangId(nominal: number): string {
  if (nominal === 0) return 'Nol';
  if (nominal < 0) return 'Minus ' + terbilangId(Math.abs(nominal));

  const bilangan = [
    '',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
    'Sebelas',
  ];

  function terbilangSatuan(n: number): string {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return bilangan[n - 10] + ' Belas';
    } else if (n < 100) {
      const sisa = n % 10;
      return bilangan[Math.floor(n / 10)] + ' Puluh' + (sisa ? ' ' + bilangan[sisa] : '');
    } else if (n < 200) {
      return 'Seratus' + (n - 100 ? ' ' + terbilangSatuan(n - 100) : '');
    } else if (n < 1000) {
      const sisa = n % 100;
      return bilangan[Math.floor(n / 100)] + ' Ratus' + (sisa ? ' ' + terbilangSatuan(sisa) : '');
    } else if (n < 2000) {
      return 'Seribu' + (n - 1000 ? ' ' + terbilangSatuan(n - 1000) : '');
    } else if (n < 1000000) {
      const sisa = n % 1000;
      return terbilangSatuan(Math.floor(n / 1000)) + ' Ribu' + (sisa ? ' ' + terbilangSatuan(sisa) : '');
    } else if (n < 1000000000) {
      const sisa = n % 1000000;
      return terbilangSatuan(Math.floor(n / 1000000)) + ' Juta' + (sisa ? ' ' + terbilangSatuan(sisa) : '');
    } else if (n < 1000000000000) {
      const sisa = n % 1000000000;
      return terbilangSatuan(Math.floor(n / 1000000000)) + ' Milyar' + (sisa ? ' ' + terbilangSatuan(sisa) : '');
    }
    return '';
  }

  const result = terbilangSatuan(Math.floor(nominal)).trim();
  return (result ? result : 'Nol');
}

/**
 * Returns the number in words WITH "Rupiah" suffix.
 * Example: 1100000 -> "Satu Juta Seratus Ribu Rupiah"
 */
export function numberToWordsId(nominal: number): string {
  return terbilangId(nominal) + ' Rupiah';
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('IDR', 'Rp');
}
