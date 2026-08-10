const { test } = require('node:test');
const assert = require('node:assert');

const { generateInvoicePdf } = require('../src/services/pdfService');

const fixtureInvoice = {
  _id: 'abc123',
  invoiceNumber: 'INV-00001',
  vendorName: 'My Business',
  customerName: 'Acme Corp',
  gstVatNumber: '27AAPFU0939F1ZV',
  invoiceDate: new Date('2026-08-10'),
  dueDate: new Date('2026-09-10'),
  currency: 'INR',
  subtotal: 10000,
  discount: 50,
  tax: 1800,
  totalAmount: 11750,
  source: 'generated',
  template: 'classic',
  seller: { name: 'My Business', address: '1 Main St', gstVatNumber: '27AABCU9603R1ZM' },
  notes: 'Thank you for your business.',
  paymentTerms: 'Due within 30 days.',
  lineItems: [
    { description: 'Consulting', quantity: 5, unitPrice: 2000, amount: 10000 },
  ],
};

test('generates a valid PDF buffer', async () => {
  const buffer = await generateInvoicePdf(fixtureInvoice);
  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 500, `PDF should be non-trivial, got ${buffer.length} bytes`);
  // PDF magic header
  assert.strictEqual(buffer.slice(0, 5).toString(), '%PDF-');
});

test('generates a valid PDF for the minimal template', async () => {
  const buffer = await generateInvoicePdf({ ...fixtureInvoice, template: 'minimal' });
  assert.strictEqual(buffer.slice(0, 5).toString(), '%PDF-');
  assert.ok(buffer.length > 500);
});

test('generates a PDF without seller or line items', async () => {
  const buffer = await generateInvoicePdf({
    _id: 'x',
    invoiceNumber: 'INV-9',
    customerName: 'Nobody',
    totalAmount: 0,
    lineItems: [],
  });
  assert.strictEqual(buffer.slice(0, 5).toString(), '%PDF-');
  assert.ok(buffer.length > 300);
});
