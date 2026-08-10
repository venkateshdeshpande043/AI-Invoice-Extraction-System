const { test } = require('node:test');
const assert = require('node:assert');

const {
  normalizeVendorName,
  computeVendorSummary,
} = require('../src/services/vendorService');

test('normalizeVendorName lowercases and collapses whitespace', () => {
  assert.strictEqual(normalizeVendorName('  Acme   Corp  '), 'acme corp');
  assert.strictEqual(normalizeVendorName(''), '');
  assert.strictEqual(normalizeVendorName(null), '');
});

test('computeVendorSummary groups invoices by normalized vendor name', () => {
  const invoices = [
    { vendorName: 'Acme Corp', totalAmount: 1000, amountPaid: 1000, invoiceDate: '2026-08-01', gstVatNumber: 'GSTIN123' },
    { vendorName: 'acme corp', totalAmount: 500, amountPaid: 100, invoiceDate: '2026-07-01' },
    { vendorName: 'Beta Ltd', totalAmount: 200, amountPaid: 0, invoiceDate: '2026-06-01' },
  ];

  const result = computeVendorSummary(invoices);
  assert.strictEqual(result.length, 2);

  const acme = result.find((v) => v.normalizedName === 'acme corp');
  assert.strictEqual(acme.totalInvoices, 2);
  assert.strictEqual(acme.totalSpend, 1500);
  assert.strictEqual(acme.paidTotal, 1100);
  assert.strictEqual(acme.outstanding, 400);
  assert.strictEqual(acme.avgAmount, 750);
  assert.strictEqual(acme.gstin, 'GSTIN123');
  assert.strictEqual(acme.lastInvoiceDate, '2026-08-01');
});

test('computeVendorSummary skips invoices without a vendor name', () => {
  const result = computeVendorSummary([{ totalAmount: 100 }, null, { vendorName: 'Only One', totalAmount: 50 }]);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].vendorName, 'Only One');
});

test('computeVendorSummary handles partial payments and rounding', () => {
  const result = computeVendorSummary([
    { vendorName: 'X', totalAmount: 10.5, amountPaid: 3.34 },
  ]);
  assert.strictEqual(result[0].totalSpend, 10.5);
  assert.strictEqual(result[0].paidTotal, 3.34);
  assert.strictEqual(result[0].outstanding, 7.16);
  assert.strictEqual(result[0].avgAmount, 10.5);
});
