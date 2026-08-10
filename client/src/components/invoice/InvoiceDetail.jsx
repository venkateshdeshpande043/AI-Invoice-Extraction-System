import PropTypes from 'prop-types';
import {
  formatDate,
  formatCurrency,
  formatStatus,
  formatPaymentStatus,
  formatValidationStatus,
  paymentMethodLabel,
} from '../../utils/formatters';
import Button from '../common/Button';

const SEVERITY_STYLES = {
  error: { label: 'Error', cls: 'bg-rose-50 border-rose-200 text-rose-900' },
  anomaly: { label: 'Anomaly', cls: 'bg-orange-50 border-orange-200 text-orange-900' },
  warning: { label: 'Warning', cls: 'bg-amber-50 border-amber-200 text-amber-900' },
};

function InvoiceDetail({ invoice, onExport, onRecordPayment }) {
  const statusInfo = formatStatus(invoice.status);
  const paymentInfo = formatPaymentStatus(invoice.paymentStatus);
  const validationInfo = formatValidationStatus(invoice.validation?.status);
  const balance = Math.max((invoice.totalAmount || 0) - (invoice.amountPaid || 0), 0);
  const issues = invoice.validation?.issues || [];
  const payments = invoice.payments || [];
  const isGenerated = invoice.source === 'generated';
  const seller = invoice.seller || {};

  return (
    <div className="space-y-6">
      {invoice.errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <p className="text-sm text-rose-900">{invoice.errorMessage}</p>
        </div>
      )}

      {invoice.duplicateOf && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-900">Possible duplicate invoice</p>
            <p className="text-sm text-amber-800 mt-0.5">
              {invoice.duplicateReason || 'This invoice looks similar to another one you have uploaded.'}
            </p>
          </div>
        </div>
      )}

      {/* Document header */}
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow mb-1.5">Invoice</p>
            <h2 className="text-3xl font-semibold text-espresso">
              {invoice.invoiceNumber || 'Unnumbered Invoice'}
            </h2>
            <p className="text-mocha mt-1.5">{invoice.vendorName || 'Unknown Vendor'}</p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="flex items-center gap-2">
            {isGenerated && (
              <span className="status-pill bg-ivory text-brown border border-sand">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Generated
              </span>
            )}
            <span className={`status-pill ${statusInfo.class}`}>{statusInfo.label}</span>
            <span className={`status-pill ${paymentInfo.class}`}>{paymentInfo.label}</span>
          </div>
            {invoice.poNumber && (
              <p className="text-sm text-mocha">
                PO: <span className="font-medium text-espresso tabnum">{invoice.poNumber}</span>
              </p>
            )}
            {invoice.customerName && (
              <p className="text-sm text-mocha">
                Bill to: <span className="font-medium text-espresso">{invoice.customerName}</span>
              </p>
            )}
          </div>
        </div>

        {isGenerated && seller && (seller.name || seller.gstVatNumber) && (
          <div className="mt-6 pt-5 border-t border-sand/70 grid sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-taupe mb-1">Issued by</p>
              <p className="text-sm font-medium text-espresso">{seller.name || '—'}</p>
              {seller.address && <p className="text-sm text-mocha mt-0.5">{seller.address}</p>}
              {(seller.phone || seller.email) && (
                <p className="text-sm text-mocha mt-0.5">
                  {[seller.phone, seller.email].filter(Boolean).join(' · ')}
                </p>
              )}
              {seller.gstVatNumber && (
                <p className="text-sm text-mocha mt-0.5">GSTIN: {seller.gstVatNumber}</p>
              )}
            </div>
            {invoice.notes && (
              <div>
                <p className="text-[11px] uppercase tracking-[0.12em] text-taupe mb-1">Notes</p>
                <p className="text-sm text-mocha leading-relaxed">{invoice.notes}</p>
              </div>
            )}
            {invoice.paymentTerms && (
              <div className={invoice.notes ? 'sm:col-span-2' : ''}>
                <p className="text-[11px] uppercase tracking-[0.12em] text-taupe mb-1">Payment terms</p>
                <p className="text-sm text-mocha">{invoice.paymentTerms}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
          <Field label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
          <Field label="Due Date" value={formatDate(invoice.dueDate)} />
          <Field label="GST/VAT Number" value={invoice.gstVatNumber || '—'} />
          <Field label="GST Rate" value={invoice.gstRate != null ? `${invoice.gstRate}%` : '—'} />
          <Field label="Currency" value={invoice.currency || 'INR'} />
          <Field label="Subtotal" value={formatCurrency(invoice.subtotal, invoice.currency)} />
          <Field label="Discount" value={formatCurrency(invoice.discount, invoice.currency)} />
          <Field label="Tax" value={formatCurrency(invoice.tax, invoice.currency)} />
        </div>

        <div className="mt-6 pt-5 border-t border-sand/70 flex justify-end">
          <div className="w-full max-w-xs space-y-1.5">
            <div className="flex justify-between text-sm text-mocha">
              <span>Total</span>
              <span className="tabnum font-medium text-espresso">
                {formatCurrency(invoice.totalAmount, invoice.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Validation report */}
      {invoice.validation && invoice.validation.status && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="eyebrow mb-1">Extraction Review</p>
              <h3 className="text-base font-semibold text-espresso">Field validation report</h3>
            </div>
            <span className={`status-pill ${validationInfo.class}`}>{validationInfo.label}</span>
          </div>
          {issues.length === 0 ? (
            <p className="text-sm text-emerald-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
              </svg>
              All extracted fields passed the consistency checks.
            </p>
          ) : (
            <ul className="space-y-2">
              {issues.map((item, idx) => {
                const style = SEVERITY_STYLES[item.severity] || SEVERITY_STYLES.warning;
                return (
                  <li
                    key={idx}
                    className={`rounded-md border px-3 py-2.5 text-sm ${style.cls}`}
                  >
                    <span className="font-semibold mr-2">{style.label}:</span>
                    {item.message}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Line items */}
      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-3">
            <p className="eyebrow">Line Items</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sand/50">
              <thead className="bg-ivory/60">
                <tr>
                  <th className="table-head">Description</th>
                  <th className="table-head text-right">Qty</th>
                  <th className="table-head text-right">Unit Price</th>
                  <th className="table-head text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-sand/50">
                {invoice.lineItems.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-3 text-sm text-espresso">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-mocha text-right tabnum">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-mocha text-right tabnum">
                      {formatCurrency(item.unitPrice, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-espresso text-right tabnum">
                      {formatCurrency(item.amount, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-ivory/40 border-t border-sand/60 flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-mocha">
                <span>Subtotal</span>
                <span className="tabnum">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.discount != null && (
                <div className="flex justify-between text-mocha">
                  <span>Discount</span>
                  <span className="tabnum">−{formatCurrency(invoice.discount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-mocha">
                <span>Tax</span>
                <span className="tabnum">{formatCurrency(invoice.tax, invoice.currency)}</span>
              </div>
              <div className="flex justify-between font-semibold text-espresso border-t border-sand/70 pt-2">
                <span>Total</span>
                <span className="tabnum">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment */}
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow mb-1.5">Payment</p>
            <p className="text-2xl font-display font-semibold text-espresso tabnum">
              {formatCurrency(invoice.amountPaid || 0, invoice.currency)}
              <span className="text-mocha text-base font-sans font-normal">
                {' '}paid of {formatCurrency(invoice.totalAmount, invoice.currency)}
              </span>
            </p>
          </div>
          {onRecordPayment && (
            <Button
              variant={paymentInfo.label === 'Paid' && balance <= 0 ? 'secondary' : 'primary'}
              onClick={onRecordPayment}
              disabled={paymentInfo.label === 'Paid' && balance <= 0}
            >
              {paymentInfo.label === 'Paid' && balance <= 0 ? 'Paid in full' : 'Record payment'}
            </Button>
          )}
        </div>
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
          <Field label="Balance due" value={formatCurrency(balance, invoice.currency)} />
          <Field label="Due date" value={formatDate(invoice.dueDate)} />
          <Field label="Paid on" value={formatDate(invoice.paidDate)} />
          <Field label="Method" value={paymentMethodLabel(invoice.paymentMethod)} />
        </div>

        {payments.length > 0 && (
          <div className="mt-6 pt-5 border-t border-sand/70">
            <p className="eyebrow mb-3">Payment History</p>
            <ul className="space-y-2.5">
              {payments.map((payment, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-mocha tabnum">{formatDate(payment.date)}</span>
                    <span className="text-taupe text-xs">{paymentMethodLabel(payment.method)}</span>
                  </div>
                  <span className="font-medium text-espresso tabnum">
                    {formatCurrency(payment.amount, invoice.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {isGenerated && (
        <div className="card p-6">
          <p className="eyebrow mb-2">Document</p>
          <p className="text-sm text-mocha">
            This invoice was generated in-app{invoice.template ? ` using the “${invoice.template}” template` : ''} and saved to your account.
          </p>
        </div>
      )}

      {invoice.fileUrl && (
        <div className="card p-6">
          <p className="eyebrow mb-2">Original File</p>
          <a
            href={invoice.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brown hover:text-espresso text-sm font-medium inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
            View uploaded file ({invoice.fileType?.split('/')[1]?.toUpperCase() || 'Unknown'})
          </a>
        </div>
      )}

      {invoice.rawOcrText && (
        <div className="card p-6">
          <p className="eyebrow mb-2">Raw OCR Text</p>
          <pre className="text-xs text-mocha whitespace-pre-wrap max-h-40 overflow-y-auto bg-ivory/50 border border-sand/60 rounded-md p-3">
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

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-taupe mb-1">{label}</p>
      <p className="text-base font-medium text-espresso tabnum">{value}</p>
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

InvoiceDetail.propTypes = {
  invoice: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    invoiceNumber: PropTypes.string,
    vendorName: PropTypes.string,
    customerName: PropTypes.string,
    invoiceDate: PropTypes.string,
    dueDate: PropTypes.string,
    gstVatNumber: PropTypes.string,
    gstRate: PropTypes.number,
    subtotal: PropTypes.number,
    discount: PropTypes.number,
    tax: PropTypes.number,
    totalAmount: PropTypes.number,
    amountPaid: PropTypes.number,
    paidDate: PropTypes.string,
    paymentMethod: PropTypes.string,
    paymentStatus: PropTypes.string,
    currency: PropTypes.string,
    status: PropTypes.string,
    errorMessage: PropTypes.string,
    poNumber: PropTypes.string,
    lineItems: PropTypes.array,
    payments: PropTypes.array,
    validation: PropTypes.shape({
      status: PropTypes.string,
      issues: PropTypes.array,
    }),
    duplicateOf: PropTypes.string,
    duplicateReason: PropTypes.string,
    fileUrl: PropTypes.string,
    fileType: PropTypes.string,
    rawOcrText: PropTypes.string,
  }).isRequired,
  onExport: PropTypes.func.isRequired,
  onRecordPayment: PropTypes.func,
};

export default InvoiceDetail;
