#!/usr/bin/env node

/**
 * Invoice Extraction Test Runner
 *
 * Usage: node tests/runTests.js
 *
 * Runs the NLP parser against all test invoice scenarios and
 * produces a field-wise accuracy report.
 *
 * Also supports: node tests/runTests.js --verbose  (prints parsed output per scenario)
 */

const { testInvoices } = require('./testInvoices');
const { runTestScenario, generateReport } = require('./invoiceTestUtils');

// Disable logging during tests
process.env.LOG_LEVEL = 'silent';

// Hack to suppress logger output
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
process.env.NODE_ENV = 'test';

// Load the NLP service — must be required after env setup
const nlpService = require('../src/services/nlpService');

// Suppress console output during test
const origLog = console.log.bind(console);
const verbose = process.argv.includes('--verbose');

console.log = verbose ? origLog : () => {};

// Run all scenarios
const results = testInvoices.map((scenario, i) => {
  if (!verbose) {
    // Print progress
    process.stdout.write(`\r  Running scenario ${i + 1}/${testInvoices.length}: ${scenario.name.padEnd(45)}`);
  }
  const result = runTestScenario(nlpService, scenario);

  if (verbose) {
    console.log(`\n=== Scenario ${i + 1}: ${scenario.name} ===`);
    console.log('OCR Text:');
    console.log(scenario.text.substring(0, 300) + '...');
    console.log('\nParsed result:');
    console.log(JSON.stringify(result.parsedData, null, 2));
    console.log('');
  }

  return result;
});

// Restore console
console.log = origLog;

process.stdout.write('\n\n');
console.log(generateReport(results));

// Exit with code 1 if any tests failed
const allPassed = results.every((r) => r.success);
process.exit(allPassed ? 0 : 1);
