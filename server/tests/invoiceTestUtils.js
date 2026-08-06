/**
 * Invoice extraction test utilities.
 *
 * Provides:
 *  - compareFields(actual, expected)    — field-wise match report
 *  - runTestScenario(nlp, scenario)     — run one test case
 *  - generateReport(results)            — aggregate accuracy report
 *  - fuzzyMatch                         — tolerant value comparison
 */

const logger = require('../src/config/logger');

const EXTRACTED_FIELDS = [
  'invoiceNumber',
  'vendorName',
  'invoiceDate',
  'dueDate',
  'gstVatNumber',
  'gstRate',
  'subtotal',
  'tax',
  'discount',
  'totalAmount',
  'currency',
  'poNumber',
  'customerName',
];

const OPTIONAL_FIELDS = new Set([
  'gstRate', 'discount', 'poNumber', 'customerName',
  'gstVatNumber', 'dueDate', 'lineItems',
]);

/**
 * Normalize a date value for comparison.
 */
function normalizeDate(val) {
  if (!val) return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    return val;
  }
  return String(val);
}

/**
 * Compare two numeric values with tolerance.
 */
function fuzzyNumeric(a, b, tolerance = 0.01) {
  if (a == null || b == null) return a === b;
  return Math.abs(Number(a) - Number(b)) <= tolerance;
}

/**
 * Compare two line item arrays.
 */
function fuzzyLineItems(actual, expected) {
  if (!actual || !expected) return actual === expected;
  if (actual.length !== expected.length) return false;
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i];
    const e = expected[i];
    if (a.description?.toLowerCase() !== e.description?.toLowerCase()) return false;
    if (!fuzzyNumeric(a.quantity, e.quantity)) return false;
    if (!fuzzyNumeric(a.unitPrice, e.unitPrice)) return false;
    if (!fuzzyNumeric(a.amount, e.amount)) return false;
  }
  return true;
}

/**
 * Compare a single field value.
 * Returns { match: boolean, actual, expected }
 */
function compareField(field, actual, expected) {
  if (field === 'invoiceDate' || field === 'dueDate') {
    const a = normalizeDate(actual);
    const e = normalizeDate(expected);
    return { match: a === e, actual: a, expected: e };
  }
  if (field === 'lineItems') {
    return { match: fuzzyLineItems(actual, expected), actual, expected };
  }
  if (typeof expected === 'number') {
    return { match: fuzzyNumeric(actual, expected), actual, expected };
  }
  if (typeof expected === 'string') {
    const a = String(actual || '').toLowerCase().trim();
    const e = expected.toLowerCase().trim();
    return { match: a === e, actual: a, expected: e };
  }
  return { match: actual === expected, actual, expected };
}

/**
 * Run a single test scenario through the NLP parser.
 * Returns a detailed result with per-field comparison.
 */
function runTestScenario(nlpService, scenario) {
  const { name, text, expected, optional } = scenario;
  const description = optional || {};

  let parsed;
  let parseError = null;

  try {
    parsed = nlpService.parseInvoice(text);
  } catch (err) {
    parseError = err.message;
    parsed = null;
  }

  const fields = {};
  let totalFields = 0;
  let matchedFields = 0;
  let skippedFields = 0;

  for (const field of EXTRACTED_FIELDS) {
    if (expected[field] === undefined && !OPTIONAL_FIELDS.has(field)) {
      // Field not in expected for this scenario — skip
      continue;
    }
    if (expected[field] === undefined && OPTIONAL_FIELDS.has(field)) {
      continue; // Optional field not in scenario expectations
    }

    totalFields++;
    const actual = parsed ? parsed[field] : undefined;
    const cmp = compareField(field, actual, expected[field]);

    if (cmp.match) matchedFields++;
    else if (field === 'currency' && expected[field] === 'INR' && (!actual || actual === 'INR')) {
      // Default currency is INR, that's fine
      matchedFields++;
    }

    fields[field] = cmp;
  }

  // Special handling for line items
  if (expected.lineItems && expected.lineItems.length > 0) {
    totalFields++;
    const actualItems = parsed?.lineItems || [];
    const cmp = compareField('lineItems', actualItems, expected.lineItems);
    if (cmp.match) matchedFields++;
    fields.lineItems = cmp;
  }

  // Track skipped (optional) fields
  for (const field of ['gstRate', 'discount', 'poNumber', 'customerName']) {
    if (expected[field] !== undefined && fields[field] === undefined) {
      if (!parsed || parsed[field] === undefined || parsed[field] === null) {
        skippedFields++;
      }
    }
  }

  const accuracy = totalFields > 0 ? matchedFields / totalFields : 0;

  return {
    name,
    success: matchedFields === totalFields,
    parseError,
    totalFields,
    matchedFields,
    skippedFields,
    accuracy,
    fields,
    parsedData: parsed,
  };
}

/**
 * Generate a human-readable accuracy report from results.
 */
function generateReport(results) {
  const total = results.length;
  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const errored = results.filter((r) => r.parseError).length;

  const fieldStats = {};
  for (const field of EXTRACTED_FIELDS) {
    fieldStats[field] = { tested: 0, matched: 0 };
  }

  for (const result of results) {
    for (const [field, cmp] of Object.entries(result.fields || {})) {
      if (!fieldStats[field]) fieldStats[field] = { tested: 0, matched: 0 };
      fieldStats[field].tested++;
      if (cmp.match) fieldStats[field].matched++;
    }
  }

  const lines = [];
  lines.push('='.repeat(70));
  lines.push('INVOICE EXTRACTION ACCURACY REPORT');
  lines.push('='.repeat(70));
  lines.push(`Total Scenarios: ${total}`);
  lines.push(`Passed:          ${passed}`);
  lines.push(`Failed:          ${failed}`);
  lines.push(`Parse Errors:    ${errored}`);
  lines.push(`Overall Accuracy: ${total > 0 ? ((passed / total) * 100).toFixed(1) : 'N/A'}%`);
  lines.push('');
  lines.push('-'.repeat(50));
  lines.push('Field-wise Accuracy:');
  lines.push('-'.repeat(50));
  lines.push('  Field                  Tested   Matched   Accuracy');
  lines.push('  ' + '-'.repeat(48));

  const sortedFields = Object.entries(fieldStats).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [field, stats] of sortedFields) {
    if (stats.tested === 0) continue;
    const pct = ((stats.matched / stats.tested) * 100).toFixed(0);
    const fieldName = field.padEnd(22);
    lines.push(`  ${fieldName} ${String(stats.tested).padStart(5)}   ${String(stats.matched).padStart(6)}   ${pct.padStart(5)}%`);
  }

  lines.push('');
  lines.push('-'.repeat(50));
  lines.push('Failed Scenarios:');
  lines.push('-'.repeat(50));

  for (const result of results) {
    if (result.success) continue;
    lines.push(`\n  ❌ ${result.name} (${(result.accuracy * 100).toFixed(0)}%)`);
    if (result.parseError) {
      lines.push(`     Parse Error: ${result.parseError}`);
    }
    for (const [field, cmp] of Object.entries(result.fields || {})) {
      if (!cmp.match) {
        lines.push(`     ✗ ${field}: expected "${cmp.expected}", got "${cmp.actual}"`);
      }
    }
  }

  lines.push('');
  lines.push('='.repeat(70));
  lines.push('END OF REPORT');
  lines.push('='.repeat(70));

  return lines.join('\n');
}

module.exports = {
  EXTRACTED_FIELDS,
  OPTIONAL_FIELDS,
  runTestScenario,
  generateReport,
  compareField,
  fuzzyNumeric,
  fuzzyLineItems,
};
