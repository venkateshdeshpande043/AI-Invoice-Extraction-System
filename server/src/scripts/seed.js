/**
 * Seed script — creates a demo user and realistic invoices so the
 * dashboard, history, vendors and payments pages have data to show.
 *
 * Usage: npm run seed (from server/)  — or: node src/scripts/seed.js
 */
const path = require('path');
// Mirror the loader in src/config/env.js: root .env, root .env.local, server .env
const projectRoot = path.resolve(__dirname, '../../../');
const serverRoot = path.resolve(__dirname, '../../');
require('dotenv').config({ path: path.join(projectRoot, '.env') });
require('dotenv').config({ path: path.join(projectRoot, '.env.local') });
require('dotenv').config({ path: path.join(serverRoot, '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');
const Invoice = require('../models/Invoice');
const { roundMoney } = require('../utils/helpers');
const { validateInvoice } = require('../services/validationService');
const { CATEGORY_LABELS } = require('../services/categorizationService');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Set it in .env or run with env MONGODB_URI=…');
  process.exit(1);
}

const DEMO_EMAIL = process.env.SEED_EMAIL || 'demo@invoiceai.app';
const DEMO_PASSWORD = process.env.SEED_PASSWORD || 'Demo12345';

const VENDORS = [
  { name: 'Acme Supplies Pvt Ltd', gstin: '27AABCU9603R1ZM', category: 'office_supplies', lineItems: 'Office stationery, Printer paper, Desk organizer' },
  { name: 'TechNova Solutions', gstin: '29AACCT5552D1ZX', category: 'software', lineItems: 'Cloud hosting (annual), SaaS license, Support plan' },
  { name: 'Skyline Airlines', gstin: '', category: 'travel', lineItems: 'Flight ticket, Travel booking fee' },
  { name: 'GreenLeaf Power Co', gstin: '07AAGCG1234G1Z2', category: 'utilities', lineItems: 'Electricity consumption, Grid maintenance' },
  { name: 'Urban Legal LLP', gstin: '24AALU7421P1Z8', category: 'professional_services', lineItems: 'Legal consultation, Contract review' },
  { name: 'Craftline Interiors', gstin: '33AACFC1234Q1ZK', category: 'rent', lineItems: 'Office furniture, Workspace fitout' },
  { name: 'SwiftLog Express', gstin: '', category: 'logistics', lineItems: 'Courier charges, Freight handling' },
  { name: 'PixelAds Media', gstin: '06AAPPM4567R1ZQ', category: 'marketing', lineItems: 'Google Ads campaign, Social media creatives' },
];

function addMonths(d, m) {
  const r = new Date(d);
  r.setMonth(r.getMonth() + m);
  return r;
}

function addDays(d, days) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      name: 'Demo Finance User',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    console.log(`Created demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  } else {
    console.log(`Using existing demo user: ${DEMO_EMAIL}`);
  }

  await Invoice.deleteMany({ uploadedBy: user._id });
  console.log('Cleared existing invoices for demo user');

  const today = new Date();
  const invoices = [];

  VENDORS.forEach((vendor, vi) => {
    // 3–5 invoices per vendor spread over the last 5 months
    const count = 3 + ((vi * 2) % 3);
    for (let i = 0; i < count; i++) {
      const monthOffset = (vi + i) % 5;
      const invoiceDate = addMonths(today, -monthOffset);
      invoiceDate.setDate(Math.min(5 + vi + i, 28));

      const subtotal = roundMoney((350 + ((vi * 7 + i * 13) % 90) * 100) + 149);
      const taxRate = 18;
      const tax = roundMoney((subtotal * taxRate) / 100);
      const discount = i % 3 === 0 ? roundMoney(subtotal * 0.05) : null;
      const totalAmount = roundMoney(subtotal + tax - (discount || 0));

      const dueDate = addDays(invoiceDate, 15 + i * 5);
      const lineItems = vendor.lineItems
        .split(', ')
        .slice(0, 2 + (i % 2))
        .map((desc, li) => {
          const quantity = 1 + ((vi + li) % 3);
          const unitPrice = roundMoney(subtotal / (quantity * 2) + li * 25);
          return {
            description: desc,
            quantity,
            unitPrice,
            amount: roundMoney(quantity * unitPrice),
          };
        });

      // Payment scenario: 0 = unpaid, 1 = partial, 2 = paid
      const scenario = (vi + i) % 3;
      let amountPaid = 0;
      const payments = [];
      if (scenario === 1) {
        amountPaid = roundMoney(totalAmount * 0.5);
        payments.push({
          amount: amountPaid,
          date: addDays(invoiceDate, 2),
          method: 'bank_transfer',
        });
      } else if (scenario === 2) {
        amountPaid = totalAmount;
        payments.push({
          amount: totalAmount,
          date: addDays(invoiceDate, 3),
          method: 'upi',
        });
      }

      const extracted = {
        invoiceNumber: `INV-${2024 + vi}${String(100 + i + vi * 10)}`,
        vendorName: vendor.name,
        gstVatNumber: vendor.gstin || null,
        customerName: 'Invoice AI Inc',
        poNumber: vi % 2 === 0 ? `PO-${900 + vi * 5 + i}` : null,
        currency: 'INR',
        invoiceDate,
        dueDate,
        subtotal,
        tax,
        gstRate: taxRate,
        discount,
        totalAmount,
        lineItems,
      };

      const report = validateInvoice(extracted);

      invoices.push({
        uploadedBy: user._id,
        invoiceNumber: extracted.invoiceNumber,
        vendorName: vendor.name,
        customerName: 'Invoice AI Inc',
        poNumber: extracted.poNumber,
        currency: 'INR',
        invoiceDate,
        dueDate,
        gstVatNumber: vendor.gstin || null,
        gstRate: taxRate,
        lineItems,
        subtotal,
        tax,
        discount,
        totalAmount,
        category: vendor.category,
        status: 'processed',
        fileType: 'application/pdf',
        fileUrl: null,
        rawOcrText: `Sample OCR text for ${extracted.invoiceNumber} from ${vendor.name}.\nGSTIN: ${vendor.gstin || 'N/A'}\nTotal: ${totalAmount}`,
        amountPaid,
        paidDate: payments.length ? payments[0].date : null,
        paymentMethod: payments.length ? payments[0].method : null,
        paymentStatus:
          amountPaid >= totalAmount ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid',
        payments,
        validation: {
          status: report.status,
          issues: report.issues,
          checkedAt: new Date(),
        },
        duplicateOf: null,
        duplicateReason: null,
        createdAt: addMonths(today, -monthOffset),
      });
    }
  });

  await Invoice.insertMany(invoices);
  console.log(`Seeded ${invoices.length} invoices across ${VENDORS.length} vendors`);
  console.log(`Categories: ${[...new Set(invoices.map((inv) => CATEGORY_LABELS[inv.category] || inv.category))].join(', ')}`);

  await mongoose.disconnect();
  console.log('Done. Start the app and log in as the demo user.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
