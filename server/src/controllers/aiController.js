const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const Invoice = require('../models/Invoice');
const paymentService = require('../services/paymentService');
const askAiService = require('../services/askAiService');
const logger = require('../config/logger');

/** Fields the answer pipeline needs from each invoice document. */
const ANSWER_FIELDS =
  '_id invoiceNumber vendorName customerName invoiceDate dueDate paidDate totalAmount amountPaid ' +
  'currency paymentStatus category tax subtotal gstRate';

/**
 * POST /api/ai/ask — answer a natural-language question about the user's
 * actual invoice data (rule-based; LLM-swappable behind the same contract).
 */
const ask = catchAsync(async (req, res) => {
  const question = typeof req.body.question === 'string' ? req.body.question.trim() : '';
  if (!question) {
    throw new AppError('Please provide a question.', 400);
  }

  // Keep stored overdue flags fresh so answers reflect the current date.
  await paymentService.refreshOverdueStatuses(req.user._id);

  const invoices = await Invoice.find({ uploadedBy: req.user._id })
    .select(ANSWER_FIELDS)
    .sort({ invoiceDate: -1 })
    .limit(5000)
    .lean();

  logger.info(`Ask Invoice AI — intent resolution for user ${req.user._id}`);

  const answer = askAiService.answerQuestion(question, invoices);

  res.status(200).json({
    success: true,
    data: answer,
  });
});

/** GET /api/ai/suggestions — starter question chips for the Ask UI. */
const suggestions = catchAsync(async (_req, res) => {
  res.status(200).json({
    success: true,
    data: { suggestions: askAiService.getSuggestions() },
  });
});

module.exports = { ask, suggestions };
