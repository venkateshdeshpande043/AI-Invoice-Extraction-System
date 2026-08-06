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

const invoiceSchema = new mongoose.Schema(
  {
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
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

invoiceSchema.index({ invoiceNumber: 'text', vendorName: 'text' });
invoiceSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
