import assert from 'node:assert/strict';
import { test } from 'node:test';
import { receiptSigner } from '../src/utils/payments';
import type { ClubProfile, PaymentTransaction } from '../src/types/sportkit';

const profile: ClubProfile = { namaKlub: 'Klub Uji', cabangOlahraga: 'Renang', alamat: '', kota: '',
  noHp: '', email: '', noWhatsApp: '', pengurusNama: 'Pengurus Baru', pengurusJabatan: 'Ketua Baru', pengurusTtd: 'new-signature' };
const tx: PaymentTransaction = { id: 'tx', nomorKuitansi: 'INV-1', siswaId: 'siswa', siswaNama: 'Siswa Uji',
  kelasNama: 'Kelas Uji', tanggal: '2026-10-10', nominal: 100000, terbilang: '', metodePembayaran: 'Tunai',
  tipe: 'Iuran Rutin', keterangan: '' };

test('receipt signer stays fixed after club profile changes, including originally empty snapshots', () => {
  assert.deepEqual(receiptSigner({ ...tx, pengurusNama: 'Pengurus Lama', pengurusJabatan: 'Bendahara Lama', pengurusTtd: 'old-signature' }, profile),
    { nama: 'Pengurus Lama', jabatan: 'Bendahara Lama', ttd: 'old-signature' });
  assert.deepEqual(receiptSigner({ ...tx, pengurusNama: '', pengurusJabatan: '', pengurusTtd: '' }, profile),
    { nama: 'Pengurus Klub Uji', jabatan: 'Bendahara / Pengurus Klub', ttd: '' });
  assert.deepEqual(receiptSigner(tx, profile), { nama: 'Pengurus Baru', jabatan: 'Ketua Baru', ttd: 'new-signature' });
  assert.deepEqual(receiptSigner({ ...tx, pengurusNama: 'Pengurus Lama', pengurusJabatan: 'Bendahara Lama', pengurusTtd: undefined }, profile),
    { nama: 'Pengurus Lama', jabatan: 'Bendahara Lama', ttd: '' });
});
