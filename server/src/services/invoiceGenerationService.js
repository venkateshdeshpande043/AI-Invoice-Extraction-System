/**
 * Invoice generation service (Phase F).
 *
 * Pure, rule-based helpers used by the /api/invoices/generate endpoint:
 *   - computeTotals()          — derives subtotal / tax / discount / grand total
 *                                server-side so client-sent totals are never trusted
 *   - suggestInvoiceNumber()   — next INV-XXXXX for a user
 *   - normalizeInput()         — turns a raw request body into a clean document
 *                                shape ready for Invoice.create()
 *
 * Everything here is side-effect free so it can be unit tested without a DB.
 */

const { roundMoney } = require('../utils/helpers');

/** Amount for one line item — explicit value wins, otherwise qty × rate. */
function computeLineItemAmount(quantity, unitPrice, explicitAmount) {
  if (explicitAmount !== null && explicitAmount !== undefined && explicitAmount !== '') {
    return roundMoney(Number(explicitAmount) || 0);
  }
  return roundMoney((Number(quantity) || 0) * (Number(unitPrice) || 0));
}

/**
 * Recompute every financial figure from the raw line items.
 * @param {Object} input { lineItems, taxRate, taxAmount, discount }
 * @returns {{ lineItems, subtotal, tax, discount, totalAmount }}
 */
function computeTotals({ lineItems = [], taxRate = null, taxAmount = null, discount = null }) {
  const items = (Array.isArray(lineItems) ? lineItems : []).map((item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return {
      description: String(item.description || '').trim(),
      quantity,
      unitPrice,
      amount: computeLineItemAmount(quantity, unitPrice, item.amount),
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));

  // Tax is explicit (taxAmount) when provided, else derived from the rate.
  let tax = 0;
  if (taxAmount !== null && taxAmount !== undefined && taxAmount !== '') {
    tax = roundMoney(Number(taxAmount) || 0);
  } else if (taxRate !== null && taxRate !== undefined && taxRate !== '') {
    tax = roundMoney((subtotal * (Number(taxRate) || 0)) / 100);
  }

  const discountNum =
    discount === null || discount === undefined || discount === '' ? 0 : roundMoney(Number(discount) || 0);

  const totalAmount = roundMoney(subtotal + tax - discountNum);

  return { lineItems: items, subtotal, tax, discount: discountNum, totalAmount };
}

/**
 * Suggest the next sequential invoice number (INV-00001 style) for a user,
 * based on their existing invoice numbers. Falls back to the max numeric
 * suffix found in any invoice number.
 */
function suggestInvoiceNumber(existingNumbers = []) {
  let maxSeq = 0;
  for (const raw of (existingNumbers || []).filter(Boolean)) {
    const str = String(raw).trim();
    const match = str.match(/^INV-?(\d+)$/i) || str.match(/(\d+)\s*$/);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!Number.isNaN(seq)) maxSeq = Math.max(maxSeq, seq);
    }
  }
  return `INV-${String(maxSeq + 1).padStart(5, '0')}`;
}

function toDateOrNull(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function cleanText(value, maxLength = 2000) {
  return value == null ? '' : String(value).trim().slice(0, maxLength);
}

/**
 * Normalize a raw generate-invoice request body into a document shape.
 * All monetary values are recomputed; invalid dates become null.
 */
function normalizeInput(input = {}) {
  const lineItems = Array.isArray(input.lineItems) ? input.lineItems : [];
  const totals = computeTotals({
    lineItems,
    taxRate: input.taxRate,
    taxAmount: input.taxAmount,
    discount: input.discount,
  });

  const seller = {
    name: cleanText(input.seller?.name, 200),
    address: cleanText(input.seller?.address, 500),
    phone: cleanText(input.seller?.phone, 60),
    email: cleanText(input.seller?.email, 120),
    gstVatNumber: cleanText(input.seller?.gstVatNumber, 40),
  };

  const hasSeller = Object.values(seller).some(Boolean);

  return {
    seller: hasSeller ? seller : undefined,
    customerName: cleanText(input.customerName, 200) || null,
    customerGstin: cleanText(input.customerGstin, 40) || null,
    invoiceNumber: cleanText(input.invoiceNumber, 60) || null,
    invoiceDate: toDateOrNull(input.invoiceDate),
    dueDate: toDateOrNull(input.dueDate),
    poNumber: cleanText(input.poNumber, 60) || null,
    gstRate: input.gstRate === null || input.gstRate === undefined || input.gstRate === ''
      ? null
      : Number(input.gstRate),
    notes: cleanText(input.notes, 1000) || null,
    paymentTerms: cleanText(input.paymentTerms, 300) || null,
    template: ['classic', 'minimal'].includes(input.template) ? input.template : 'classic',
    currency: cleanText(input.currency, 8).toUpperCase() || 'INR',
    lineItems: totals.lineItems,
    subtotal: totals.subtotal,
    tax: totals.tax,
    discount: totals.discount,
    totalAmount: totals.totalAmount,
  };
}

module.exports = {
  computeLineItemAmount,
  computeTotals,
  suggestInvoiceNumber,
  normalizeInput,
};
