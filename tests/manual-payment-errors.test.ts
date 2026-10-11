import assert from 'node:assert/strict';
import { test } from 'node:test';
import { manualPaymentRpcError } from '../src/utils/manualPayment';

test('missing or mismatched payment RPC lets staff exit and explains the database upgrade', () => {
  for (const code of ['PGRST202', 'PGRST203', 'PGRST204']) {
    const error = manualPaymentRpcError(code);
    assert.equal(error.uncertain, false);
    assert.match(error.message, /belum disimpan.*migrasi Supabase/);
  }
});

test('authentication and rolled-back SQL failures allow correction', () => {
  for (const code of ['PGRST301', 'PGRST302', 'PGRST303', '42501', '23505', 'P0001', '40001']) {
    assert.equal(manualPaymentRpcError(code).uncertain, false, code);
  }
});

test('unconfirmed transport and transaction outcomes preserve the same payment request', () => {
  for (const code of [undefined, '', 'PGRST000', 'PGRST001', 'PGRST002', 'PGRST003', '08006', '08007', '40003']) {
    assert.equal(manualPaymentRpcError(code).uncertain, true, code);
  }
});
