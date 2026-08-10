const { test } = require('node:test');
const assert = require('node:assert');

const {
  computeLineItemAmount,
  computeTotals,
  suggestInvoiceNumber,
  normalizeInput,
} = require('../src/services/invoiceGenerationService');

test('computeLineItemAmount multiplies qty by unit price', () => {
  assert.strictEqual(computeLineItemAmount(3, 100), 300);
  assert.strictEqual(computeLineItemAmount(0, 100), 0);
  assert.strictEqual(computeLineItemAmount('2.5', '40'), 100);
});

test('computeLineItemAmount prefers an explicit amount', () => {
  assert.strictEqual(computeLineItemAmount(2, 100, 150), 150);
  assert.strictEqual(computeLineItemAmount(2, 100, ''), 200);
});

test('computeTotals derives subtotal from line items', () => {
  const result = computeTotals({
    lineItems: [
      { description: 'A', quantity: 2, unitPrice: 500 },
      { description: 'B', quantity: 1, unitPrice: 250.5 },
    ],
    taxRate: 18,
    discount: 100,
  });
  assert.strictEqual(result.subtotal, 1250.5);
  assert.strictEqual(result.tax, 225.09); // 1250.5 * 0.18
  assert.strictEqual(result.discount, 100);
  assert.strictEqual(result.totalAmount, 1375.59);
});

test('computeTotals uses explicit taxAmount when provided', () => {
  const result = computeTotals({
    lineItems: [{ description: 'A', quantity: 1, unitPrice: 1000 }],
    taxAmount: 150,
  });
  assert.strictEqual(result.tax, 150);
  assert.strictEqual(result.totalAmount, 1150);
});

test('computeTotals zero tax when no rate or amount given', () => {
  const result = computeTotals({ lineItems: [{ description: 'A', quantity: 1, unitPrice: 100 }] });
  assert.strictEqual(result.tax, 0);
  assert.strictEqual(result.totalAmount, 100);
});

test('computeTotals tolerates empty or non-array lineItems', () => {
  const result = computeTotals({});
  assert.deepStrictEqual(result.lineItems, []);
  assert.strictEqual(result.subtotal, 0);
  assert.strictEqual(result.totalAmount, 0);
});

test('computeTotals ignores amounts of zero-value/empty items', () => {
  const result = computeTotals({
    lineItems: [{ description: '  ', quantity: 0, unitPrice: 0 }],
  });
  assert.strictEqual(result.subtotal, 0);
});

test('suggestInvoiceNumber starts at INV-00001 with no history', () => {
  assert.strictEqual(suggestInvoiceNumber([]), 'INV-00001');
  assert.strictEqual(suggestInvoiceNumber([null, '']), 'INV-00001');
});

test('suggestInvoiceNumber increments the highest existing number', () => {
  assert.strictEqual(suggestInvoiceNumber(['INV-00001', 'INV-00003', 'INV-00002']), 'INV-00004');
  assert.strictEqual(suggestInvoiceNumber(['INV-42']), 'INV-00043');
  assert.strictEqual(suggestInvoiceNumber(['ACME-2026-7']), 'INV-00008');
});

test('normalizeInput builds a clean document with recomputed totals', () => {
  const doc = normalizeInput({
    seller: { name: 'My Business', address: '1 Main St', gstVatNumber: '27AABCU9603R1ZM' },
    customerName: 'Acme Corp',
    customerGstin: '27AAPFU0939F1ZV',
    invoiceNumber: 'INV-00001',
    invoiceDate: '2026-08-10',
    dueDate: '2026-09-10',
    taxRate: 18,
    discount: 50,
    lineItems: [{ description: 'Consulting', quantity: 5, unitPrice: 2000 }],
    template: 'classic',
    notes: 'Thanks!',
    currency: 'INR',
  });
  assert.strictEqual(doc.customerName, 'Acme Corp');
  assert.strictEqual(doc.seller.name, 'My Business');
  assert.strictEqual(doc.subtotal, 10000);
  assert.strictEqual(doc.tax, 1800);
  assert.strictEqual(doc.discount, 50);
  assert.strictEqual(doc.totalAmount, 11750);
  assert.strictEqual(doc.lineItems[0].amount, 10000);
  assert.strictEqual(doc.template, 'classic');
});

test('normalizeInput falls back to classic template and INR currency', () => {
  const doc = normalizeInput({ customerName: 'X', template: 'bogus', currency: '' });
  assert.strictEqual(doc.template, 'classic');
  assert.strictEqual(doc.currency, 'INR');
});

test('normalizeInput treats invalid dates as null', () => {
  const doc = normalizeInput({ customerName: 'X', invoiceDate: 'not-a-date', dueDate: null });
  assert.strictEqual(doc.invoiceDate, null);
  assert.strictEqual(doc.dueDate, null);
});
