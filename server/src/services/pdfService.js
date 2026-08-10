/**
 * PDF generation service (Phase F).
 *
 * Renders an invoice document as a professional PDF using pdfkit, styled to
 * match the product's warm document aesthetic (cream / espresso / sand).
 * The PDF is generated on demand from the stored invoice document, so it is
 * always consistent with the latest saved data — nothing is persisted to disk.
 *
 * Supported templates:
 *   classic — cream header band + bordered tables (default)
 *   minimal — hairline rules, no filled bands
 */

const PDFDocument = require('pdfkit');

const C = {
  espresso: '#2E2519',
  brown: '#5C4A33',
  mocha: '#7A6649',
  taupe: '#B3A284',
  sand: '#D8CBB1',
  beige: '#EAE0CD',
  cream: '#FAF6EF',
  ivory: '#F4EEE2',
};

const PAGE = { width: 595, height: 842 }; // A4 (pt)
const MARGIN = 48;

function money(amount, currency = 'INR') {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Draw the classic cream header band and return the y position below it. */
function drawClassicHeader(doc, invoice, seller) {
  doc.rect(0, 0, PAGE.width, 118).fill(C.cream);
  doc
    .fillColor(C.espresso)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('INVOICE', MARGIN, 26, { characterSpacing: 2 });

  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .text(seller.name || 'Your Business', MARGIN, 44);

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(C.mocha)
    .text(
      [seller.address, seller.phone, seller.email].filter(Boolean).join('   ·   '),
      MARGIN,
      72,
      { width: PAGE.width - MARGIN * 2 - 180, characterSpacing: 0.2 }
    );

  if (seller.gstVatNumber) {
    doc.text(`GSTIN: ${seller.gstVatNumber}`, MARGIN, 98, { characterSpacing: 0.2 });
  }

  // Meta block on the right of the band
  const metaX = PAGE.width - MARGIN - 170;
  const meta = [
    ['Invoice #', invoice.invoiceNumber || '—'],
    ['Invoice date', formatDate(invoice.invoiceDate)],
    ['Due date', formatDate(invoice.dueDate)],
    ['Currency', invoice.currency || 'INR'],
  ];
  let my = 30;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.taupe);
  doc.text('Details', metaX, my);
  my += 13;
  doc.font('Helvetica');
  for (const [label, value] of meta) {
    doc.fillColor(C.taupe).fontSize(8).text(label, metaX, my, { width: 58 });
    doc.fillColor(C.espresso).text(value, metaX + 62, my, { width: 108, align: 'right' });
    my += 13;
  }
  return 132;
}

/** Draw the minimal header (no filled band) and return the y position below it. */
function drawMinimalHeader(doc, invoice, seller) {
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(C.espresso)
    .text('INVOICE', MARGIN, 40, { characterSpacing: 3 });

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .text(seller.name || 'Your Business', MARGIN, 68);

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(C.mocha)
    .text(
      [seller.address, seller.phone, seller.email].filter(Boolean).join('   ·   '),
      MARGIN,
      86,
      { width: PAGE.width - MARGIN * 2 - 180 }
    );
  if (seller.gstVatNumber) {
    doc.text(`GSTIN: ${seller.gstVatNumber}`, MARGIN, 104);
  }

  const metaX = PAGE.width - MARGIN - 170;
  const meta = [
    ['Invoice #', invoice.invoiceNumber || '—'],
    ['Invoice date', formatDate(invoice.invoiceDate)],
    ['Due date', formatDate(invoice.dueDate)],
    ['Currency', invoice.currency || 'INR'],
  ];
  let my = 46;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.taupe);
  doc.text('Details', metaX, my);
  my += 13;
  doc.font('Helvetica');
  for (const [label, value] of meta) {
    doc.fillColor(C.taupe).fontSize(8).text(label, metaX, my, { width: 58 });
    doc.fillColor(C.espresso).text(value, metaX + 62, my, { width: 108, align: 'right' });
    my += 13;
  }

  doc
    .moveTo(MARGIN, 128)
    .lineTo(PAGE.width - MARGIN, 128)
    .lineWidth(0.8)
    .strokeColor(C.sand)
    .stroke();
  return 142;
}

/**
 * Generate a PDF for an invoice document.
 * @param {Object} invoice — a lean or hydrated Invoice doc
 * @returns {Promise<Buffer>}
 */
async function generateInvoicePdf(invoice) {
  const template = invoice.template === 'minimal' ? 'minimal' : 'classic';
  const seller = invoice.seller || {};

  const doc = new PDFDocument({
    size: 'A4',
    margin: MARGIN,
    bufferPages: true,
    info: {
      Title: `Invoice ${invoice.invoiceNumber || ''}`.trim(),
      Author: seller.name || 'Invoice AI',
      Subject: 'Generated invoice document',
    },
  });

  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  let y = template === 'classic' ? drawClassicHeader(doc, invoice, seller) : drawMinimalHeader(doc, invoice, seller);

  // ── Parties ─────────────────────────────────────────────
  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(C.taupe)
    .text('BILL TO', MARGIN, y);
  y += 14;
  doc
    .font('Helvetica')
    .fontSize(9.5)
    .fillColor(C.espresso)
    .text(invoice.customerName || '—', MARGIN, y, { continued: false });
  y += 13;
  if (invoice.gstVatNumber) {
    doc.fontSize(8.5).fillColor(C.mocha).text(`GSTIN: ${invoice.gstVatNumber}`, MARGIN, y);
    y += 12;
  }
  if (invoice.poNumber) {
    doc.fontSize(8.5).fillColor(C.mocha).text(`PO #: ${invoice.poNumber}`, MARGIN, y);
    y += 12;
  }
  y += 14;

  // ── Line items table ────────────────────────────────────
  const tableLeft = MARGIN;
  const tableRight = PAGE.width - MARGIN;
  const tableWidth = tableRight - tableLeft;
  const colDesc = tableWidth * 0.44;
  const colQty = tableWidth * 0.12;
  const colRate = tableWidth * 0.2;
  const colAmt = tableWidth * 0.24;

  const drawTableHeader = (yy) => {
    if (template === 'classic') {
      doc.rect(tableLeft, yy, tableWidth, 20).fill(C.espresso);
      doc.fillColor(C.cream);
    } else {
      doc.fillColor(C.espresso);
    }
    doc.font('Helvetica-Bold').fontSize(8).text('DESCRIPTION', tableLeft + 6, yy + 6, { width: colDesc - 8 });
    doc.text('QTY', tableLeft + colDesc + 6, yy + 6, { width: colQty - 8, align: 'right' });
    doc.text('UNIT PRICE', tableLeft + colDesc + colQty + 6, yy + 6, { width: colRate - 8, align: 'right' });
    doc.text('AMOUNT', tableLeft + colDesc + colQty + colRate + 6, yy + 6, { width: colAmt - 12, align: 'right' });
    return yy + 20;
  };

  y = drawTableHeader(y);

  const items = (invoice.lineItems || []).filter((item) => item && (item.description || item.amount));
  if (items.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(C.mocha).text('No line items.', tableLeft + 6, y + 6);
    y += 22;
  } else {
    items.forEach((item, idx) => {
      const isEven = idx % 2 === 0;
      if (isEven && template === 'classic') {
        doc.rect(tableLeft, y, tableWidth, 20).fill(C.ivory);
      } else if (template === 'classic') {
        doc.rect(tableLeft, y, tableWidth, 20).fill(C.cream);
      }
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(C.espresso)
        .text(String(item.description || ''), tableLeft + 6, y + 6, { width: colDesc - 8 });
      doc.text(String(item.quantity || 0), tableLeft + colDesc + 6, y + 6, { width: colQty - 8, align: 'right' });
      doc.text(money(item.unitPrice, invoice.currency), tableLeft + colDesc + colQty + 6, y + 6, {
        width: colRate - 8,
        align: 'right',
      });
      doc
        .font('Helvetica-Bold')
        .text(money(item.amount, invoice.currency), tableLeft + colDesc + colQty + colRate + 6, y + 6, {
          width: colAmt - 12,
          align: 'right',
        });
      y += 20;
    });
  }

  // Table underline
  doc
    .moveTo(tableLeft, y)
    .lineTo(tableRight, y)
    .lineWidth(0.8)
    .strokeColor(C.sand)
    .stroke();
  y += 10;

  // ── Totals block ────────────────────────────────────────
  const totalsWidth = 200;
  const totalsX = tableRight - totalsWidth;
  const totals = [
    { label: 'Subtotal', value: money(invoice.subtotal, invoice.currency), bold: false },
  ];
  if (invoice.discount != null && Number(invoice.discount) > 0) {
    totals.push({ label: 'Discount', value: `−${money(invoice.discount, invoice.currency)}`, bold: false });
  }
  totals.push({ label: 'Tax', value: money(invoice.tax, invoice.currency), bold: false });

  for (const row of totals) {
    doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(C.mocha);
    doc.text(row.label, totalsX, y, { width: 110 });
    doc.fillColor(C.espresso).text(row.value, totalsX + 110, y, { width: 90, align: 'right' });
    y += 15;
  }

  // Grand total band
  if (template === 'classic') {
    doc.rect(totalsX, y - 2, totalsWidth, 24).fill(C.espresso);
    doc.fillColor(C.cream);
  } else {
    doc
      .moveTo(totalsX, y)
      .lineTo(tableRight, y)
      .lineWidth(1)
      .strokeColor(C.espresso)
      .stroke();
    y += 2;
    doc.fillColor(C.espresso);
  }
  doc.font('Helvetica-Bold').fontSize(10).text('Total', totalsX, y + 7, { width: 110 });
  doc.text(money(invoice.totalAmount, invoice.currency), totalsX + 110, y + 7, { width: 90, align: 'right' });
  y += 30;

  // ── Notes / terms ───────────────────────────────────────
  if (invoice.notes || invoice.paymentTerms) {
    y += 8;
    if (invoice.notes) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.taupe).text('NOTES', MARGIN, y);
      y += 13;
      doc.font('Helvetica').fontSize(8.5).fillColor(C.mocha).text(invoice.notes, MARGIN, y, {
        width: tableWidth,
        lineGap: 2,
      });
      y += 24;
    }
    if (invoice.paymentTerms) {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(C.taupe).text('PAYMENT TERMS', MARGIN, y);
      y += 13;
      doc.font('Helvetica').fontSize(8.5).fillColor(C.mocha).text(invoice.paymentTerms, MARGIN, y, {
        width: tableWidth,
      });
    }
  }

  // ── Footer ──────────────────────────────────────────────
  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(C.taupe)
    .text(
      `Generated with Invoice AI · ${formatDate(new Date())} · ${invoice.source === 'generated' ? 'Generated document' : 'Extracted document'}`,
      MARGIN,
      PAGE.height - 40,
      { width: tableWidth, align: 'center' }
    );

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

module.exports = { generateInvoicePdf };
