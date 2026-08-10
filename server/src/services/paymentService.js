/**
 * Payment & due-date tracking service.
 *
 * Payment status is derived, not free-form:
 *   paid    — amountPaid covers the total amount
 *   overdue — the due date has passed and the invoice is not fully paid
 *   partial — some payment recorded, due date not yet passed
 *   unpaid  — nothing recorded
 *
 * A payment history (payments[]) is maintained alongside the denormalized
 * amountPaid/paidDate/paymentMethod fields. applyPayment() keeps the two in
 * sync: a larger running total appends the delta as a new payment entry, and
 * a smaller running total is treated as an explicit manual correction.
 */

const { roundMoney } = require('../utils/helpers');

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function computePaymentStatus({ totalAmount = 0, amountPaid = 0, dueDate = null, now = new Date() }) {
  const total = Number(totalAmount) || 0;
  const paid = Number(amountPaid) || 0;

  if (total > 0 && paid >= total - 0.005) return 'paid';
  if (total > 0 && dueDate && new Date(dueDate).getTime() < startOfDay(now).getTime()) return 'overdue';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

function applyPaymentStatus(doc) {
  doc.paymentStatus = computePaymentStatus({
    totalAmount: doc.totalAmount,
    amountPaid: doc.amountPaid,
    dueDate: doc.dueDate,
  });
  return doc;
}

/**
 * Bulk-refresh overdue/unpaid states for one user. Runs cheaply before list
 * and stats queries so the stored value always matches the current date.
 */
async function refreshOverdueStatuses(userId) {
  const Invoice = require('../models/Invoice');
  const threshold = startOfDay();

  await Invoice.updateMany(
    { uploadedBy: userId, dueDate: { $lt: threshold }, paymentStatus: { $in: ['unpaid', 'partial'] } },
    { $set: { paymentStatus: 'overdue' } }
  );

  await Invoice.updateMany(
    { uploadedBy: userId, dueDate: { $gte: threshold }, paymentStatus: 'overdue' },
    { $set: { paymentStatus: 'unpaid' } }
  );
}

function paymentsTotal(payments = []) {
  return roundMoney(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
}

/**
 * Record the new running total paid against a document, keeping payments[]
 * and the denormalized fields consistent. `amount` is the absolute running
 * total (not a delta).
 */
function applyPayment(doc, { amount, date = null, method = null }) {
  const running = roundMoney(amount);
  const existing = Array.isArray(doc.payments) ? [...doc.payments] : [];
  const delta = roundMoney(running - paymentsTotal(existing));

  if (delta > 0.004) {
    existing.push({ amount: delta, date: date ? new Date(date) : new Date(), method: method || 'other' });
  } else if (delta < -0.004) {
    // Manual downward correction: rebuild the history from a single entry.
    existing.length = 0;
    existing.push({ amount: running, date: date ? new Date(date) : new Date(), method: method || 'other' });
  }

  const last = existing.length ? existing[existing.length - 1] : null;
  doc.payments = existing;
  doc.amountPaid = paymentsTotal(existing);
  if (date) doc.paidDate = new Date(date);
  else if (last && last.date) doc.paidDate = new Date(last.date);
  if (method) doc.paymentMethod = method;
  else if (last && last.method) doc.paymentMethod = last.method;
  return doc;
}

function clearPayments(doc) {
  doc.payments = [];
  doc.amountPaid = 0;
  doc.paidDate = null;
  return doc;
}

module.exports = {
  startOfDay,
  computePaymentStatus,
  applyPaymentStatus,
  refreshOverdueStatuses,
  paymentsTotal,
  applyPayment,
  clearPayments,
};
