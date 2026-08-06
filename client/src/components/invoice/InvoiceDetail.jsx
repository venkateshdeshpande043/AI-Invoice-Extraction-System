import PropTypes from 'prop-types';
import { formatDate, formatCurrency, formatStatus } from '../../utils/formatters';
import Button from '../common/Button';

function InvoiceDetail({ invoice, onExport }) {
  const statusInfo = formatStatus(invoice.status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {invoice.invoiceNumber || 'Unnumbered Invoice'}
          </h2>
          <p className="text-gray-600 mt-1">{invoice.vendorName || 'Unknown Vendor'}</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}>
          {statusInfo.label}
        </span>
      </div>

      {invoice.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{invoice.errorMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
        <InfoCard label="Due Date" value={formatDate(invoice.dueDate)} />
        <InfoCard label="GST/VAT Number" value={invoice.gstVatNumber || '—'} />
        <InfoCard label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} />
        <InfoCard label="Tax" value={formatCurrency(invoice.tax, invoice.currency)} />
        <InfoCard label="Total Amount" value={formatCurrency(invoice.totalAmount, invoice.currency)} highlight />
      </div>

      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoice.lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 text-sm text-gray-700">{item.description}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{item.quantity}</td>
                    <td className="px-3 py-2 text-sm text-gray-700 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 font-medium text-right">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {invoice.fileUrl && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Original File</h3>
          <a
            href={invoice.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          >
            View uploaded file ({invoice.fileType?.split('/')[1]?.toUpperCase() || 'Unknown'})
          </a>
        </div>
      )}

      {invoice.rawOcrText && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Raw OCR Text</h3>
          <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-40 overflow-y-auto bg-gray-50 rounded p-3">
            {invoice.rawOcrText}
          </pre>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => onExport('json')}>
          Export JSON
        </Button>
        <Button variant="secondary" onClick={() => onExport('csv')}>
          Export CSV
        </Button>
      </div>
    </div>
  );
}

function InfoCard({ label, value, highlight = false }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 ${highlight ? 'text-xl font-bold text-gray-900' : 'text-base font-medium text-gray-700'}`}>
        {value}
      </p>
    </div>
  );
}

InfoCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  highlight: PropTypes.bool,
};

InvoiceDetail.propTypes = {
  invoice: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    invoiceNumber: PropTypes.string,
    vendorName: PropTypes.string,
    invoiceDate: PropTypes.string,
    dueDate: PropTypes.string,
    gstVatNumber: PropTypes.string,
    subtotal: PropTypes.number,
    tax: PropTypes.number,
    totalAmount: PropTypes.number,
    currency: PropTypes.string,
    status: PropTypes.string,
    errorMessage: PropTypes.string,
    lineItems: PropTypes.array,
    fileUrl: PropTypes.string,
    fileType: PropTypes.string,
    rawOcrText: PropTypes.string,
  }).isRequired,
  onExport: PropTypes.func.isRequired,
};

export default InvoiceDetail;
