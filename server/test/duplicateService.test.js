const { test } = require('node:test');
const assert = require('node:assert');

const { findDuplicate, normalizeInvoiceNumber, normalizeVendor, sameAmount } = require('../src/services/duplicateService');

test('normalizeInvoiceNumber strips separators and uppercases', () => {
  assert.strictEqual(normalizeInvoiceNumber('inv-2026/001'), 'INV2026001');
  assert.strictEqual(normalizeInvoiceNumber(null), '');
});

test('normalizeVendor lowercases and strips punctuation', () => {
  assert.strictEqual(normalizeVendor('Acme Corp.'), 'acmecorp');
  assert.strictEqual(normalizeVendor(''), '');
});

test('sameAmount compares within a tolerance', () => {
  assert.ok(sameAmount(1000, 1000.01));
  assert.ok(sameAmount(0, 0));
  assert.ok(!sameAmount(1000, 1050));
});

test('identical invoice number + vendor + amount is a high-confidence duplicate', () => {
  const existing = [
    { _id: 'a1', invoiceNumber: 'INV-2026-001', vendorName: 'Acme Corp', totalAmount: 118000, invoiceDate: '2026-08-01' },
  ];
  const result = findDuplicate(
    { invoiceNumber: 'INV-2026-001', vendorName: 'Acme Corp', totalAmount: 118000, invoiceDate: '2026-08-03' },
    existing
  );
  assert.ok(result);
  assert.strictEqual(result.confidence, 'high');
  assert.strictEqual(result.invoiceId, 'a1');
});

test('same number + vendor but different amount and old date is medium', () => {
  const existing = [
    { _id: 'a1', invoiceNumber: 'INV-100', vendorName: 'Acme Corp', totalAmount: 5000, invoiceDate: '2025-01-01' },
  ];
  const result = findDuplicate(
    { invoiceNumber: 'INV-100', vendorName: 'Acme Corp', totalAmount: 9900, invoiceDate: '2026-08-01' },
    existing
  );
  assert.ok(result);
  assert.strictEqual(result.confidence, 'medium');
});

test('same vendor, date and amount without invoice numbers is high', () => {
  const existing = [
    { _id: 'b2', invoiceNumber: null, vendorName: 'Cafe Blue', totalAmount: 420, invoiceDate: '2026-08-01' },
  ];
  const result = findDuplicate(
    { invoiceNumber: null, vendorName: 'Cafe Blue', totalAmount: 420, invoiceDate: '2026-08-01' },
    existing
  );
  assert.ok(result);
  assert.strictEqual(result.confidence, 'high');
});

test('similar vendor amount within 60 days is medium', () => {
  const existing = [
    { _id: 'c3', invoiceNumber: 'INV-X', vendorName: 'Beta Ltd', totalAmount: 10000, invoiceDate: '2026-07-01' },
  ];
  const result = findDuplicate(
    { invoiceNumber: 'INV-Y', vendorName: 'Beta Ltd', totalAmount: 10010, invoiceDate: '2026-07-20' },
    existing
  );
  assert.ok(result);
  assert.strictEqual(result.confidence, 'medium');
});

test('no match returns null and avoids false positives', () => {
  const existing = [
    { _id: 'd4', invoiceNumber: 'INV-2026-001', vendorName: 'Acme Corp', totalAmount: 118000, invoiceDate: '2026-08-01' },
  ];
  assert.strictEqual(
    findDuplicate(
      { invoiceNumber: 'INV-2026-002', vendorName: 'Other Ltd', totalAmount: 500, invoiceDate: '2026-08-01' },
      existing
    ),
    null
  );
});

test('same vendor with far-apart dates and different amounts is not a duplicate', () => {
  const existing = [
    { _id: 'e5', invoiceNumber: 'INV-A', vendorName: 'Gamma', totalAmount: 3000, invoiceDate: '2025-01-01' },
  ];
  assert.strictEqual(
    findDuplicate(
      { invoiceNumber: 'INV-B', vendorName: 'Gamma', totalAmount: 3100, invoiceDate: '2026-08-01' },
      existing
    ),
    null
  );
});
