import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RaporDocument } from '../src/components/RaporPrintModal';
import { cleanRaporAnswers, createSampleTemplate, groupRaporSections, isSwimmingTemplate, missingRequired, raporProgress, raporValidationError, usiaPadaTanggal } from '../src/utils/rapor';
import { createSwimmingEvaluationTemplate, SWIMMING_CURRICULUM } from '../src/utils/swimmingRaporTemplate';
import { RaporTemplate } from '../src/types/sportkit';
import { raporTestEntry, raporTestFolder, raporTestProfile, raporTestStudent, raporTestTemplate } from './fixtures/rapor-data';

test('swimming preset preserves five levels, twenty meetings, curriculum and graduation recap', () => {
  const template = createSwimmingEvaluationTemplate();
  const sections = groupRaporSections(template.items);
  assert.equal(sections.length, 6);
  assert.equal(template.items.filter((it) => it.tipe === 'pertemuan').length, 20);
  assert.equal(template.items.filter((it) => it.tipe === 'kelulusan').length, 5);
  assert.equal(template.items.filter((it) => it.tipe === 'paragraf').length, 5);
  sections.slice(0, 5).forEach((s, i) => {
    assert.equal(s.judul, SWIMMING_CURRICULUM[i].judul);
    assert.equal(s.items.filter((it) => it.tipe === 'pertemuan').length, 4);
    s.items.filter((it) => it.tipe === 'pertemuan').forEach((it) => {
      assert.equal(it.materi?.length, 4);
      assert.ok(it.indikator);
      assert.ok(!it.wajib, 'partial assessments must be savable');
    });
  });
  assert.equal(isSwimmingTemplate(template), true);
  const text = JSON.stringify(template);
  for (const sample of ['Alifa Qeiza', 'Ilham Rahmadani', 'September 2026', '8 tahun', '4 Meet']) assert.ok(!text.includes(sample));
});

test('each preset is independent and has unique IDs', () => {
  const one = createSwimmingEvaluationTemplate();
  const two = createSwimmingEvaluationTemplate();
  assert.notEqual(one.id, two.id);
  assert.equal(new Set(one.items.map((i) => i.id)).size, one.items.length);
  assert.ok(one.items.every((i) => !two.items.some((j) => j.id === i.id)));
  one.items.find((i) => i.tipe === 'pertemuan')!.materi![0] = 'Diubah';
  assert.notEqual(two.items.find((i) => i.tipe === 'pertemuan')!.materi![0], 'Diubah');
});

test('partial meeting evaluations retain notes without treating them as a grade', () => {
  const template = createSwimmingEvaluationTemplate();
  const first = template.items.find((i) => i.tipe === 'pertemuan')!;
  const answers = { [first.id]: ['', 'Observasi awal'] };
  assert.equal(raporValidationError(template, answers), null);
  assert.deepEqual(raporProgress(template, answers), { dinilai: 0, total: 20 });
  first.wajib = true;
  assert.deepEqual(missingRequired(template, answers), [first]);
  assert.deepEqual(missingRequired(template, { [first.id]: ['B', ''] }), []);
  assert.deepEqual(raporProgress(template, { [first.id]: ['C', ''] }), { dinilai: 1, total: 20 });
  assert.ok(raporValidationError(template, { [first.id]: ['A', ''] }));
  assert.ok(raporValidationError(template, { [first.id]: 'M' }));
});

test('graduation is an explicit coach choice and requires a valid date and signer when passed', () => {
  const template = createSwimmingEvaluationTemplate();
  const recap = template.items.find((i) => i.tipe === 'kelulusan')!;
  assert.equal(raporValidationError(template, {}), null);
  assert.ok(raporValidationError(template, { [recap.id]: ['Lulus', '', 'Pelatih'] }));
  assert.ok(raporValidationError(template, { [recap.id]: ['Lulus', '2026-02-30', 'Pelatih'] }));
  assert.ok(raporValidationError(template, { [recap.id]: ['Lulus', '2026-10-08', ' '] }));
  assert.ok(raporValidationError(template, { [recap.id]: ['Otomatis', '', 'Pelatih'] }));
  assert.equal(raporValidationError(template, { [recap.id]: ['Lulus', '2026-10-08', 'Pelatih'] }), null);
  assert.equal(raporValidationError(template, { [recap.id]: ['Mengulang', '', 'Pelatih'] }), null);
  assert.ok(raporValidationError(template, { [recap.id]: ['Mengulang', '2026-10-08', 'Pelatih'] }));
});

test('cleaning preserves structured answers in existing JSON format and removes stale data', () => {
  const template = createSwimmingEvaluationTemplate();
  const first = template.items.find((i) => i.tipe === 'pertemuan')!;
  const recap = template.items.find((i) => i.tipe === 'kelulusan')!;
  const note = template.items.find((i) => i.tipe === 'paragraf')!;
  const clean = cleanRaporAnswers(template, {
    [first.id]: [' M ', ' Catatan\nbaris kedua ', 'ignored'],
    [recap.id]: [' Lulus ', ' 2026-10-08 ', ' Pelatih '],
    [note.id]: '  Catatan level  ',
    deleted: 'Jawaban lama', [template.items[0].id]: 'Judul bukan jawaban',
  });
  assert.deepEqual(clean, { [first.id]: ['M', 'Catatan\nbaris kedua'], [recap.id]: ['Lulus', '2026-10-08', 'Pelatih'], [note.id]: 'Catatan level' });
  assert.deepEqual(JSON.parse(JSON.stringify(clean)), clean);
});

test('legacy templates retain required validation and regular printed values', () => {
  const template = createSampleTemplate('Footer Lama');
  assert.equal(isSwimmingTemplate(template), false);
  const row = template.items.find((it) => it.tipe === 'pilihan')!;
  row.wajib = true;
  assert.equal(missingRequired(template, {}).length, 1);
  assert.equal(missingRequired(template, { [row.id]: 'A' }).length, 0);
  assert.equal(raporValidationError(template, { [row.id]: 'A' }), null);
  const markup = renderToStaticMarkup(React.createElement(RaporDocument, {
    profile: raporTestProfile, data: { template, folder: raporTestFolder, entry: { ...raporTestEntry, jawaban: { [row.id]: 'A' } }, student: raporTestStudent, kelasNama: 'Kelas Uji' },
  }));
  assert.ok(markup.includes('Footer Lama'));
  assert.ok(markup.includes('Teknik Pernapasan'));
  assert.ok(!markup.includes('Materi &amp; Kurikulum'));
});

test('swimming report prints every meeting, rubric, recap and dynamic identities with safe escaping', () => {
  const markup = renderToStaticMarkup(React.createElement(RaporDocument, {
    profile: raporTestProfile,
    data: { entry: raporTestEntry, folder: raporTestFolder, template: raporTestTemplate, student: { ...raporTestStudent, nama: '<script>alert(1)</script>' }, kelasNama: 'Kelas Uji' },
  }));
  assert.equal((markup.match(/Materi &amp; Kurikulum/g) ?? []).length, 5);
  assert.equal((markup.match(/Indikator Utama/g) ?? []).length, 20);
  assert.equal((markup.match(/Pertemuan \d+ \(/g) ?? []).length, 20);
  assert.ok(markup.includes('Tanda Tangan Pelatih'));
  assert.ok(markup.includes('08/10/2026'));
  assert.ok(markup.includes('8 tahun / Kelas Uji'));
  assert.ok(markup.includes('Mahir / Mandiri'));
  assert.ok(markup.includes('Orangtua Uji'));
  assert.ok(markup.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!markup.includes('<script>'));
});

test('student age uses period end, handles birthdays and rejects invalid dates', () => {
  assert.equal(usiaPadaTanggal('2018-09-10', '2026-09-09'), '7 tahun');
  assert.equal(usiaPadaTanggal('2018-09-10', '2026-09-10'), '8 tahun');
  assert.equal(usiaPadaTanggal(undefined, '2026-10-08'), '-');
  assert.equal(usiaPadaTanggal('2026-02-30', '2026-10-08'), '-');
  assert.equal(usiaPadaTanggal('2027-01-01', '2026-10-08'), '-');
});

test('all original input types keep their answers when saving', () => {
  const template: RaporTemplate = { id: 'legacy', nama: 'Lama', header: '', footer: '', items: [
    { id: 'text', tipe: 'isian', label: 'Tinggi' }, { id: 'long', tipe: 'paragraf', label: 'Catatan' },
    { id: 'check', tipe: 'checkbox', label: 'Gaya' }, { id: 'radio', tipe: 'pilihan', label: 'Nilai' },
    { id: 'dropdown', tipe: 'dropdown', label: 'Level' },
  ] };
  assert.deepEqual(cleanRaporAnswers(template, { text: ' 120 ', long: ' Catatan ', check: ['Bebas', 'Dada'], radio: 'A', dropdown: 'Dasar' }),
    { text: '120', long: 'Catatan', check: ['Bebas', 'Dada'], radio: 'A', dropdown: 'Dasar' });
});
