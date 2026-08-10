/**
 * Vendor controller (Phase D) — aggregated vendor profiles built from
 * the invoice collection (no duplicated vendor data).
 */
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { parsePagination } = require('../utils/helpers');
const vendorService = require('../services/vendorService');

exports.list = catchAsync(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await vendorService.listVendors({
    userId: req.user._id,
    search: req.query.search || '',
    page,
    limit,
    sortBy: req.query.sortBy || 'spend',
    sortOrder: req.query.sortOrder || 'desc',
  });

  const totalPages = Math.max(1, Math.ceil(result.totalCount / limit));

  res.json({
    success: true,
    data: {
      vendors: result.vendors,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount: result.totalCount,
      },
    },
  });
});

exports.detail = catchAsync(async (req, res) => {
  const vendorName = req.params.name; // already URI-decoded by Express
  const { page, limit } = parsePagination(req.query);

  const result = await vendorService.getVendor({
    userId: req.user._id,
    vendorName,
    page,
    limit,
  });

  if (!result.summary || !result.summary.totalInvoices) {
    throw new AppError('Vendor not found.', 404);
  }

  res.json({
    success: true,
    data: {
      summary: result.summary,
      invoices: result.invoices,
    },
  });
});
