const catchAsync = require('../utils/catchAsync');
const Invoice = require('../models/Invoice');
const paymentService = require('../services/paymentService');
const insightService = require('../services/insightService');

/** Fields the insight pipeline needs from each invoice document. */
const INSIGHT_FIELDS =
  '_id invoiceNumber vendorName invoiceDate dueDate paidDate totalAmount amountPaid ' +
  'paymentStatus category tax subtotal gstRate';

/**
 * GET /api/insights — rule-based observations over the user's invoices,
 * surfaced naturally on the dashboard.
 */
const getInsights = catchAsync(async (req, res) => {
  await paymentService.refreshOverdueStatuses(req.user._id);

  const invoices = await Invoice.find({ uploadedBy: req.user._id })
    .select(INSIGHT_FIELDS)
    .lean();

  const insights = insightService.generateInsights(invoices);

  res.status(200).json({
    success: true,
    data: {
      insights,
      generatedAt: new Date().toISOString(),
    },
  });
});

module.exports = { getInsights };
