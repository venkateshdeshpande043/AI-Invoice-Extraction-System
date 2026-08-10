const { test } = require('node:test');
const assert = require('node:assert');

const { computePaymentStatus, startOfDay, applyPayment, clearPayments, paymentsTotal } = require('../src/services/paymentService');

const NOW = new Date('2026-08-09T12:00:00');

test('startOfDay normalizes to midnight', () => {
  const sod = startOfDay(new Date('2026-08-09T23:59:59'));
  assert.strictEqual(sod.getHours(), 0);
  assert.strictEqual(sod.getMinutes(), 0);
});

test('unpaid when due date is in the future', () => {
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 1000, amountPaid: 0, dueDate: '2026-09-01', now: NOW }),
    'unpaid'
  );
});

test('overdue when due date has passed and nothing paid', () => {
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 1000, amountPaid: 0, dueDate: '2026-07-01', now: NOW }),
    'overdue'
  );
});

test('overdue wins over partial when due date has passed', () => {
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 1000, amountPaid: 400, dueDate: '2026-07-01', now: NOW }),
    'overdue'
  );
});

test('partial when partially paid and not yet due', () => {
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 1000, amountPaid: 400, dueDate: '2026-09-01', now: NOW }),
    'partial'
  );
});

test('paid when amount covers the total exactly', () => {
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 1000, amountPaid: 1000, dueDate: '2026-07-01', now: NOW }),
    'paid'
  );
});

test('paid when amount exceeds the total', () => {
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 1000, amountPaid: 1100, dueDate: '2026-07-01', now: NOW }),
    'paid'
  );
});

test('not overdue when total amount is unknown (0)', () => {
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 0, amountPaid: 0, dueDate: '2026-07-01', now: NOW }),
    'unpaid'
  );
});

test('partial when total is unknown but a payment was recorded', () => {
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 0, amountPaid: 250, dueDate: '2026-07-01', now: NOW }),
    'partial'
  );
});

test('due today is not yet overdue (start-of-day boundary)', () => {
  const today = startOfDay(NOW).toISOString();
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 500, amountPaid: 0, dueDate: today, now: NOW }),
    'unpaid'
  );
});

test('float tolerance marks a near-full payment as paid', () => {
  assert.strictEqual(
    computePaymentStatus({ totalAmount: 1000, amountPaid: 999.996, dueDate: '2026-07-01', now: NOW }),
    'paid'
  );
});

test('paymentsTotal sums entries and rounds', () => {
  assert.strictEqual(paymentsTotal([{ amount: 100.005 }, { amount: 200 }]), 300.01);
  assert.strictEqual(paymentsTotal([]), 0);
});

test('applyPayment appends the delta as a payment entry', () => {
  const doc = { payments: [{ amount: 300, date: '2026-08-01', method: 'bank_transfer' }], amountPaid: 300 };
  applyPayment(doc, { amount: 700, date: '2026-08-09', method: 'upi' });
  assert.strictEqual(doc.payments.length, 2);
  assert.strictEqual(doc.payments[1].amount, 400);
  assert.strictEqual(doc.amountPaid, 700);
  assert.strictEqual(doc.paidDate.toISOString().slice(0, 10), '2026-08-09');
  assert.strictEqual(doc.paymentMethod, 'upi');
});

test('applyPayment with equal running total adds no entry', () => {
  const doc = { payments: [{ amount: 500, date: '2026-08-01', method: 'cash' }], amountPaid: 500 };
  applyPayment(doc, { amount: 500 });
  assert.strictEqual(doc.payments.length, 1);
  assert.strictEqual(doc.amountPaid, 500);
});

test('applyPayment downward correction rebuilds history', () => {
  const doc = { payments: [{ amount: 500, date: '2026-08-01', method: 'cash' }], amountPaid: 500 };
  applyPayment(doc, { amount: 200, date: '2026-08-09', method: 'bank_transfer' });
  assert.strictEqual(doc.payments.length, 1);
  assert.strictEqual(doc.payments[0].amount, 200);
  assert.strictEqual(doc.amountPaid, 200);
});

test('applyPayment on a fresh doc records the first payment', () => {
  const doc = { payments: [], amountPaid: 0 };
  applyPayment(doc, { amount: 250, date: '2026-08-09', method: 'cheque' });
  assert.strictEqual(doc.payments.length, 1);
  assert.strictEqual(doc.payments[0].amount, 250);
  assert.strictEqual(doc.amountPaid, 250);
});

test('clearPayments resets history and denormalized fields', () => {
  const doc = {
    payments: [{ amount: 500, date: '2026-08-01', method: 'cash' }],
    amountPaid: 500,
    paidDate: new Date('2026-08-01'),
    paymentMethod: 'cash',
  };
  clearPayments(doc);
  assert.deepStrictEqual(doc.payments, []);
  assert.strictEqual(doc.amountPaid, 0);
  assert.strictEqual(doc.paidDate, null);
});
