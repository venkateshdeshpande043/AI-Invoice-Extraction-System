const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Invoice = require('../models/Invoice');
const ocrService = require('../services/ocrService');
const nlpService = require('../services/nlpService');
const storageService = require('../services/storageService');
const exportService = require('../services/exportService');
const validationService = require('../services/validationService');
const categorizationService = require('../services/categorizationService');
const duplicateService = require('../services/duplicateService');
const paymentService = require('../services/paymentService');
const generationService = require('../services/invoiceGenerationService');
const pdfService = require('../services/pdfService');
const logger = require('../config/logger');
const { generateFilename, parsePagination, buildSortQuery } = require('../utils/helpers');

/** Shared filter builder for list + bulk export. */
function buildListFilter(query, userId) {
  const filter = { uploadedBy: userId };

  if (query.search) {
    filter.$or = [
      { invoiceNumber: { $regex: query.search, $options: 'i' } },
      { vendorName: { $regex: query.search, $options: 'i' } },
    ];
  }

  if (query.vendor) {
    filter.vendorName = { $regex: query.vendor, $options: 'i' };
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  if (query.dateFrom || query.dateTo) {
    filter.invoiceDate = {};
    if (query.dateFrom) {
      filter.invoiceDate.$gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      filter.invoiceDate.$lte = new Date(query.dateTo);
    }
  }

  if (query.amountFrom || query.amountTo) {
    filter.totalAmount = {};
    if (query.amountFrom) {
      filter.totalAmount.$gte = Number(query.amountFrom);
    }
    if (query.amountTo) {
      filter.totalAmount.$lte = Number(query.amountTo);
    }
  }

  return filter;
}

const upload = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const tempFilePath = req.file.path;
  const fileType = req.file.mimetype;
  let rawOcrText = '';
  let extractedData = {};
  let status = 'pending';
  let errorMessage = null;
  let fileUrl = '';

  try {
    rawOcrText = await ocrService.extractText(tempFilePath, fileType);
    extractedData = nlpService.parseInvoice(rawOcrText);
    status = 'processed';
  } catch (error) {
    logger.error(`OCR/NLP pipeline failed: ${error.message}`);
    status = 'failed';
    errorMessage = error.message;

    if (fileType === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(tempFilePath);
        const data = await pdfParse(dataBuffer);
        rawOcrText = data.text || '';
      } catch {
        rawOcrText = '';
      }
    }
  }

  try {
    const fileBuffer = fs.readFileSync(tempFilePath);
    const filename = generateFilename(req.file.originalname);
    const saved = await storageService.saveFile(filename, fileBuffer, fileType);
    fileUrl = saved.url;
  } catch (error) {
    logger.error(`File storage failed: ${error.message}`);
    if (status === 'processed') {
      status = 'failed';
      errorMessage = (errorMessage ? errorMessage + '; ' : '') + 'File storage failed';
    }
  }

  try {
    fs.unlinkSync(tempFilePath);
  } catch {
    // Ignore cleanup errors
  }

  // ── Phase C/E intelligence layer ───────────────────────────
  let validation = { status: 'not_checked', issues: [] };
  let category = 'uncategorized';
  let duplicate = null;
  let paymentStatus = 'unpaid';

  if (status === 'processed' && extractedData && Object.keys(extractedData).length > 0) {
    validation = validationService.validateInvoice(extractedData);
    category = categorizationService.categorize({
      vendorName: extractedData.vendorName,
      lineItems: extractedData.lineItems,
    });
    try {
      const existing = await Invoice.find({ uploadedBy: req.user._id })
        .select('invoiceNumber vendorName totalAmount invoiceDate')
        .lean();
      duplicate = duplicateService.findDuplicate(extractedData, existing);
    } catch (error) {
      logger.warn(`Duplicate check failed: ${error.message}`);
    }
    paymentStatus = paymentService.computePaymentStatus({
      totalAmount: extractedData.totalAmount,
      dueDate: extractedData.dueDate,
    });
  }

  const invoice = await Invoice.create({
    invoiceNumber: extractedData.invoiceNumber || null,
    vendorName: extractedData.vendorName || null,
    customerName: extractedData.customerName || null,
    invoiceDate: extractedData.invoiceDate || null,
    dueDate: extractedData.dueDate || null,
    gstVatNumber: extractedData.gstVatNumber || null,
    gstRate: extractedData.gstRate || null,
    lineItems: extractedData.lineItems || [],
    subtotal: extractedData.subtotal || 0,
    tax: extractedData.tax || 0,
    discount: extractedData.discount || null,
    totalAmount: extractedData.totalAmount || 0,
    currency: extractedData.currency || 'INR',
    poNumber: extractedData.poNumber || null,
    fileUrl,
    fileType,
    status,
    rawOcrText: rawOcrText || '',
    errorMessage,
    uploadedBy: req.user._id,

    // Phase C — payment tracking
    amountPaid: 0,
    paymentStatus,

    // Phase E — validation report
    validation: { ...validation, checkedAt: new Date() },

    // Categorization + duplicates
    category,
    duplicateOf: duplicate ? duplicate.invoiceId : null,
    duplicateReason: duplicate ? duplicate.reason : null,
  });

  res.status(201).json({
    success: true,
    data: invoice,
  });
});

const list = catchAsync(async (req, res) => {
  await paymentService.refreshOverdueStatuses(req.user._id);

  const { page, limit, skip } = parsePagination(req.query);
  const sort = buildSortQuery(req.query.sortBy, req.query.sortOrder);
  const filter = buildListFilter(req.query, req.user._id);

  const [invoices, totalCount] = await Promise.all([
    Invoice.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    Invoice.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json({
    success: true,
    data: {
      invoices,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
      },
    },
  });
});

const getById = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    uploadedBy: req.user._id,
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  // Keep the derived payment status fresh without a write on every view.
  if (invoice.status === 'processed' && invoice.paymentStatus !== 'paid') {
    const computed = paymentService.computePaymentStatus({
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      dueDate: invoice.dueDate,
    });
    if (computed !== invoice.paymentStatus) {
      invoice.paymentStatus = computed;
      await invoice.save();
    }
  }

  res.status(200).json({
    success: true,
    data: invoice,
  });
});

/**
 * Record a payment against an invoice (Phase C). The client sends the new
 * absolute running total; applyPayment() derives the delta and maintains
 * the payment history.
 */
const recordPayment = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    uploadedBy: req.user._id,
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const amount = Number(req.body.amountPaid);
  if (Number.isNaN(amount) || amount < 0) {
    throw new AppError('Invalid payment amount', 400);
  }

  paymentService.applyPayment(invoice, {
    amount,
    date: req.body.paidDate ? new Date(req.body.paidDate) : null,
    method: req.body.paymentMethod || null,
  });
  paymentService.applyPaymentStatus(invoice);

  await invoice.save();

  res.status(200).json({
    success: true,
    data: invoice,
  });
});

const deleteInvoice = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOneAndDelete({
    _id: req.params.id,
    uploadedBy: req.user._id,
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.fileUrl) {
    try {
      const filePath = invoice.fileUrl.replace('/uploads/', '');
      await storageService.deleteFile(filePath);
    } catch (error) {
      logger.warn(`Failed to delete file: ${error.message}`);
    }
  }

  res.status(200).json({
    success: true,
    data: { message: 'Invoice deleted successfully' },
  });
});

const exportInvoice = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    uploadedBy: req.user._id,
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const format = req.query.format || 'json';

  let exportResult;
  if (format === 'csv') {
    exportResult = exportService.exportAsCSV(invoice);
  } else {
    exportResult = exportService.exportAsJSON(invoice);
  }

  res.setHeader('Content-Type', exportResult.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
  res.send(exportResult.content);
});

/** Bulk export of the filtered invoice list (GET /invoices/export). */
/**
 * POST /api/invoices/generate — create a new invoice document from form
 * input (Phase F). Totals are recomputed server-side; the saved document is
 * tagged source: 'generated' so it can be distinguished from OCR results.
 */
const generateInvoice = catchAsync(async (req, res) => {
  const doc = generationService.normalizeInput(req.body || {});

  // A customer and at least one line item are the minimum for a meaningful invoice.
  if (!doc.customerName) {
    throw new AppError('Customer name is required.', 400);
  }
  const meaningfulItems = (doc.lineItems || []).filter((item) => item.description && item.amount > 0);
  if (meaningfulItems.length === 0) {
    throw new AppError('Add at least one line item with a description and amount.', 400);
  }

  // Reject an invoice number already used by this user (case-insensitive).
  if (doc.invoiceNumber) {
    const existing = await Invoice.findOne({
      uploadedBy: req.user._id,
      invoiceNumber: { $regex: `^${doc.invoiceNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
    if (existing) {
      throw new AppError(`Invoice number ${doc.invoiceNumber} already exists.`, 409);
    }
  } else {
    // No number supplied — suggest the next sequential one.
    const userNumbers = await Invoice.find({ uploadedBy: req.user._id })
      .select('invoiceNumber')
      .lean();
    doc.invoiceNumber = generationService.suggestInvoiceNumber(
      userNumbers.map((inv) => inv.invoiceNumber)
    );
  }

  const sellerName = (doc.seller && doc.seller.name) || 'Your Business';
  const vendorName = sellerName;
  const validation = validationService.validateInvoice({
    ...doc,
    vendorName,
    gstVatNumber: doc.customerGstin,
  });
  const category = categorizationService.categorize({
    vendorName,
    lineItems: doc.lineItems,
  });
  const paymentStatus = paymentService.computePaymentStatus({
    totalAmount: doc.totalAmount,
    dueDate: doc.dueDate,
  });

  const invoice = await Invoice.create({
    source: 'generated',
    invoiceNumber: doc.invoiceNumber,
    vendorName,
    customerName: doc.customerName,
    gstVatNumber: doc.customerGstin || null,
    gstRate: doc.gstRate,
    invoiceDate: doc.invoiceDate || new Date(),
    dueDate: doc.dueDate || null,
    poNumber: doc.poNumber,
    lineItems: doc.lineItems,
    subtotal: doc.subtotal,
    tax: doc.tax,
    discount: doc.discount,
    totalAmount: doc.totalAmount,
    currency: doc.currency,
    status: 'processed',
    fileUrl: null,
    fileType: undefined,
    uploadedBy: req.user._id,
    amountPaid: 0,
    paymentStatus,
    validation: { ...validation, checkedAt: new Date() },
    category,
    seller: doc.seller,
    notes: doc.notes,
    paymentTerms: doc.paymentTerms,
    template: doc.template,
  });

  res.status(201).json({
    success: true,
    data: invoice,
    message: `Invoice ${invoice.invoiceNumber} generated.`,
  });
});

/** GET /api/invoices/generate/next — suggest the next invoice number. */
const getNextInvoiceNumber = catchAsync(async (req, res) => {
  const userNumbers = await Invoice.find({ uploadedBy: req.user._id })
    .select('invoiceNumber')
    .lean();
  const invoiceNumber = generationService.suggestInvoiceNumber(
    userNumbers.map((inv) => inv.invoiceNumber)
  );
  res.status(200).json({
    success: true,
    data: { invoiceNumber },
  });
});

/** GET /api/invoices/:id/pdf — stream the invoice document as a PDF. */
const downloadPdf = catchAsync(async (req, res) => {
  const invoice = await Invoice.findOne({
    _id: req.params.id,
    uploadedBy: req.user._id,
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  const buffer = await pdfService.generateInvoicePdf(invoice);
  const safeName = (invoice.invoiceNumber || invoice._id).replace(/[^a-zA-Z0-9._-]/g, '_');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${safeName}.pdf"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
});

const exportMany = catchAsync(async (req, res) => {
  await paymentService.refreshOverdueStatuses(req.user._id);

  const filter = buildListFilter(req.query, req.user._id);
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).limit(2000).lean();

  const format = req.query.format === 'json' ? 'json' : 'csv';
  const exportResult =
    format === 'json'
      ? exportService.exportManyAsJSON(invoices)
      : exportService.exportManyAsCSV(invoices);

  res.setHeader('Content-Type', exportResult.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
  res.send(exportResult.content);
});

module.exports = {
  upload,
  list,
  getById,
  recordPayment,
  deleteInvoice,
  exportInvoice,
  exportMany,
  generateInvoice,
  getNextInvoiceNumber,
  downloadPdf,
};
