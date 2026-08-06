import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatDate, formatCurrency, formatStatus, truncateText } from '../../utils/formatters';

function InvoiceCard({ invoice }) {
  const statusInfo = formatStatus(invoice.status);

  return (
    <Link
      to={`/invoices/${invoice._id}`}
      className="card block hover:shadow-md transition-shadow duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {invoice.invoiceNumber || 'No Invoice #'}
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">{invoice.vendorName || 'Unknown Vendor'}</p>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
          {statusInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Date</span>
          <p className="font-medium text-gray-700">{formatDate(invoice.invoiceDate)}</p>
        </div>
        <div>
          <span className="text-gray-500">Amount</span>
          <p className="font-medium text-gray-700">{formatCurrency(invoice.totalAmount, invoice.currency)}</p>
        </div>
        {invoice.gstVatNumber && (
          <div className="col-span-2">
            <span className="text-gray-500">GST/VAT</span>
            <p className="font-medium text-gray-700">{invoice.gstVatNumber}</p>
          </div>
        )}
      </div>

      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            {invoice.lineItems.length} line item{invoice.lineItems.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {invoice.fileType && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {invoice.fileType.split('/')[1].toUpperCase()}
          </span>
        </div>
      )}
    </Link>
  );
}

InvoiceCard.propTypes = {
  invoice: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    invoiceNumber: PropTypes.string,
    vendorName: PropTypes.string,
    invoiceDate: PropTypes.string,
    totalAmount: PropTypes.number,
    currency: PropTypes.string,
    status: PropTypes.string,
    gstVatNumber: PropTypes.string,
    lineItems: PropTypes.array,
    fileType: PropTypes.string,
  }).isRequired,
};

export default InvoiceCard;
