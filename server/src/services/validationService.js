/**
 * Validation service (Phase E) — rule-based intelligence layer.
 *
 * Validates extracted invoice data against cross-field rules and returns:
 *   { status, issues }
 *
 * status ∈ 'valid' | 'warning' | 'anomaly' | 'error'
 *   - error   — critical problems (missing key fields, negative totals, due < invoice)
 *   - anomaly — highly suspicious values (total mismatch, absurd tax)
 *   - warning — needs review (line item math, tax rate drift, GST format)
 *   - valid   — all checks passed
 *
 * issue: { code, severity, field, message }
 * Severities mirror the status vocabulary so UIs can style them directly.
 */

const MONTH_NAMES = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function toNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isIndianGstin(str) {
  return /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])$/.test(str);
}

function isEuVat(str) {
  return /^[A-Z]{2}[0-9]{9,12}$/.test(str);
}

function isTodayOrFuture(date) {
  const now = new Date();
  return date > now;
}

/**
 * Validate an extracted invoice.
 * @param {Object} invoice — { invoiceNumber, vendorName, invoiceDate, dueDate,
 *   gstVatNumber, gstRate, lineItems, subtotal, tax, discount, totalAmount }
 * @returns {{ status: string, issues: Array }}
 */
function validateInvoice(invoice = {}) {
  const issues = [];
  const add = (code, severity, field, message) =>
    issues.push({ code, severity, field, message });

  const {
    invoiceNumber,
    vendorName,
    invoiceDate,
    dueDate,
    gstVatNumber,
    gstRate,
    lineItems = [],
  } = invoice;

  const subtotal = toNumber(invoice.subtotal);
  const tax = toNumber(invoice.tax);
  const discount = toNumber(invoice.discount);
  const totalAmount = toNumber(invoice.totalAmount);
  const parsedInvoiceDate = toDate(invoiceDate);
  const parsedDueDate = toDate(dueDate);
  const declaredRate = gstRate === null || gstRate === undefined || gstRate === ''
    ? null
    : toNumber(gstRate);

  // ── 1. Missing critical fields ─────────────────────────────
  if (!invoiceNumber) add('missing_invoice_number', 'error', 'invoiceNumber', 'Invoice number is missing');
  if (!vendorName) add('missing_vendor_name', 'error', 'vendorName', 'Vendor name is missing');
  if (!parsedInvoiceDate) add('missing_invoice_date', 'error', 'invoiceDate', 'Invoice date is missing');
  if (!parsedDueDate) add('missing_due_date', 'info', 'dueDate', 'Due date is missing — overdue tracking unavailable');

  // ── 2. Date consistency ────────────────────────────────────
  if (parsedInvoiceDate && parsedDueDate && parsedDueDate < parsedInvoiceDate) {
    add('due_before_invoice', 'error', 'dueDate', 'Due date is before the invoice date');
  }
  if (parsedInvoiceDate && isTodayOrFuture(parsedInvoiceDate)) {
    add('date_in_future', 'warning', 'invoiceDate', 'Invoice date is in the future');
  }

  // ── 3. Line item arithmetic ────────────────────────────────
  let lineItemsSum = 0;
  for (const [idx, item] of (lineItems || []).entries()) {
    const qty = toNumber(item.quantity);
    const unitPrice = toNumber(item.unitPrice);
    const amount = toNumber(item.amount);
    const expected = Math.round(qty * unitPrice * 100) / 100;
    if (Math.abs(expected - amount) > 0.01) {
      add(
        'line_item_calc',
        'warning',
        `lineItems[${idx}]`,
        `Line item "${item.description || `#${idx + 1}`}" amount (${amount}) does not match qty × rate (${expected})`
      );
    }
    lineItemsSum += amount;
  }
  lineItemsSum = Math.round(lineItemsSum * 100) / 100;

  if (lineItems.length > 0 && Math.abs(lineItemsSum - subtotal) > 0.01) {
    add(
      'line_items_vs_subtotal',
      'warning',
      'subtotal',
      `Sum of line items (${lineItemsSum}) does not match the subtotal (${subtotal})`
    );
  }

  // ── 4. Total consistency: subtotal + tax − discount ≈ total ──
  const expectedTotal = Math.round((subtotal + tax - discount) * 100) / 100;
  if (totalAmount !== 0 || expectedTotal !== 0) {
    if (Math.abs(expectedTotal - totalAmount) > 0.5) {
      add(
        'total_mismatch',
        'anomaly',
        'totalAmount',
        `Total (${totalAmount}) does not equal subtotal + tax − discount (${expectedTotal})`
      );
    }
  }

  // ── 5. Tax sanity ──────────────────────────────────────────
  const impliedRate = subtotal > 0 ? (tax / subtotal) * 100 : 0;
  if (subtotal > 0 && impliedRate > 40) {
    add(
      'tax_unusually_high',
      'anomaly',
      'tax',
      `Implied tax rate ${impliedRate.toFixed(1)}% is unusually high`
    );
  }
  if (declaredRate !== null && subtotal > 0 && Math.abs(impliedRate - declaredRate) > 1) {
    add(
      'tax_rate_mismatch',
      'warning',
      'tax',
      `Declared rate ${declaredRate}% does not match the implied rate ${impliedRate.toFixed(1)}%`
    );
  }

  // ── 6. GST / VAT format ────────────────────────────────────
  if (gstVatNumber && !isIndianGstin(String(gstVatNumber).trim()) && !isEuVat(String(gstVatNumber).trim())) {
    add('gst_format', 'warning', 'gstVatNumber', 'GST/VAT number does not match a recognised format');
  }

  // ── 7. Suspicious values ───────────────────────────────────
  if (totalAmount < 0) {
    add('negative_total', 'error', 'totalAmount', 'Total amount is negative');
  }
  if (subtotal > 0 && discount > subtotal) {
    add('discount_exceeds_subtotal', 'anomaly', 'discount', 'Discount exceeds the subtotal');
  }

  // ── Status: error > anomaly > warning > valid ─────────────
  let status = 'valid';
  if (issues.some((i) => i.severity === 'error')) status = 'error';
  else if (issues.some((i) => i.severity === 'anomaly')) status = 'anomaly';
  else if (issues.some((i) => i.severity === 'warning')) status = 'warning';

  return { status, issues };
}

module.exports = { validateInvoice, MONTH_NAMES };
