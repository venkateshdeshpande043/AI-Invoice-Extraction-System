const { test } = require('node:test');
const assert = require('node:assert');

const { validateInvoice } = require('../src/services/validationService');

const baseValid = {
  invoiceNumber: 'INV-2026-001',
  vendorName: 'Acme Corp',
  invoiceDate: '2026-08-01',
  dueDate: '2026-08-15',
  gstVatNumber: '27AAPFU0939F1ZV',
  gstRate: 18,
  lineItems: [{ description: 'Laptop', quantity: 2, unitPrice: 50000, amount: 100000 }],
  subtotal: 100000,
  tax: 18000,
  totalAmount: 118000,
};

test('a consistent invoice validates as valid', () => {
  const { status, issues } = validateInvoice(baseValid);
  assert.strictEqual(status, 'valid');
  assert.strictEqual(issues.length, 0);
});

test('missing critical fields produce errors', () => {
  const { status, issues } = validateInvoice({ ...baseValid, invoiceNumber: null, vendorName: '', invoiceDate: null });
  assert.strictEqual(status, 'error');
  const codes = issues.map((i) => i.code);
  assert.ok(codes.includes('missing_invoice_number'));
  assert.ok(codes.includes('missing_vendor_name'));
  assert.ok(codes.includes('missing_invoice_date'));
  assert.ok(issues.every((i) => i.severity === 'error'));
});

test('total mismatch is flagged as an anomaly', () => {
  const { status, issues } = validateInvoice({ ...baseValid, totalAmount: 125000 });
  assert.strictEqual(status, 'anomaly');
  assert.ok(issues.some((i) => i.code === 'total_mismatch'));
});

test('line item sum vs subtotal mismatch is a warning', () => {
  const { status, issues } = validateInvoice({ ...baseValid, subtotal: 99000, tax: 18000, totalAmount: 117000 });
  assert.strictEqual(status, 'warning');
  assert.ok(issues.some((i) => i.code === 'line_items_vs_subtotal'));
});

test('line item arithmetic error is a warning', () => {
  const { status, issues } = validateInvoice({
    ...baseValid,
    lineItems: [{ description: 'Laptop', quantity: 2, unitPrice: 50000, amount: 90000 }],
  });
  assert.strictEqual(status, 'warning');
  assert.ok(issues.some((i) => i.code === 'line_item_calc'));
});

test('suspicious GST number is a warning', () => {
  const { status, issues } = validateInvoice({ ...baseValid, gstVatNumber: 'VENDOR-REF-2026' });
  assert.strictEqual(status, 'warning');
  assert.ok(issues.some((i) => i.code === 'gst_format'));
});

test('a well-formed EU VAT number is not flagged', () => {
  const { issues } = validateInvoice({ ...baseValid, gstVatNumber: 'DE123456789' });
  assert.ok(!issues.some((i) => i.code === 'gst_format'));
});

test('unusually high implied tax rate is an anomaly', () => {
  const { status, issues } = validateInvoice({ ...baseValid, tax: 80000 });
  assert.strictEqual(status, 'anomaly');
  assert.ok(issues.some((i) => i.code === 'tax_unusually_high'));
});

test('declared rate differing from implied rate is a warning', () => {
  const { status, issues } = validateInvoice({ ...baseValid, tax: 5000, totalAmount: 105000 });
  assert.strictEqual(status, 'warning');
  assert.ok(issues.some((i) => i.code === 'tax_rate_mismatch'));
});

test('due date before invoice date is an error', () => {
  const { status, issues } = validateInvoice({ ...baseValid, dueDate: '2026-07-01' });
  assert.strictEqual(status, 'error');
  assert.ok(issues.some((i) => i.code === 'due_before_invoice'));
});

test('future invoice date is a warning', () => {
  const future = new Date(Date.now() + 30 * 86400000).toISOString();
  const { status, issues } = validateInvoice({ ...baseValid, invoiceDate: future, dueDate: null });
  assert.strictEqual(status, 'warning');
  assert.ok(issues.some((i) => i.code === 'date_in_future'));
});

test('negative total is an error', () => {
  const { status, issues } = validateInvoice({ ...baseValid, totalAmount: -100 });
  assert.strictEqual(status, 'error');
  assert.ok(issues.some((i) => i.code === 'negative_total'));
});

test('discount exceeding subtotal is flagged', () => {
  const { status, issues } = validateInvoice({ ...baseValid, discount: 150000, tax: 0, totalAmount: -50000 });
  assert.ok(issues.some((i) => i.code === 'discount_exceeds_subtotal'));
  assert.ok(['error', 'anomaly'].includes(status));
});

test('tolerates amounts within the rounding tolerance', () => {
  const { status } = validateInvoice({ ...baseValid, totalAmount: 118000.5 });
  assert.strictEqual(status, 'valid');
});

test('handles string numbers and dates gracefully', () => {
  const { status } = validateInvoice({
    ...baseValid,
    subtotal: '100000',
    tax: '18000',
    totalAmount: '118000',
    invoiceDate: '2026-08-01T10:00:00Z',
  });
  assert.strictEqual(status, 'valid');
});
