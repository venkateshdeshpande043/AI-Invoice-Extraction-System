function exportAsJSON(invoice) {
  const data = prepareExportData(invoice);
  return {
    contentType: 'application/json',
    filename: `invoice-${invoice._id}.json`,
    content: JSON.stringify(data, null, 2),
  };
}

function exportAsCSV(invoice) {
  const headers = [
    'InvoiceNumber', 'VendorName', 'CustomerName', 'InvoiceDate', 'DueDate',
    'GST/VAT Number', 'GSTRate', 'Currency', 'Subtotal', 'Discount',
    'Tax', 'TotalAmount', 'PONumber',
    'Status', 'ItemDescription', 'ItemQuantity', 'ItemUnitPrice', 'ItemAmount',
  ];

  const baseData = prepareExportData(invoice);
  const rows = [];

  if (baseData.lineItems && baseData.lineItems.length > 0) {
    for (const item of baseData.lineItems) {
      rows.push([
        escapeCsv(baseData.invoiceNumber),
        escapeCsv(baseData.vendorName),
        escapeCsv(baseData.customerName),
        baseData.invoiceDate || '',
        baseData.dueDate || '',
        escapeCsv(baseData.gstVatNumber),
        baseData.gstRate,
        baseData.currency,
        baseData.subtotal,
        baseData.discount,
        baseData.tax,
        baseData.totalAmount,
        escapeCsv(baseData.poNumber),
        baseData.status,
        escapeCsv(item.description),
        item.quantity,
        item.unitPrice,
        item.amount,
      ]);
    }
  } else {
    rows.push([
      escapeCsv(baseData.invoiceNumber),
      escapeCsv(baseData.vendorName),
      escapeCsv(baseData.customerName),
      baseData.invoiceDate || '',
      baseData.dueDate || '',
      escapeCsv(baseData.gstVatNumber),
      baseData.gstRate,
      baseData.currency,
      baseData.subtotal,
      baseData.discount,
      baseData.tax,
      baseData.totalAmount,
      escapeCsv(baseData.poNumber),
      baseData.status,
      '', '', '', '',
    ]);
  }

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return {
    contentType: 'text/csv',
    filename: `invoice-${invoice._id}.csv`,
    content: csvContent,
  };
}

function prepareExportData(invoice) {
  return {
    invoiceNumber: invoice.invoiceNumber || '',
    vendorName: invoice.vendorName || '',
    customerName: invoice.customerName || '',
    invoiceDate: invoice.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : '',
    dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
    gstVatNumber: invoice.gstVatNumber || '',
    gstRate: invoice.gstRate,
    currency: invoice.currency || 'INR',
    subtotal: invoice.subtotal || 0,
    discount: invoice.discount,
    tax: invoice.tax || 0,
    totalAmount: invoice.totalAmount || 0,
    poNumber: invoice.poNumber || '',
    status: invoice.status || 'pending',
    lineItems: (invoice.lineItems || []).map((item) => ({
      description: item.description || '',
      quantity: item.quantity || 0,
      unitPrice: item.unitPrice || 0,
      amount: item.amount || 0,
    })),
  };
}

function escapeCsv(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Bulk CSV export for a list of invoices (used by /api/invoices/export). */
function exportManyAsCSV(invoices) {
  const headers = [
    'InvoiceNumber', 'VendorName', 'CustomerName', 'InvoiceDate', 'DueDate',
    'GST/VAT Number', 'GSTRate', 'Currency', 'Subtotal', 'Discount',
    'Tax', 'TotalAmount', 'PONumber', 'Status', 'PaymentStatus',
    'AmountPaid', 'Balance', 'ItemCount',
  ];

  const rows = invoices.map((inv) => {
    const base = prepareExportData(inv);
    const balance = Math.max((Number(inv.totalAmount) || 0) - (Number(inv.amountPaid) || 0), 0);
    return [
      escapeCsv(base.invoiceNumber),
      escapeCsv(base.vendorName),
      escapeCsv(base.customerName),
      base.invoiceDate || '',
      base.dueDate || '',
      escapeCsv(base.gstVatNumber),
      base.gstRate,
      base.currency,
      base.subtotal,
      base.discount,
      base.tax,
      base.totalAmount,
      escapeCsv(base.poNumber),
      base.status,
      inv.paymentStatus || 'unpaid',
      inv.amountPaid || 0,
      balance,
      (inv.lineItems || []).length,
    ];
  });

  return {
    contentType: 'text/csv',
    filename: 'invoices-export.csv',
    content: [headers.join(','), ...rows.map((row) => row.join(','))].join('\n'),
  };
}

/** Bulk JSON export for a list of invoices. */
function exportManyAsJSON(invoices) {
  return {
    contentType: 'application/json',
    filename: 'invoices-export.json',
    content: JSON.stringify(invoices.map(prepareExportData), null, 2),
  };
}

module.exports = { exportAsJSON, exportAsCSV, exportManyAsCSV, exportManyAsJSON };
