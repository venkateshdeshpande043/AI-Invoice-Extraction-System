import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import {
  formatDate,
  formatCurrency,
  formatStatus,
  formatPaymentStatus,
  formatValidationStatus,
} from '../../utils/formatters';

function InvoiceTable({ invoices, onDelete }) {
  if (!invoices || invoices.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-sand/60">
        <thead className="bg-ivory/60">
          <tr>
            <th className="table-head">Invoice #</th>
            <th className="table-head">Vendor</th>
            <th className="table-head">Date</th>
            <th className="table-head">Due Date</th>
            <th className="table-head text-right">Amount</th>
            <th className="table-head">Status</th>
            <th className="table-head">Payment</th>
            <th className="table-head text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-sand/50">
          {invoices.map((invoice) => {
            const statusInfo = formatStatus(invoice.status);
            const paymentInfo = formatPaymentStatus(invoice.paymentStatus);
            const validationInfo = formatValidationStatus(invoice.validation?.status);
            const overdue = invoice.paymentStatus === 'overdue';
            const duplicate = invoice.duplicateOf;
            return (
              <tr key={invoice._id} className="hover:bg-ivory/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-brown">
                  <Link to={`/invoices/${invoice._id}`} className="hover:underline">
                    {invoice.invoiceNumber || '—'}
                  </Link>
                  {invoice.source === 'generated' && (
                    <span
                      className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-ivory text-brown border border-sand cursor-help"
                      title="Created in-app, not extracted"
                    >
                      Gen
                    </span>
                  )}
                  {duplicate && (
                    <span
                      className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300 cursor-help"
                      title={invoice.duplicateReason || 'Possible duplicate'}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Dup
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-espresso">
                  {invoice.vendorName || invoice.customerName || '—'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-mocha tabnum">
                  {formatDate(invoice.invoiceDate)}
                </td>
                <td
                  className={`px-4 py-3 whitespace-nowrap text-sm tabnum ${
                    overdue ? 'text-rust font-medium' : 'text-mocha'
                  }`}
                >
                  {formatDate(invoice.dueDate)}
                  {overdue && (
                    <span className="ml-2 status-pill bg-rose-100 text-rose-900 border border-rose-200">
                      Overdue
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-espresso text-right tabnum">
                  {formatCurrency(invoice.totalAmount, invoice.currency)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`status-pill ${statusInfo.class}`}>{statusInfo.label}</span>
                    {invoice.validation?.status && invoice.validation.status !== 'valid' && (
                      <span
                        className={`status-pill ${validationInfo.class}`}
                        title={`Validation: ${validationInfo.label}`}
                      >
                        {validationInfo.label}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`status-pill ${paymentInfo.class}`}>{paymentInfo.label}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (window.confirm('Are you sure you want to delete this invoice?')) {
                        onDelete(invoice._id);
                      }
                    }}
                    className="text-taupe hover:text-rust transition-colors"
                    title="Delete invoice"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

InvoiceTable.propTypes = {
  invoices: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default InvoiceTable;
