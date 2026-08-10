/**
 * Vendor service (Phase D) — aggregates vendor profiles from the invoice
 * collection (no duplicate vendor documents).
 *
 * Exposes:
 *  - normalizeVendorName() / computeVendorSummary() — pure helpers (unit-tested)
 *  - listVendors() / getVendor() — aggregation used by the vendors API
 */

const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');

/** Lowercase + collapse whitespace — used to group vendor names. */
function normalizeVendorName(name) {
  return String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Escape a string for safe use inside a RegExp constructor. */
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Pure summary over an array of invoice docs.
 * @returns [{ normalizedName, vendorName, totalInvoices, totalSpend,
 *   paidTotal, outstanding, avgAmount, gstin, lastInvoiceDate }]
 */
function computeVendorSummary(invoices = []) {
  const groups = new Map();

  for (const inv of invoices) {
    if (!inv || !inv.vendorName) continue;
    const normalizedName = normalizeVendorName(inv.vendorName);
    if (!normalizedName) continue;

    if (!groups.has(normalizedName)) {
      groups.set(normalizedName, {
        normalizedName,
        vendorName: inv.vendorName,
        totalInvoices: 0,
        totalSpend: 0,
        paidTotal: 0,
        outstanding: 0,
        avgAmount: 0,
        gstin: '',
        lastInvoiceDate: null,
      });
    }

    const g = groups.get(normalizedName);
    g.totalInvoices += 1;
    g.totalSpend = round2(g.totalSpend + (Number(inv.totalAmount) || 0));
    g.paidTotal = round2(g.paidTotal + (Number(inv.amountPaid) || 0));
    if (!g.gstin && (inv.gstVatNumber || inv.vendorGstin)) {
      g.gstin = inv.gstVatNumber || inv.vendorGstin;
    }
    const invDate = inv.invoiceDate ? new Date(inv.invoiceDate) : null;
    if (invDate && !Number.isNaN(invDate.getTime())) {
      const last = g.lastInvoiceDate ? new Date(g.lastInvoiceDate) : null;
      if (!last || invDate > last) g.lastInvoiceDate = invDate;
    }
  }

  const result = [];
  for (const g of groups.values()) {
    g.outstanding = round2(g.totalSpend - g.paidTotal);
    g.avgAmount = g.totalInvoices > 0 ? round2(g.totalSpend / g.totalInvoices) : 0;
    if (g.lastInvoiceDate) {
      g.lastInvoiceDate = g.lastInvoiceDate.toISOString().slice(0, 10);
    }
    result.push(g);
  }
  return result;
}

const SORT_MAP = {
  spend: 'totalSpend',
  name: 'vendorName',
  count: 'totalInvoices',
  recent: 'lastInvoiceDate',
};

/**
 * List vendors with pagination + sorting (aggregation pipeline).
 * @returns { vendors, totalCount }
 */
async function listVendors({ userId, search = '', sortBy = 'spend', sortOrder = 'desc', page = 1, limit = 20 }) {
  const match = { uploadedBy: new mongoose.Types.ObjectId(userId), vendorName: { $nin: [null, ''] } };
  if (search) {
    match.vendorName = { $regex: new RegExp(escapeRegex(search), 'i') };
  }

  const sortField = SORT_MAP[sortBy] || 'totalSpend';
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$vendorName',
        totalInvoices: { $sum: 1 },
        totalSpend: { $sum: '$totalAmount' },
        paidTotal: { $sum: '$amountPaid' },
        gstin: { $last: '$gstVatNumber' },
        lastInvoiceDate: { $max: '$invoiceDate' },
      },
    },
    {
      $project: {
        _id: 0,
        vendorName: '$_id',
        totalInvoices: 1,
        totalSpend: { $round: ['$totalSpend', 2] },
        paidTotal: { $round: ['$paidTotal', 2] },
        outstanding: { $round: [{ $max: [{ $subtract: ['$totalSpend', '$paidTotal'] }, 0] }, 2] },
        avgAmount: { $round: [{ $divide: ['$totalSpend', '$totalInvoices'] }, 2] },
        gstin: 1,
        lastInvoiceDate: 1,
      },
    },
    { $sort: { [sortField]: sortDir, vendorName: 1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ];

  const [vendors, totalCount] = await Promise.all([
    Invoice.aggregate(pipeline),
    Invoice.countDocuments(match),
  ]);

  return { vendors, totalCount };
}

/** Vendor detail: summary + full invoice history. */
async function getVendor({ userId, vendorName, page = 1, limit = 100 }) {
  const match = {
    uploadedBy: new mongoose.Types.ObjectId(userId),
    vendorName: { $regex: new RegExp(`^${escapeRegex(vendorName)}$`, 'i') },
  };

  const [invoices, allInvoices] = await Promise.all([
    Invoice.find(match)
      .sort({ invoiceDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Invoice.find(match).lean(),
  ]);

  const summary = computeVendorSummary(allInvoices)[0] || {
    vendorName,
    totalInvoices: 0,
    totalSpend: 0,
    paidTotal: 0,
    outstanding: 0,
    avgAmount: 0,
    gstin: '',
    lastInvoiceDate: null,
  };

  return { summary, invoices };
}

module.exports = { normalizeVendorName, computeVendorSummary, listVendors, getVendor };
