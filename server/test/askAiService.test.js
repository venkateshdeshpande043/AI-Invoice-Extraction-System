const { test } = require('node:test');
const assert = require('node:assert');

const { detectIntent, parseAmount, answerQuestion } = require('../src/services/askAiService');

const NOW = new Date('2026-08-10T12:00:00');

const fixtureInvoices = [
  { _id: '1', invoiceNumber: 'INV-0001', vendorName: 'Acme Supplies', invoiceDate: '2026-07-20', dueDate: '2026-08-05', paidDate: '2026-08-01', totalAmount: 50000, amountPaid: 50000, currency: 'INR', paymentStatus: 'paid', category: 'office_supplies', tax: 9000, gstRate: 18, subtotal: 50000 },
  { _id: '2', invoiceNumber: 'INV-0002', vendorName: 'TechNova', invoiceDate: '2026-08-01', dueDate: '2026-08-20', paidDate: null, totalAmount: 120000, amountPaid: 40000, currency: 'INR', paymentStatus: 'partial', category: 'software', tax: 21600, gstRate: 18, subtotal: 120000 },
  { _id: '3', invoiceNumber: 'INV-0003', vendorName: 'Skyline Airlines', invoiceDate: '2026-07-10', dueDate: '2026-07-25', paidDate: null, totalAmount: 8000, amountPaid: 0, currency: 'INR', paymentStatus: 'overdue', category: 'travel', tax: 1440, gstRate: 18, subtotal: 8000 },
  { _id: '4', invoiceNumber: 'INV-0004', vendorName: 'Acme Supplies', invoiceDate: '2026-08-08', dueDate: '2026-08-12', paidDate: null, totalAmount: 15000, amountPaid: 0, currency: 'INR', paymentStatus: 'unpaid', category: 'office_supplies', tax: 2700, gstRate: 18, subtotal: 15000 },
  { _id: '5', invoiceNumber: 'INV-0005', vendorName: 'GreenLeaf Power', invoiceDate: '2026-08-09', dueDate: '2026-08-30', paidDate: null, totalAmount: 30000, amountPaid: 0, currency: 'INR', paymentStatus: 'unpaid', category: 'utilities', tax: 5400, gstRate: 18, subtotal: 30000 },
];

function ask(question) {
  return answerQuestion(question, fixtureInvoices, { now: NOW });
}

// ── intent detection ──────────────────────────────────────────────

test('detectIntent classifies each supported question', () => {
  assert.strictEqual(detectIntent('How much money is outstanding?').intent, 'outstanding_total');
  assert.strictEqual(detectIntent('Which invoices are overdue?').intent, 'overdue_invoices');
  assert.strictEqual(detectIntent('Which invoices are due this week?').intent, 'due_this_week');
  assert.strictEqual(detectIntent('Which vendor has the highest invoice amount?').intent, 'top_vendor');
  assert.strictEqual(detectIntent('How much GST did I pay this month?').intent, 'gst_period');
  assert.strictEqual(detectIntent('What was my total invoice value this month?').intent, 'total_this_month');
  assert.strictEqual(detectIntent('How much have I paid this month?').intent, 'paid_this_month');
  assert.strictEqual(detectIntent('How many invoices do I have?').intent, 'invoice_count');
  assert.strictEqual(detectIntent('What is the largest invoice?').intent, 'largest_invoice');
  assert.strictEqual(detectIntent('How many vendors do I deal with?').intent, 'vendor_count');
  assert.strictEqual(detectIntent('What is my spending by category?').intent, 'category_breakdown');
  assert.strictEqual(detectIntent('What is my average invoice amount?').intent, 'average_invoice');
  assert.strictEqual(detectIntent('Which invoices are unpaid?').intent, 'unpaid_invoices');
  assert.strictEqual(detectIntent('How does this month compare to last month?').intent, 'month_comparison');
  assert.strictEqual(detectIntent('Show invoices above ₹50,000.').intent, 'invoices_above');
});

test('detectIntent extracts amounts from questions', () => {
  const detected = detectIntent('Show invoices above ₹50,000.');
  assert.strictEqual(detected.intent, 'invoices_above');
  assert.strictEqual(detected.params.amount, 50000);
});

test('detectIntent falls back for unknown questions', () => {
  assert.strictEqual(detectIntent('What is the meaning of life?').intent, 'fallback');
});

// ── amount parsing ────────────────────────────────────────────────

test('parseAmount handles Indian and western formats', () => {
  assert.strictEqual(parseAmount('₹50,000'), 50000);
  assert.strictEqual(parseAmount('50000'), 50000);
  assert.strictEqual(parseAmount('1.5 lakh'), 150000);
  assert.strictEqual(parseAmount('2 cr'), 20000000);
  assert.strictEqual(parseAmount('25k'), 25000);
  assert.strictEqual(parseAmount('no number here'), null);
});

// ── answers against fixture data ──────────────────────────────────

test('outstanding total is the sum of unpaid balances', () => {
  const res = ask('How much money is outstanding?');
  assert.strictEqual(res.intent, 'outstanding_total');
  // balances: 0 (paid) + 80000 + 8000 + 15000 + 30000 = 133000
  assert.strictEqual(res.data.total, 133000);
  assert.match(res.answer, /1,33,000/);
});

test('overdue invoices lists only overdue documents', () => {
  const res = ask('Which invoices are overdue?');
  assert.strictEqual(res.intent, 'overdue_invoices');
  assert.strictEqual(res.data.count, 1);
  assert.strictEqual(res.data.invoices[0].invoiceNumber, 'INV-0003');
});

test('due this week returns invoices with upcoming due dates', () => {
  const res = ask('Which invoices are due this week?');
  assert.strictEqual(res.intent, 'due_this_week');
  // due between now (Aug 10) and Aug 17: INV-0004 (Aug 12)
  assert.strictEqual(res.data.count, 1);
  assert.strictEqual(res.data.invoices[0].invoiceNumber, 'INV-0004');
});

test('top vendor returns the highest-spend vendor', () => {
  const res = ask('Which vendor has the highest invoice amount?');
  assert.strictEqual(res.intent, 'top_vendor');
  assert.strictEqual(res.data.top, 'TechNova');
  assert.strictEqual(res.data.spend, 120000);
});

test('invoices above a threshold filters by totalAmount', () => {
  const res = ask('Show invoices above ₹50,000.');
  assert.strictEqual(res.intent, 'invoices_above');
  assert.deepStrictEqual(
    res.data.invoices.map((inv) => inv.invoiceNumber),
    ['INV-0002']
  );
});

test('invoices below a threshold filters correctly', () => {
  const res = ask('Show invoices below ₹10,000.');
  assert.strictEqual(res.intent, 'invoices_below');
  assert.deepStrictEqual(
    res.data.invoices.map((inv) => inv.invoiceNumber),
    ['INV-0003']
  );
});

test('GST this month sums tax for August invoices', () => {
  const res = ask('How much GST did I pay this month?');
  assert.strictEqual(res.intent, 'gst_period');
  // August invoices: INV-0002 (21600) + INV-0004 (2700) + INV-0005 (5400) = 29700
  assert.strictEqual(res.data.tax, 29700);
  assert.match(res.answer, /29,700/);
});

test('total invoice value this month sums August totals', () => {
  const res = ask('What was my total invoice value this month?');
  assert.strictEqual(res.intent, 'total_this_month');
  // 120000 + 15000 + 30000 = 165000
  assert.strictEqual(res.data.total, 165000);
});

test('paid this month uses paidDate in the current month', () => {
  const res = ask('How much have I paid this month?');
  assert.strictEqual(res.intent, 'paid_this_month');
  // INV-0001 paid on Aug 1 → 50000
  assert.strictEqual(res.data.total, 50000);
});

test('invoice count returns the total number of documents', () => {
  const res = ask('How many invoices do I have?');
  assert.strictEqual(res.data.count, 5);
});

test('largest invoice finds the highest total', () => {
  const res = ask('What is the largest invoice?');
  assert.strictEqual(res.intent, 'largest_invoice');
  assert.strictEqual(res.data.invoice.invoiceNumber, 'INV-0002');
});

test('category breakdown aggregates spend per category', () => {
  const res = ask('What is my spending by category?');
  assert.strictEqual(res.intent, 'category_breakdown');
  const software = res.data.rows.find((r) => r.category === 'software');
  assert.strictEqual(software.amount, 120000);
});

test('unpaid invoices lists documents with no payment', () => {
  const res = ask('Which invoices are unpaid?');
  assert.strictEqual(res.intent, 'unpaid_invoices');
  assert.strictEqual(res.data.count, 2);
});

test('month comparison compares August vs July totals', () => {
  const res = ask('How does this month compare to last month?');
  assert.strictEqual(res.intent, 'month_comparison');
  // July: 50000 + 8000 = 58000; Aug: 165000
  assert.strictEqual(res.data.current, 165000);
  assert.strictEqual(res.data.previous, 58000);
  assert.match(res.answer, /up/);
});

test('status breakdown counts each payment status', () => {
  const res = ask('What is my payment status breakdown?');
  assert.strictEqual(res.intent, 'status_breakdown');
  assert.deepStrictEqual(res.data, { paid: 1, partial: 1, unpaid: 2, overdue: 1 });
});

test('fallback suggests helpful sample questions', () => {
  const res = ask('Tell me a joke.');
  assert.strictEqual(res.intent, 'fallback');
  assert.ok(Array.isArray(res.suggestions) && res.suggestions.length > 0);
});

test('every answer carries an intent, answer and suggestions', () => {
  const questions = [
    'How much money is outstanding?',
    'Which invoices are overdue?',
    'Which invoices are due this week?',
    'Which vendor has the highest invoice amount?',
    'How much GST did I pay this month?',
    'Show invoices above ₹50,000.',
    'What was my total invoice value this month?',
    'How much have I paid this month?',
  ];
  for (const question of questions) {
    const res = ask(question);
    assert.ok(res.intent, `intent for "${question}"`);
    assert.ok(typeof res.answer === 'string' && res.answer.length > 0, `answer for "${question}"`);
    assert.ok(Array.isArray(res.suggestions), `suggestions for "${question}"`);
  }
});
