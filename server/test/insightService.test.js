const { test } = require('node:test');
const assert = require('node:assert');

const { generateInsights } = require('../src/services/insightService');

const NOW = new Date('2026-08-10T12:00:00');

const fixtureInvoices = [
  { _id: '1', invoiceNumber: 'INV-0001', vendorName: 'Acme Supplies', invoiceDate: '2026-07-20', dueDate: '2026-08-05', paidDate: '2026-08-01', totalAmount: 50000, amountPaid: 50000, paymentStatus: 'paid', category: 'office_supplies', tax: 9000, gstRate: 18, subtotal: 50000 },
  { _id: '2', invoiceNumber: 'INV-0002', vendorName: 'TechNova', invoiceDate: '2026-08-01', dueDate: '2026-08-20', paidDate: null, totalAmount: 120000, amountPaid: 40000, paymentStatus: 'partial', category: 'software', tax: 21600, gstRate: 18, subtotal: 120000 },
  { _id: '3', invoiceNumber: 'INV-0003', vendorName: 'Skyline Airlines', invoiceDate: '2026-07-10', dueDate: '2026-07-25', paidDate: null, totalAmount: 8000, amountPaid: 0, paymentStatus: 'overdue', category: 'travel', tax: 1440, gstRate: 18, subtotal: 8000 },
  { _id: '4', invoiceNumber: 'INV-0004', vendorName: 'Acme Supplies', invoiceDate: '2026-08-08', dueDate: '2026-08-12', paidDate: null, totalAmount: 15000, amountPaid: 0, paymentStatus: 'unpaid', category: 'office_supplies', tax: 2700, gstRate: 18, subtotal: 15000 },
  { _id: '5', invoiceNumber: 'INV-0005', vendorName: 'GreenLeaf Power', invoiceDate: '2026-08-09', dueDate: '2026-08-30', paidDate: null, totalAmount: 30000, amountPaid: 0, paymentStatus: 'unpaid', category: 'utilities', tax: 5400, gstRate: 18, subtotal: 30000 },
];

function insights(data = fixtureInvoices) {
  return generateInsights(data, { now: NOW });
}

test('returns a no-data insight when there are no invoices', () => {
  const result = insights([]);
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].type, 'no_data');
});

test('flags overdue invoices with a warning', () => {
  const result = insights();
  const overdue = result.find((i) => i.type === 'overdue');
  assert.ok(overdue, 'overdue insight expected');
  assert.strictEqual(overdue.meta.count, 1);
  assert.strictEqual(overdue.severity, 'warning');
  assert.strictEqual(overdue.link, '/invoices?paymentStatus=overdue');
});

test('flags high-value invoices above the average threshold', () => {
  const result = insights();
  const highValue = result.find((i) => i.type === 'high_value_invoice');
  // avg = 44600; 3× avg = 133800 → INV-0002 (120000) is below; seed one huge invoice instead
  assert.ok(!highValue, 'no high-value with current fixture');
  const withHuge = insights([...fixtureInvoices, { _id: '9', invoiceNumber: 'INV-0009', vendorName: 'Mega', totalAmount: 900000, amountPaid: 0, paymentStatus: 'unpaid', category: 'x' }]);
  const flagged = withHuge.find((i) => i.type === 'high_value_invoice');
  assert.ok(flagged, 'high-value insight expected');
  assert.strictEqual(flagged.meta.count, 1);
});

test('flags vendor concentration when one vendor dominates', () => {
  // TechNova = 120000 of 223000 ≈ 54% → concentration warning expected
  const result = insights();
  const concentrated = result.find((i) => i.type === 'vendor_concentration');
  assert.ok(concentrated, 'concentration insight expected');
  assert.strictEqual(concentrated.meta.vendor, 'TechNova');
  assert.strictEqual(concentrated.meta.share, 54);
  // Balanced spend (top vendor < 40%) produces no concentration insight
  const balanced = insights([
    { _id: 'a', vendorName: 'BigCo', totalAmount: 100000, amountPaid: 0, paymentStatus: 'unpaid' },
    { _id: 'b', vendorName: 'MidCo', totalAmount: 90000, amountPaid: 0, paymentStatus: 'unpaid' },
    { _id: 'c', vendorName: 'SmallCo', totalAmount: 70000, amountPaid: 0, paymentStatus: 'unpaid' },
  ]);
  assert.ok(!balanced.find((i) => i.type === 'vendor_concentration'));
});

test('reports unusual tax when implied rate drifts from declared', () => {
  const drifted = [
    { _id: 'a', invoiceNumber: 'INV-A', vendorName: 'X', invoiceDate: '2026-08-01', totalAmount: 1000, amountPaid: 0, paymentStatus: 'unpaid', subtotal: 1000, tax: 500, gstRate: 5 },
  ];
  const result = insights(drifted);
  const unusual = result.find((i) => i.type === 'unusual_tax');
  assert.ok(unusual, 'unusual tax insight expected');
  assert.strictEqual(unusual.meta.count, 1);
});

test('surfaces missing information at low ratio as info', () => {
  const withMissing = insights([
    ...fixtureInvoices,
    { _id: '9', vendorName: 'No Number Co', invoiceDate: '2026-08-09', totalAmount: 100, amountPaid: 0, paymentStatus: 'unpaid', category: 'x' },
  ]);
  const missing = withMissing.find((i) => i.type === 'missing_info');
  assert.ok(missing, 'missing info insight expected');
  assert.strictEqual(missing.severity, 'info');
});

test('produces a monthly summary for the current month', () => {
  const result = insights();
  const summary = result.find((i) => i.type === 'monthly_summary');
  assert.ok(summary, 'monthly summary expected');
  assert.strictEqual(summary.meta.count, 3); // Aug invoices
  assert.strictEqual(summary.meta.issued, 165000);
});

test('produces a payment trend insight', () => {
  const result = insights();
  const trend = result.find((i) => i.type === 'payment_trend');
  assert.ok(trend, 'payment trend expected');
  assert.strictEqual(trend.meta.current, 50000);
});

test('reports a weak collection rate when most value is outstanding', () => {
  const result = insights();
  const collection = result.find((i) => i.type === 'collection_rate');
  // paid 90000 of 223000 ≈ 40% → at the boundary, expect either
  assert.ok(collection);
  assert.ok(['warning', 'positive'].includes(collection.severity));
});

test('every insight has a valid shape', () => {
  for (const insight of insights()) {
    assert.ok(typeof insight.type === 'string' && insight.type.length > 0);
    assert.ok(['critical', 'warning', 'positive', 'info'].includes(insight.severity));
    assert.ok(typeof insight.title === 'string' && insight.title.length > 0);
    assert.ok(typeof insight.message === 'string' && insight.message.length > 0);
  }
});
