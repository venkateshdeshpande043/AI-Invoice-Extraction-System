const catchAsync = require('../utils/catchAsync');
const Invoice = require('../models/Invoice');

const getStats = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const [totalInvoices, statusCounts, recentUploads, invoicesByMonth] = await Promise.all([
    Invoice.countDocuments({ uploadedBy: userId }),
    Invoice.aggregate([
      { $match: { uploadedBy: userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Invoice.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Invoice.aggregate([
      { $match: { uploadedBy: userId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              {
                $arrayElemAt: [
                  ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                  '$_id.month',
                ],
              },
              ' ',
              { $toString: '$_id.year' },
            ],
          },
          count: 1,
        },
      },
    ]),
  ]);

  const processedCount = statusCounts.find((s) => s._id === 'processed')?.count || 0;
  const pendingCount = statusCounts.find((s) => s._id === 'pending')?.count || 0;
  const failedCount = statusCounts.find((s) => s._id === 'failed')?.count || 0;

  res.status(200).json({
    success: true,
    data: {
      totalInvoices,
      processedCount,
      pendingCount,
      failedCount,
      recentUploads,
      invoicesByMonth: invoicesByMonth.reverse(),
    },
  });
});

module.exports = { getStats };
