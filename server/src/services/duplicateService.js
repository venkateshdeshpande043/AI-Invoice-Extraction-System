/**
 * Duplicate invoice detection service (pure, rule-based).
 *
 * Compares a candidate invoice against a user's existing invoices using
 * normalized invoice number, vendor, date proximity and amount similarity.
 * Returns the single best match with a confidence level and a human-readable
 * reason. Conservative by design: only well-signalled matches are flagged to
 * avoid false positives.
 */

function normalizeInvoiceNumber(str) {
  if (!str) return '';
  return String(str).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeVendor(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sameAmount(a, b, tolerancePct = 0.01) {
  if (a == null || b == null) return false;
  const base = Math.max(Math.abs(a), Math.abs(b));
  if (base === 0) return a === b;
  return Math.abs(a - b) / base <= tolerancePct;
}

function daysBetween(a, b) {
  const ms = Math.abs(new Date(a).getTime() - new Date(b).getTime());
  return ms / 86400000;
}

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 };

/**
 * @param candidate  extracted fields of the new invoice
 * @param existingInvoices  lean invoice docs belonging to the same user
 * @returns { invoiceId, invoiceNumber, confidence, reason } | null
 */
function findDuplicate(candidate, existingInvoices = []) {
  const candNum = normalizeInvoiceNumber(candidate.invoiceNumber);
  const candVendor = normalizeVendor(candidate.vendorName);
  const candAmount = Number(candidate.totalAmount) || 0;

  let best = null;

  for (const inv of existingInvoices) {
    const invNum = normalizeInvoiceNumber(inv.invoiceNumber);
    const invVendor = normalizeVendor(inv.vendorName);
    const invAmount = Number(inv.totalAmount) || 0;

    const sameNum = Boolean(candNum && invNum && candNum === invNum);
    const sameVendor = Boolean(candVendor && invVendor && candVendor === invVendor);
    const hasDates = Boolean(candidate.invoiceDate && inv.invoiceDate);
    const dateSame = hasDates && daysBetween(candidate.invoiceDate, inv.invoiceDate) <= 1;
    const dateClose = hasDates && daysBetween(candidate.invoiceDate, inv.invoiceDate) <= 60;
    const amountMatch = sameAmount(candAmount, invAmount);

    let confidence = null;
    let reason = null;

    if (sameNum && sameVendor && (amountMatch || dateClose)) {
      confidence = 'high';
      reason = `Same invoice number (${inv.invoiceNumber}) from ${inv.vendorName}`;
    } else if (sameNum && sameVendor) {
      confidence = 'medium';
      reason = `Invoice number ${inv.invoiceNumber} reused by ${inv.vendorName} with a different amount`;
    } else if (sameVendor && dateSame && amountMatch) {
      confidence = 'high';
      reason = `Same vendor, date and amount as invoice ${inv.invoiceNumber || inv._id}`;
    } else if (sameVendor && amountMatch && dateClose) {
      confidence = 'medium';
      reason = `Similar amount from ${inv.vendorName} within the last 60 days`;
    }

    if (confidence && (!best || CONFIDENCE_RANK[confidence] > CONFIDENCE_RANK[best.confidence])) {
      best = { invoiceId: inv._id, invoiceNumber: inv.invoiceNumber || null, confidence, reason };
    }
  }

  return best;
}

module.exports = { findDuplicate, normalizeInvoiceNumber, normalizeVendor, sameAmount };
