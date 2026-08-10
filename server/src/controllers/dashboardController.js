const catchAsync = require('../utils/catchAsync');
const Invoice = require('../models/Invoice');
const paymentService = require('../services/paymentService');
const { roundMoney } = require('../utils/helpers');

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(year, month) {
  return `${MONTH_NAMES[month]} ${year}`;
}

/** Project each year-month group into { month: 'Jan 2026', ...counts }. */
function projectMonthGroups(groups, extraProjection) {
  return groups
    .slice()
    .reverse()
    .map((g) => ({
      month: monthLabel(g._id.year, g._id.month),
      ...extraProjection(g),
    }));
}

const getStats = catchAsync(async (req, res) => {
  const userId = req.user._id;
  await paymentService.refreshOverdueStatuses(userId);

  const [
    totalInvoices,
    statusCounts,
    paymentTotals,
    recentUploads,
    volumeGroups,
    cashFlowGroups,
    topVendorGroups,
    overdueInvoices,
    upcomingInvoices,
    gstGroups,
  ] = await Promise.all([
    Invoice.countDocuments({ uploadedBy: userId }),
    Invoice.aggregate([
      { $match: { uploadedBy: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: null,
          paidTotal: { $sum: '$amountPaid' },
          totalValue: { $sum: '$totalAmount' },
        },
      },
    ]),
    Invoice.find({ uploadedBy: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    Invoice.aggregate([
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]),
    Invoice.aggregate([
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          issued: { $sum: '$totalAmount' },
          paid: { $sum: '$amountPaid' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]),
    Invoice.aggregate([
      { $match: { uploadedBy: userId, vendorName: { $nin: [null, ''] } } },
      { $group: { _id: '$vendorName', totalSpend: { $sum: '$totalAmount' } } },
      { $sort: { totalSpend: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          vendorName: '$_id',
          totalSpend: { $round: ['$totalSpend', 2] },
        },
      },
    ]),
    Invoice.find({ uploadedBy: userId, paymentStatus: 'overdue' })
      .sort({ dueDate: 1 })
      .limit(10)
      .select('invoiceNumber vendorName dueDate totalAmount amountPaid currency paymentStatus')
      .lean(),
    Invoice.find({ uploadedBy: userId, paymentStatus: { $in: ['unpaid', 'partial'] }, dueDate: { $ne: null } })
      .sort({ dueDate: 1 })
      .limit(10)
      .select('invoiceNumber vendorName dueDate totalAmount amountPaid currency paymentStatus')
      .lean(),
    Invoice.aggregate([
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: null,
          taxedInvoices: { $sum: { $cond: [{ $gt: ['$tax', 0] }, 1, 0] } },
          totalTax: { $sum: '$tax' },
          withRate: { $sum: { $cond: [{ $ne: ['$gstRate', null] }, 1, 0] } },
          rateSum: { $sum: { $cond: [{ $ne: ['$gstRate', null] }, '$gstRate', 0] } },
        },
      },
    ]),
  ]);

  const statusMap = {};
  for (const s of statusCounts) statusMap[s._id] = s.count;

  const totals = paymentTotals[0] || { paidTotal: 0, totalValue: 0 };
  const outstandingTotal = roundMoney(Math.max(totals.totalValue - totals.paidTotal, 0));
  const [paidCount, overdueCount] = await Promise.all([
    Invoice.countDocuments({ uploadedBy: userId, paymentStatus: 'paid' }),
    Invoice.countDocuments({ uploadedBy: userId, paymentStatus: 'overdue' }),
  ]);

  const gstRow = gstGroups[0];
  const gstSummary = {
    totalTax: roundMoney(gstRow ? gstRow.totalTax : 0),
    taxedInvoices: gstRow ? gstRow.taxedInvoices : 0,
    avgRate: gstRow && gstRow.withRate > 0 ? Math.round((gstRow.rateSum / gstRow.withRate) * 100) / 100 : null,
    withRate: gstRow ? gstRow.withRate : 0,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueAlerts = overdueInvoices.map((inv) => {
    const due = new Date(inv.dueDate);
    const daysOverdue = Math.max(Math.floor((today.getTime() - due.getTime()) / 86400000), 1);
    return { ...inv, daysOverdue };
  });

  res.status(200).json({
    success: true,
    data: {
      totalInvoices,
      processedCount: statusMap.processed || 0,
      pendingCount: statusMap.pending || 0,
      failedCount: statusMap.failed || 0,
      paidCount,
      paidTotal: roundMoney(totals.paidTotal),
      outstandingTotal,
      overdueCount,
      gstSummary,
      upcomingDue: upcomingInvoices,
      overdueAlerts,
      recentUploads,
      invoicesByMonth: projectMonthGroups(volumeGroups, (g) => ({ count: g.count })),
      paymentTrends: projectMonthGroups(cashFlowGroups, (g) => ({
        issued: roundMoney(g.issued),
        paid: roundMoney(g.paid),
      })),
      topVendors: topVendorGroups,
    },
  });
});

module.exports = { getStats };
