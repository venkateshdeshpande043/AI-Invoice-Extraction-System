/**
 * NLP Invoice Parsing Service
 *
 * Receives raw OCR text and extracts structured invoice fields using
 * regex patterns with fallback rules and validation.
 */

const logger = require('../config/logger');
const {
  extractWithPatterns,
  extractLineItems,
  parseAmount,
  regexPatterns,
} = require('../utils/regexPatterns');

const MONTH_NAMES = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

function parseInvoice(rawText) {
  logger.info('Parsing invoice text with NLP...');

  if (!rawText || typeof rawText !== 'string') {
    logger.warn('No text provided for NLP parsing');
    return getEmptyResult();
  }

  const text = rawText.trim();
  if (text.length === 0) return getEmptyResult();

  // Remove page break markers that could split line items
  const cleaned = text.replace(/PAGE\s+\d+\s+OF\s+\d+/gi, '').trim();

  // Extract all fields
  const invoiceNumber = extractInvoiceNumber(cleaned);
  const vendorName = extractVendorName(cleaned);
  const customerName = extractCustomerName(cleaned);
  const invoiceDate = extractDate(cleaned, 'invoiceDate');
  const dueDate = extractDueDate(cleaned, invoiceDate);
  const gstVatNumber = extractGstVatNumber(cleaned);
  const gstRate = extractGstRate(cleaned);
  const lineItems = extractLineItems(cleaned);
  const subtotal = extractSubtotal(cleaned, lineItems);
  const discount = extractDiscount(cleaned);
  const tax = extractTax(cleaned, gstRate, subtotal);
  const totalAmount = extractTotal(cleaned, subtotal, tax, lineItems);
  const currency = extractCurrency(cleaned);
  const poNumber = extractPONumber(cleaned);

  const result = {
    invoiceNumber,
    vendorName,
    customerName,
    invoiceDate,
    dueDate,
    gstVatNumber,
    gstRate,
    lineItems,
    subtotal,
    discount,
    tax,
    totalAmount,
    currency,
    poNumber,
  };

  const validated = applyValidation(result);
  logger.info(`NLP parsing complete: invoice #${validated.invoiceNumber || 'unknown'}`);
  return validated;
}

// ---------------------------------------------------------------------------
// Field Extractors
// ---------------------------------------------------------------------------

function extractInvoiceNumber(text) {
  return extractWithPatterns(text, regexPatterns.invoiceNumber) || null;
}

function extractVendorName(text) {
  const name = extractWithPatterns(text, regexPatterns.vendorName);
  if (name) return name;

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^\d+$/.test(trimmed)) continue;
    if (/^(invoice|inv|receipt|bill|page|date|due|subtotal|total|tax|gst|vat)/i.test(trimmed)) continue;
    if (/^(description|item|qty|quantity|rate|amount)/i.test(trimmed)) continue;
    const words = trimmed.split(/\s+/);
    const capitalized = words.filter((w) => /^[A-Z]/.test(w)).length;
    if (capitalized >= 2 && words.length >= 2 && words.length <= 10) return trimmed;
    if (words.length === 1 && /^[A-Z][a-z]/.test(trimmed) && trimmed.length > 5) return trimmed;
  }
  return null;
}

function extractCustomerName(text) {
  return extractWithPatterns(text, regexPatterns.customerName) || null;
}

function extractDate(text, dateType) {
  const str = extractWithPatterns(text, regexPatterns[dateType]);
  if (!str) return null;
  return parseDateString(str);
}

function extractDueDate(text, invoiceDate) {
  const str = extractWithPatterns(text, regexPatterns.dueDate);
  if (str) return parseDateString(str);

  // Check for "Due: 2024-07-15" pattern on same line as Date
  const sameLineDue = text.match(/(?:Date|Due)[:\s]+(\d{4}[-/]\d{1,2}[-/]\d{1,2})[^]*?Due[:\s]+(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i);
  if (sameLineDue) return parseDateString(sameLineDue[2]);

  const sameLineDue2 = text.match(/Date[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\s+Due[:\s]+(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i);
  if (sameLineDue2) return parseDateString(sameLineDue2[2]);

  // Net terms
  const netMatch = text.match(/\bNet\s+(\d+)\b/i);
  if (netMatch && invoiceDate) {
    const days = parseInt(netMatch[1], 10);
    if (days > 0 && days <= 365) {
      const due = new Date(invoiceDate);
      due.setDate(due.getDate() + days);
      return due;
    }
  }

  return null;
}

function extractGstVatNumber(text) {
  return extractWithPatterns(text, regexPatterns.gstVatNumber) || null;
}

function extractGstRate(text) {
  // CGST + SGST combined rate (handles "CGST @9%" / "CGST 9%" / "CGST (9%)")
  const cgstRateMatch = text.match(/(?:CGST)\s*[@(]?\s*(\d+(?:\.\d+)?)\s*%/i);
  const sgstRateMatch = text.match(/(?:SGST)\s*[@(]?\s*(\d+(?:\.\d+)?)\s*%/i);
  const cgstPct = cgstRateMatch ? parseFloat(cgstRateMatch[1]) : null;
  const sgstPct = sgstRateMatch ? parseFloat(sgstRateMatch[1]) : null;

  if (cgstPct !== null && sgstPct !== null) return cgstPct + sgstPct;
  if (cgstPct !== null) return cgstPct * 2;
  if (sgstPct !== null) return sgstPct * 2;

  // General rate pattern
  const rateStr = extractWithPatterns(text, regexPatterns.gstRate);
  if (rateStr) return parseFloat(rateStr) || null;

  return null;
}

function extractSubtotal(text, lineItems) {
  const str = extractWithPatterns(text, regexPatterns.subtotal);
  if (str) return parseAmount(str);

  if (lineItems && lineItems.length > 0) {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }

  const amountMatch = text.match(/\bAmount[:\s]+([\d,]+\.?\d*)/i);
  if (amountMatch) return parseAmount(amountMatch[1]);

  return 0;
}

function extractDiscount(text) {
  // Percentage discount: "Discount (5%): -185.00"
  const pctDiscount = text.match(/Discount\s*\([^)]*\)\s*:\s*-?\s*([\d,]+\.?\d*)/i);
  if (pctDiscount) return parseAmount(pctDiscount[1]);

  const str = extractWithPatterns(text, regexPatterns.discount);
  if (str) return parseAmount(str);

  const negMatch = text.match(/discount[:\s]*-?\s*([\d,]+\.?\d*)/i);
  if (negMatch) return parseAmount(negMatch[1]);

  return null;
}

function extractTax(text, gstRate, subtotal) {
  // Collect all tax amounts
  const amounts = [];

  // CGST + SGST amounts (sum them together)
  let cgstTotal = 0;
  let sgstTotal = 0;
  let hasCgst = false;
  let hasSgst = false;

  const cgstRe = /(?:CGST|CGST)\s*[@(]?\s*(?:\d+(?:\.\d+)?\s*%)?[:\s]*([\d,]+\.?\d*)/gi;
  let m;
  while ((m = cgstRe.exec(text)) !== null) {
    const val = parseAmount(m[1]);
    if (val > 0 && val < 1e9) { cgstTotal += val; hasCgst = true; }
  }
  const sgstRe = /(?:SGST|SGST)\s*[@(]?\s*(?:\d+(?:\.\d+)?\s*%)?[:\s]*([\d,]+\.?\d*)/gi;
  while ((m = sgstRe.exec(text)) !== null) {
    const val = parseAmount(m[1]);
    if (val > 0 && val < 1e9) { sgstTotal += val; hasSgst = true; }
  }

  if (hasCgst && hasSgst) return cgstTotal + sgstTotal;
  if (hasCgst) return cgstTotal;
  if (hasSgst) return sgstTotal;

  // IGST amount
  const igstRe = /(?:IGST)\s*[@(]?\s*(?:\d+(?:\.\d+)?\s*%)?[:\s]*([\d,]+\.?\d*)/gi;
  while ((m = igstRe.exec(text)) !== null) {
    const val = parseAmount(m[1]);
    if (val > 0 && val < 1e9) amounts.push(val);
  }

  // GST/Tax/VAT labeled amounts (with percentage, e.g., "GST (10%): 78.50")
  const taxLabelRe = /(?:Tax|GST|VAT|Sales Tax)\s*\([^)]*\)\s*[:\s]+([\d,]+\.?\d*)/gi;
  while ((m = taxLabelRe.exec(text)) !== null) {
    const val = parseAmount(m[1]);
    if (val > 0 && val < 1e9) amounts.push(val);
  }

  // VAT/TVA (European)
  const vatLabelRe = /\b(?:VAT|TVA)\s+\d+%\s*[:\s]+([\d,]+\.?\d*)/gi;
  while ((m = vatLabelRe.exec(text)) !== null) {
    const val = parseAmount(m[1]);
    if (val > 0 && val < 1e9) amounts.push(val);
  }

  // Simple "Tax:" or "Total Tax:"
  const simpleRe = /\b(?:Total Tax|Tax Amount|Tax)[:\s]+([\d,]+\.?\d*)\b/gi;
  while ((m = simpleRe.exec(text)) !== null) {
    const val = parseAmount(m[1]);
    if (val > 0 && val < 1e9 && !amounts.includes(val)) amounts.push(val);
  }

  if (amounts.length > 0) {
    return Math.max(...amounts);
  }

  // Calculate from rate + subtotal
  if (gstRate && subtotal > 0) {
    return Math.round(subtotal * (gstRate / 100) * 100) / 100;
  }

  return 0;
}

function extractTotal(text, subtotal, tax, lineItems) {
  const str = extractWithPatterns(text, regexPatterns.totalAmount);
  if (str) {
    const total = parseAmount(str);
    if (total > 0) return total;
  }

  if (subtotal > 0 || tax > 0) return (subtotal || 0) + (tax || 0);
  if (lineItems && lineItems.length > 0) {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  }
  return 0;
}

function extractCurrency(text) {
  const str = extractWithPatterns(text, regexPatterns.currency);
  if (str) {
    const upper = str.toUpperCase().trim();
    if (upper.includes('HKD')) return 'HKD';
    if (upper.includes('AUD')) return 'AUD';
    if (upper.includes('GBP') || str === '£') return 'GBP';
    if (upper.includes('EUR') || str === '€') return 'EUR';
    if (upper.includes('USD') || str === '$') return 'USD';
    if (upper.includes('INR') || /^₹$/.test(str) || /^Rs\.?$/.test(str)) return 'INR';
  }

  // Check text for currency codes and symbols
  if (/\bEUR\b/i.test(text) || /[€]/.test(text)) return 'EUR';
  if (/\bGBP\b/i.test(text) || /[£]/.test(text)) return 'GBP';
  if (/\bHKD\b/i.test(text)) return 'HKD';
  if (/\bAUD\b/i.test(text)) return 'AUD';
  if (/\bUSD\b/i.test(text) || /[$]/.test(text)) return 'USD';
  if (/\bINR\b/i.test(text) || /[₹]/.test(text) || /Rs\./.test(text)) return 'INR';

  // European decimal format (3.505,00 / 701,00) implies EUR
  if (/\d{1,3}(?:\.\d{3})+(?:,\d+)?/.test(text) || /\b\d+,\d{2}\b/.test(text)) return 'EUR';

  // VAT registration country prefix (EU member states → EUR, GB → GBP)
  const vatCountry = text.match(/\bVAT\s*(?:No\.?|Number|Registration|Reg\.?|ID)?\s*[:#]?\s*(GB|DE|FR|IT|ES|NL|BE|AT|PT|FI|IE|LU)\b/i);
  if (vatCountry) return vatCountry[1].toUpperCase() === 'GB' ? 'GBP' : 'EUR';

  return 'INR';
}

function extractPONumber(text) {
  return extractWithPatterns(text, regexPatterns.poNumber) || null;
}

// ---------------------------------------------------------------------------
// Date Parsing
// ---------------------------------------------------------------------------

function parseDateString(str) {
  if (!str) return null;
  try {
    const cleaned = str.trim();
    let match;

    // DD.MM.YYYY (European)
    match = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      const d = parseInt(match[1], 10), m = parseInt(match[2], 10), y = parseInt(match[3], 10);
      if (isValidDate(y, m, d)) return new Date(y, m - 1, d);
    }

    // DD/MM/YYYY
    match = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (match) {
      const d = parseInt(match[1], 10), m = parseInt(match[2], 10), y = parseInt(match[3], 10);
      if (isValidDate(y, m, d)) return new Date(y, m - 1, d);
    }

    // YYYY-MM-DD
    match = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (match) {
      const y = parseInt(match[1], 10), m = parseInt(match[2], 10), d = parseInt(match[3], 10);
      if (isValidDate(y, m, d)) return new Date(y, m - 1, d);
    }

    // DD/MM/YY
    match = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
    if (match) {
      let d = parseInt(match[1], 10), m = parseInt(match[2], 10), y = parseInt(match[3], 10);
      y += y < 50 ? 2000 : 1900;
      if (isValidDate(y, m, d)) return new Date(y, m - 1, d);
    }

    // Month DD, YYYY
    match = cleaned.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})$/);
    if (match) {
      const mn = match[1].toLowerCase().substring(0, 3);
      const month = MONTH_NAMES[mn];
      const d = parseInt(match[2], 10), y = parseInt(match[3], 10);
      if (month !== undefined && isValidDate(y, month + 1, d)) return new Date(y, month, d);
    }

    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) return parsed;
    return null;
  } catch {
    return null;
  }
}

function isValidDate(year, month, day) {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function applyValidation(result) {
  const v = { ...result };

  const now = new Date();
  if (v.invoiceDate && v.invoiceDate > now) {
    logger.warn(`Invoice date ${v.invoiceDate.toISOString()} is in the future`);
  }

  if (v.invoiceDate && (v.invoiceDate.getFullYear() < 1900 || v.invoiceDate.getFullYear() > 2100)) v.invoiceDate = null;
  if (v.dueDate && (v.dueDate.getFullYear() < 1900 || v.dueDate.getFullYear() > 2100)) v.dueDate = null;

  if (v.invoiceDate && v.dueDate && v.dueDate < v.invoiceDate) {
    const fixedDue = trySwapDate(v.dueDate);
    if (fixedDue && fixedDue > v.invoiceDate) v.dueDate = fixedDue;
  }

  for (const field of ['subtotal', 'tax', 'totalAmount', 'discount']) {
    if (v[field] !== null && v[field] < 0) v[field] = 0;
    if (v[field] !== null && v[field] > 1e12) v[field] = 0;
  }

  if (v.gstRate !== null && (v.gstRate < 0 || v.gstRate > 100)) v.gstRate = null;

  for (const field of ['vendorName', 'customerName']) {
    if (v[field]) {
      v[field] = v[field].replace(/\s*,\s*[A-Za-z\s]+\s+\d{3,}.*$/, '').trim();
      if (v[field].length > 100) v[field] = v[field].substring(0, 100);
    }
  }

  return v;
}

function trySwapDate(date) {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  if (isValidDate(year, day, month + 1)) return new Date(year, day - 1, month + 1);
  return null;
}

function getEmptyResult() {
  return {
    invoiceNumber: null,
    vendorName: null,
    customerName: null,
    invoiceDate: null,
    dueDate: null,
    gstVatNumber: null,
    gstRate: null,
    lineItems: [],
    subtotal: 0,
    discount: null,
    tax: 0,
    totalAmount: 0,
    currency: 'INR',
    poNumber: null,
  };
}

module.exports = { parseInvoice, parseDate: parseDateString };
