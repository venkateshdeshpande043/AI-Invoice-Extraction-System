const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Invoice = require('../models/Invoice');
const ocrService = require('../services/ocrService');
const nlpService = require('../services/nlpService');
const storageService = require('../services/storageService');
const exportService = require('../services/exportService');
const logger = require('../config/logger');
const { generateFilename } = require('../utils/helpers');

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
  });

  res.status(201).json({
    success: true,
    data: invoice,
  });
});

const list = catchAsync(async (req, res) => {
  const { parsePagination, buildSortQuery } = require('../utils/helpers');
  const { page, limit, skip } = parsePagination(req.query);
  const sort = buildSortQuery(req.query.sortBy, req.query.sortOrder);

  const filter = { uploadedBy: req.user._id };

  if (req.query.search) {
    filter.$or = [
      { invoiceNumber: { $regex: req.query.search, $options: 'i' } },
      { vendorName: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  if (req.query.vendor) {
    filter.vendorName = { $regex: req.query.vendor, $options: 'i' };
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.dateFrom || req.query.dateTo) {
    filter.invoiceDate = {};
    if (req.query.dateFrom) {
      filter.invoiceDate.$gte = new Date(req.query.dateFrom);
    }
    if (req.query.dateTo) {
      filter.invoiceDate.$lte = new Date(req.query.dateTo);
    }
  }

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

module.exports = { upload, list, getById, deleteInvoice, exportInvoice };
