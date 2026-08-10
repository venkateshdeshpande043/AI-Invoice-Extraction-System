import PropTypes from 'prop-types';

const toNumber = (value) => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const money = (value, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency || 'INR',
    maximumFractionDigits: 2,
  }).format(toNumber(value));

function InvoicePreview({ data }) {
  const { seller, customerName, customerGstin, invoiceNumber, invoiceDate, dueDate, poNumber, currency, notes, paymentTerms, template } = data;

  const items = (data.lineItems || []).map((item) => ({
    ...item,
    amount: toNumber(item.amount),
  }));
  const subtotal = Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  const taxRate = toNumber(data.taxRate);
  const tax = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const discount = toNumber(data.discount);
  const total = Math.round((subtotal + tax - discount) * 100) / 100;

  const isMinimal = template === 'minimal';

  const meta = [
    ['Invoice #', invoiceNumber || '—'],
    ['Invoice date', formatDate(invoiceDate)],
    ['Due date', formatDate(dueDate)],
    ['Currency', currency || 'INR'],
  ];

  return (
    <div
      className={`bg-white border ${isMinimal ? 'border-sand' : 'border-sand/80'} shadow-lift text-espresso`}
    >
      {/* Header band */}
      {!isMinimal && (
        <div className="bg-ivory border-b border-sand/70 px-8 py-6 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-taupe mb-1">
              Invoice
            </p>
            <p className="font-display text-2xl font-semibold leading-tight">
              {seller.name || 'Your Business'}
            </p>
            {(seller.address || seller.phone || seller.email) && (
              <p className="mt-1.5 text-xs text-mocha max-w-xs leading-relaxed">
                {[seller.address, seller.phone, seller.email].filter(Boolean).join('  ·  ')}
              </p>
            )}
            {seller.gstVatNumber && (
              <p className="mt-1 text-xs text-mocha">GSTIN: {seller.gstVatNumber}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold tracking-[0.08em] mb-3">INVOICE</p>
            <dl className="space-y-1 text-xs">
              {meta.map(([label, value]) => (
                <div key={label} className="flex gap-4 justify-end">
                  <dt className="text-taupe">{label}</dt>
                  <dd className="font-medium tabnum">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {isMinimal && (
        <div className="px-8 py-7">
          <div className="flex items-start justify-between border-b border-sand/70 pb-6">
            <div>
              <p className="font-display text-xl font-semibold">{seller.name || 'Your Business'}</p>
              <p className="mt-1 text-xs text-mocha max-w-xs leading-relaxed">
                {[seller.address, seller.phone, seller.email].filter(Boolean).join('  ·  ') || ' '}
              </p>
              {seller.gstVatNumber && <p className="mt-1 text-xs text-mocha">GSTIN: {seller.gstVatNumber}</p>}
            </div>
            <p className="font-display text-xl font-semibold tracking-[0.14em]">INVOICE</p>
          </div>
          <dl className="mt-4 space-y-1 text-xs text-right ml-auto w-56">
            {meta.map(([label, value]) => (
              <div key={label} className="flex gap-4 justify-end">
                <dt className="text-taupe">{label}</dt>
                <dd className="font-medium tabnum">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="px-8 py-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-taupe mb-1">Bill to</p>
          <p className="text-sm font-medium">{customerName || '—'}</p>
          {customerGstin && <p className="text-xs text-mocha mt-0.5">GSTIN: {customerGstin}</p>}
          {poNumber && <p className="text-xs text-mocha mt-0.5">PO #: {poNumber}</p>}
        </div>

        {/* Line items */}
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className={isMinimal ? 'border-b border-espresso' : 'bg-espresso text-cream'}>
                <th className={`text-left text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-2 ${isMinimal ? 'text-espresso' : 'text-cream'}`}>
                  Description
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-2 tabnum">
                  Qty
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-2 tabnum">
                  Unit price
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] px-3 py-2 tabnum">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/40">
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-xs text-mocha italic">
                    Line items will appear here.
                  </td>
                </tr>
              )}
              {items.map((item, index) => (
                <tr key={index} className={!isMinimal && index % 2 === 0 ? 'bg-ivory/40' : ''}>
                  <td className="px-3 py-2 text-xs">{item.description || '—'}</td>
                  <td className="px-3 py-2 text-xs text-right tabnum">{item.quantity}</td>
                  <td className="px-3 py-2 text-xs text-right tabnum">{money(item.unitPrice, currency)}</td>
                  <td className="px-3 py-2 text-xs text-right font-medium tabnum">{money(item.amount, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <dl className={`w-56 space-y-1.5 text-sm ${isMinimal ? '' : 'border border-sand/70 rounded-md p-4 bg-ivory/40'}`}>
            <div className="flex justify-between text-mocha">
              <dt>Subtotal</dt>
              <dd className="tabnum">{money(subtotal, currency)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-mocha">
                <dt>Discount</dt>
                <dd className="tabnum">−{money(discount, currency)}</dd>
              </div>
            )}
            <div className="flex justify-between text-mocha">
              <dt>Tax {taxRate > 0 ? `(${taxRate}%)` : ''}</dt>
              <dd className="tabnum">{money(tax, currency)}</dd>
            </div>
            <div className={`flex justify-between font-semibold pt-1.5 mt-1.5 ${isMinimal ? 'border-t border-espresso' : 'border-t border-sand/70'}`}>
              <dt>Total</dt>
              <dd className="tabnum">{money(total, currency)}</dd>
            </div>
          </dl>
        </div>

        {/* Notes & terms */}
        {(notes || paymentTerms) && (
          <div className="mt-6 grid sm:grid-cols-2 gap-5">
            {notes && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-taupe mb-1">Notes</p>
                <p className="text-xs text-mocha leading-relaxed">{notes}</p>
              </div>
            )}
            {paymentTerms && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-taupe mb-1">
                  Payment terms
                </p>
                <p className="text-xs text-mocha leading-relaxed">{paymentTerms}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-8 py-3 border-t border-sand/50 text-center">
        <p className="text-[10px] text-taupe tracking-wide">
          Generated with Invoice AI · live preview — download opens the finished PDF
        </p>
      </div>
    </div>
  );
}

InvoicePreview.propTypes = {
  data: PropTypes.shape({
    seller: PropTypes.object,
    customerName: PropTypes.string,
    customerGstin: PropTypes.string,
    invoiceNumber: PropTypes.string,
    invoiceDate: PropTypes.string,
    dueDate: PropTypes.string,
    poNumber: PropTypes.string,
    currency: PropTypes.string,
    notes: PropTypes.string,
    paymentTerms: PropTypes.string,
    template: PropTypes.string,
    taxRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    discount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    lineItems: PropTypes.array,
  }).isRequired,
};

export default InvoicePreview;
