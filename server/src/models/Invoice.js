const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, trim: true },
    quantity: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    method: {
      type: String,
      enum: ['bank_transfer', 'upi', 'card', 'cheque', 'cash', 'other'],
      default: 'other',
    },
  },
  { _id: true }
);

const validationIssueSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    severity: {
      type: String,
      enum: ['error', 'anomaly', 'warning', 'info'],
      required: true,
    },
    field: { type: String, default: '' },
    message: { type: String, required: true },
  },
  { _id: false }
);

const sellerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    gstVatNumber: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    // How this document entered the system.
    source: {
      type: String,
      enum: ['extracted', 'generated'],
      default: 'extracted',
      index: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
      index: true,
    },
    vendorName: {
      type: String,
      trim: true,
      index: true,
    },
    invoiceDate: { type: Date },
    dueDate: { type: Date },
    gstVatNumber: { type: String, trim: true },
    gstRate: { type: Number, default: null },
    lineItems: [lineItemSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: null },
    totalAmount: { type: Number, default: 0 },
    poNumber: { type: String, trim: true, default: null },
    customerName: { type: String, trim: true, default: null },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    fileUrl: { type: String },
    fileType: {
      type: String,
      enum: ['image/jpeg', 'image/png', 'application/pdf'],
    },
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    rawOcrText: { type: String },
    errorMessage: { type: String },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    // ── Payment & due-date tracking (Phase C) ──
    amountPaid: { type: Number, default: 0, min: 0 },
    paidDate: { type: Date, default: null },
    paymentMethod: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'overdue'],
      default: 'unpaid',
      index: true,
    },
    payments: [paymentSchema],

    // ── Validation report (Phase E) ──
    validation: {
      status: {
        type: String,
        enum: ['valid', 'warning', 'anomaly', 'error', 'not_checked'],
        default: 'not_checked',
      },
      issues: [validationIssueSchema],
      checkedAt: { type: Date },
    },

    // ── Duplicate detection ──
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    duplicateReason: { type: String, default: null },

    // ── Automatic categorization ──
    category: { type: String, trim: true, default: 'uncategorized' },

    // ── Phase F — generated invoices ──
    seller: { type: sellerSchema, default: undefined },
    notes: { type: String, trim: true, default: null },
    paymentTerms: { type: String, trim: true, default: null },
    template: { type: String, trim: true, default: 'classic' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

invoiceSchema.index({ invoiceNumber: 'text', vendorName: 'text' });
invoiceSchema.index({ uploadedBy: 1, createdAt: -1 });
invoiceSchema.index({ uploadedBy: 1, paymentStatus: 1 });
invoiceSchema.index({ uploadedBy: 1, dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
