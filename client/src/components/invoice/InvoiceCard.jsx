import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { formatDate, formatCurrency, formatStatus, formatPaymentStatus, truncateText } from '../../utils/formatters';

function InvoiceCard({ invoice }) {
  const statusInfo = formatStatus(invoice.status);
  const paymentInfo = formatPaymentStatus(invoice.paymentStatus);

  return (
    <Link
      to={`/invoices/${invoice._id}`}
      className="card block p-5 hover:shadow-lift hover:border-taupe transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-espresso text-lg leading-tight">
            {invoice.invoiceNumber || 'No Invoice #'}
          </h3>
          <p className="text-sm text-mocha mt-1">{invoice.vendorName || 'Unknown Vendor'}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`status-pill ${statusInfo.class}`}>{statusInfo.label}</span>
          {paymentInfo.label !== '—' && (
            <span className={`status-pill ${paymentInfo.class}`}>{paymentInfo.label}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-[11px] uppercase tracking-[0.12em] text-taupe">Date</span>
          <p className="font-medium text-espresso tabnum">{formatDate(invoice.invoiceDate)}</p>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-[0.12em] text-taupe">Amount</span>
          <p className="font-medium text-espresso tabnum">
            {formatCurrency(invoice.totalAmount, invoice.currency)}
          </p>
        </div>
        {invoice.dueDate && (
          <div>
            <span className="text-[11px] uppercase tracking-[0.12em] text-taupe">Due</span>
            <p className={`font-medium tabnum ${invoice.paymentStatus === 'overdue' ? 'text-rust' : 'text-espresso'}`}>
              {formatDate(invoice.dueDate)}
            </p>
          </div>
        )}
        {invoice.gstVatNumber && (
          <div>
            <span className="text-[11px] uppercase tracking-[0.12em] text-taupe">GST/VAT</span>
            <p className="font-medium text-espresso">{truncateText(invoice.gstVatNumber, 18)}</p>
          </div>
        )}
      </div>

      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <div className="mt-4 pt-3 border-t border-sand/60">
          <p className="text-xs text-mocha">
            {invoice.lineItems.length} line item{invoice.lineItems.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {invoice.fileType && (
        <div className="mt-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-taupe">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
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
    dueDate: PropTypes.string,
    totalAmount: PropTypes.number,
    currency: PropTypes.string,
    status: PropTypes.string,
    paymentStatus: PropTypes.string,
    gstVatNumber: PropTypes.string,
    lineItems: PropTypes.array,
    fileType: PropTypes.string,
  }).isRequired,
};

export default InvoiceCard;
