/**
 * Comprehensive regex patterns for invoice field extraction.
 *
 * Each field has an array of patterns tried in order.
 * The first match wins.
 */

const regexPatterns = {
  // ---------------------------------------------------------------------------
  // Invoice Number
  // ---------------------------------------------------------------------------
  invoiceNumber: [
    // INV/INVOICE followed by separator and alphanumeric code (must contain a digit)
    /\b(?:INVOICE|INV|Rechnung)\s*(?:NO|NUMBER|NO\.|#|\.)?\s*[:#]?\s*(?=\S*\d)([A-Z][\w/-]{2,40})\b/i,
    // "Invoice Number:" or "Invoice:" with a code that has a digit
    /(?:Invoice|Inv)\s*(?:Number|No|#)?\s*[:#]?\s*(?=\S*\d)([A-Z][\w/-]{1,40})\b/i,
    // INV-XXXX anywhere — INV followed by dash/slash and content with digits
    /\b(INV[-/]\d[\w/-]*|INV[-/][A-Z]+[\w/-]*\d)\b/i,
    // 2-5 uppercase letters, dash, mix of letters/digits, dash, digits: GS-EU-2024-331
    /\b([A-Z]{2,5}[-/](?:[A-Z0-9]{2,6}[-/])?\d{2,4}[-/]\d{3,})\b/,
    // 2-5 uppercase letters, dash, 2-6 digits, standalone
    /(?:^|\s)([A-Z]{2,5}-\d{2,6})(?:$|\s)/,
  ],

  // ---------------------------------------------------------------------------
  // Vendor Name (Seller)
  // ---------------------------------------------------------------------------
  vendorName: [
    /(?:Bill From|Billed From|From|Seller|Vendor|Supplier|Sold By)[:\s]+([A-Za-z0-9.,&' -]{3,60})/im,
    /(?:Company|Business|Organization)[:\s]+([A-Za-z0-9.,&' -]{3,60})/im,
    // Fallback: first significant capitalized line after header
  ],

  // ---------------------------------------------------------------------------
  // Invoice Date
  // ---------------------------------------------------------------------------
  invoiceDate: [
    /(?:Invoice Date|Date of Invoice|Invoice Dt|Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /(?:Invoice Date|Date of Invoice|Invoice Dt|Date)[:\s]*([A-Za-z]+ \d{1,2},?\s*\d{4})/i,
    /(?:Invoice Date|Date of Invoice|Invoice Dt|Date)[:\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
    // DD.MM.YYYY format (European)
    /(?:Invoice Date|Date of Invoice|Invoice Dt|Date)[:\s]*(\d{1,2}\.\d{1,2}\.\d{4})/i,
  ],

  // ---------------------------------------------------------------------------
  // Due Date
  // ---------------------------------------------------------------------------
  dueDate: [
    /(?:Due Date|Payment Due|Due On|Due By)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /(?:Due Date|Payment Due|Due On|Due By)[:\s]*([A-Za-z]+ \d{1,2},?\s*\d{4})/i,
    /(?:Due Date|Payment Due|Due On|Due By)[:\s]*(\d{4}[-/]\d{1,2}[-/]\d{1,2})/i,
    // DD.MM.YYYY European
    /(?:Due Date|Payment Due|Due On|Due By)[:\s]*(\d{1,2}\.\d{1,2}\.\d{4})/i,
    // Due as "Due: DD/MM/YYYY" (may be on same line as Date)
    /\b(?:Due|Due By)[:\s]+(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})\b/i,
    // Net30 — extract from "Net 30" and calculate from invoice date (handled in nlpService)
  ],

  // ---------------------------------------------------------------------------
  // GST / VAT Number
  // ---------------------------------------------------------------------------
  gstVatNumber: [
    // Indian GSTIN (15 chars)
    /\b(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})\b/i,
    // GST labeled
    /\b(?:GSTIN|GST No|GST|GST Number)[:\s]*([A-Z0-9]+)/i,
    // VAT labeled — capture whole code, allow spaces
    /\b(?:VAT|VAT No|VAT Number|VAT Registration|VAT Reg|VAT Reg\.)[:\s]*((?:GB|DE|FR|IT|ES)?\s*\d[\dA-Z][\dA-Z .-]{4,20})/i,
    // ABN (Australian)
    /\b(?:ABN)[:\s]*(\d{2}\s*\d{3}\s*\d{3}\s*\d{3})/i,
    // EIN (US)
    /\b(?:EIN|Employer Identification Number)[:\s]*(\d{2}-\d{7})/i,
  ],

  // ---------------------------------------------------------------------------
  // GST Rate (percentage)
  // ---------------------------------------------------------------------------
  gstRate: [
    // "Tax (10%)", "GST @12%", "VAT (20%)", "CGST @9%"
    /(?:Tax|GST|VAT|Sales Tax|SGST|CGST|IGST|TVA)\s*[@(]?\s*(\d+(?:\.\d+)?)\s*%/i,
    // "CGST 2.5%:", "SGST 2.5%:" (Indian split)
    /(?:CGST|SGST|IGST)\s+(\d+(?:\.\d+)?)\s*%/i,
  ],

  // ---------------------------------------------------------------------------
  // Subtotal
  // ---------------------------------------------------------------------------
  subtotal: [
    /(?:Subtotal|Sub Total|Sub-total)[:\s]*([\d,]+\.?\d*)/i,
    // After dollar/euro/pound
    /(?:Subtotal|Sub Total|Sub-total)[:\s]*(?:INR|Rs\.?|USD|EUR|GBP|AUD|HKD|£|\$|€)?\s*([\d,]+\.?\d*)/i,
  ],

  // ---------------------------------------------------------------------------
  // Tax Amount
  // ---------------------------------------------------------------------------
  tax: [
    // "Tax (X%): amount" or "GST (X%): amount"
    /(?:Tax|GST|VAT|Sales Tax)\s*(?:\([^)]*\))?[:\s]*([\d,]+\.?\d*)/i,
    // "Total Tax:" or "Tax Amount:"
    /(?:Total Tax|Tax Amount)[:\s]*([\d,]+\.?\d*)/i,
    // CGST + SGST combined (add them in nlpService)
    /(?:CGST|SGST|IGST)[:\s]*([\d,]+\.?\d*)/i,
    // "Tax: amount"
    /\bTax[:\s]+([\d,]+\.?\d*)/i,
    // "VAT (X%): amount"
    /\bVAT\s*(?:\([^)]*\))?[:\s]+([\d,]+\.?\d*)/i,
  ],

  // ---------------------------------------------------------------------------
  // Discount
  // ---------------------------------------------------------------------------
  discount: [
    // "Bulk Discount: -675.00" — capture the absolute value
    /(?:Discount|Bulk Discount|Trade Discount)[:\s]*-?\s*([\d,]+\.?\d*)/i,
    // "Discount (5%): -185.00"
    /Discount\s*\([^)]*\)[:\s]*-?\s*([\d,]+\.?\d*)/i,
  ],

  // ---------------------------------------------------------------------------
  // Total Amount
  // ---------------------------------------------------------------------------
  totalAmount: [
    // Labeled total with optional currency
    /\b(?:Total|Total Amount|Amount Due|Grand Total|Total Due|Total HKD|Total AUD|Balance Due)[:\s]*(?:INR|Rs\.?|USD|EUR|GBP|AUD|HKD|£|\$|€|₹)?\s*([\d,]+\.?\d*)/i,
    // "Total: $X" or "Total: INR X"
    /\b(?:Total|Total Amount)[:\s]*(?:INR|Rs\.?|USD|EUR|£|\$|€|₹)?\s*([\d,]+\.?\d*)/i,
  ],

  // ---------------------------------------------------------------------------
  // PO Number
  // ---------------------------------------------------------------------------
  poNumber: [
    /(?:PO|P\.O\.|PO Number|PO No|PO Ref|Purchase Order|Order Ref|Reference)[:\s]*(PO[-/]?[\w-]{3,30})/i,
    /(?:PO|PO Number|PO No)[:\s]*([\w-]{3,30})/i,
  ],

  // ---------------------------------------------------------------------------
  // Customer Name (Bill To)
  // ---------------------------------------------------------------------------
  customerName: [
    /(?:Bill To|Billed To|Customer|Client|Ship To)[:\s]+([A-Za-z0-9.,&' -]{3,60})/im,
    /(?:Buyer|Consignee)[:\s]+([A-Za-z0-9.,&' -]{3,60})/im,
  ],

  // ---------------------------------------------------------------------------
  // Currency Detection (ordered by specificity)
  // ---------------------------------------------------------------------------
  currency: [
    // Explicit currency codes — must be word-bounded
    /\bTotal HKD\b/i,
    /\bTotal AUD\b/i,
    /\b(?:INR|Rs\.?|₹)\b/i,
    /\b(?:USD|\$)\b/i,
    /\b(?:EUR|€)\b/i,
    /\b(?:GBP|£)\b/i,
    /\bAUD\b/i,
    /\bHKD\b/i,
  ],

  // ---------------------------------------------------------------------------
  // Line Item Row Detection
  // ---------------------------------------------------------------------------
  lineItemRow: [
    // Multi-space separated: desc    qty    rate    amount
    /^(.+?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+(?:\.\d+)?)$/m,
    // Tab-like: desc qty rate amount (single spaces)
    /^([A-Za-z][A-Za-z0-9 .-]+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/m,
  ],

  // ---------------------------------------------------------------------------
  // Line Item with HSN code prefix (e.g., "73181500   Bolts 12mm  500  2.50  1250.00")
  // ---------------------------------------------------------------------------
  lineItemHSN: [
    /^\d{6,8}\s+(.+?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+(?:\.\d+)?)$/m,
  ],

  // ---------------------------------------------------------------------------
  // Called-out line items (descriptive, non-tabular)
  // "Service: X units @ Y = Z"
  // ---------------------------------------------------------------------------
  lineItemDescription: [
    /(.+?):\s*(\d+)\s*x\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/i,
    /(.+?):\s*(\d+)\s*@\s*(\d+(?:\.\d+)?)/i,
  ],
};

/**
 * Extract a field from text using the first matching pattern.
 */
function extractWithPatterns(text, patterns) {
  if (!text) return null;
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim()) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract line items from tabular text.
 * Returns array of { description, quantity, unitPrice, amount }.
 */
function extractLineItems(text) {
  const items = [];
  const lines = text.split('\n');
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      if (inTable) inTable = false; // Blank line ends table
      continue;
    }

    // Detect table header
    if (/description|item|product|particulars|service|article|hsn/i.test(trimmed)
        && /(?:qty|quantity|qté|rate|price|prix|rate|total)/i.test(trimmed)) {
      inTable = true;
      continue;
    }

    // Stop at subtotal/total/tax lines
    if (/^subtotal|^total|^sub\s+total|tax\s*[:\(]|gst|vat|discount|igst|cgst|sgst/i.test(trimmed)) {
      inTable = false;
      continue;
    }

    if (inTable) {
      const item = tryParseLineItem(trimmed);
      if (item) {
        items.push(item);
      }
    }
  }

  // If no table detected, try standalone line parsing without table context
  if (items.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^subtotal|^total|^tax|^gst|^vat|^discount|^igst|^cgst|^sgst/i.test(trimmed)) continue;

      const item = tryParseLineItem(trimmed);
      if (item) {
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * Try to parse a single line as a line item.
 */
function tryParseLineItem(line) {
  // Multi-space separated: desc    qty    rate    amount
  const multiSpaceMatch = line.match(/^(.+?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+(?:\.\d+)?)$/);
  if (multiSpaceMatch) {
    return {
      description: multiSpaceMatch[1].trim(),
      quantity: parseFloat(multiSpaceMatch[2]) || 0,
      unitPrice: parseFloat(multiSpaceMatch[3]) || 0,
      amount: parseFloat(multiSpaceMatch[4]) || 0,
    };
  }

  // HSN-prefixed: HSNCODE  desc  qty  rate  amount
  const hsnMatch = line.match(/^\d{6,8}\s+(.+?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+(?:\.\d+)?)\s{2,}(\d+(?:\.\d+)?)$/);
  if (hsnMatch) {
    return {
      description: hsnMatch[1].trim(),
      quantity: parseFloat(hsnMatch[2]) || 0,
      unitPrice: parseFloat(hsnMatch[3]) || 0,
      amount: parseFloat(hsnMatch[4]) || 0,
    };
  }

  // Single-space delimited: word word word qty rate amount
  const parts = line.split(/\s+/);
  if (parts.length >= 4) {
    const lastThree = parts.slice(-3);
    const qty = parseFloat(lastThree[0]);
    const rate = parseFloat(lastThree[1]);
    const amount = parseFloat(lastThree[2]);

    if (!isNaN(qty) && !isNaN(rate) && !isNaN(amount) && qty > 0 && rate >= 0) {
      const desc = parts.slice(0, -3).join(' ');
      // Heuristic: description must have at least one letter
      if (/[a-zA-Z]/.test(desc) && desc.length > 0) {
        return {
          description: desc,
          quantity: qty,
          unitPrice: rate,
          amount,
        };
      }
    }
  }

  return null;
}

/**
 * Parse a monetary amount string to a number.
 * Handles European format (1.255,00) and standard (1,255.00).
 */
function parseAmount(str) {
  if (!str) return 0;
  let cleaned = str.trim().replace(/[,₹$€£]/g, '');

  // Detect European format: 1.255,00 (dot as thousand sep, comma as decimal)
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned) || /^\d+,\d{2}$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

module.exports = {
  regexPatterns,
  extractWithPatterns,
  extractLineItems,
  tryParseLineItem,
  parseAmount,
};
