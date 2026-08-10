import PropTypes from 'prop-types';

const EMPTY_ITEM = { description: '', quantity: 1, unitPrice: '', amount: '' };

function LineItemsEditor({ items, onChange, currency }) {
  const update = (index, field, value) => {
    const next = items.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: value };
      // Recompute the amount whenever qty or rate changes unless the user
      // explicitly typed a custom amount.
      if (field === 'quantity' || field === 'unitPrice') {
        const qty = parseFloat(updated.quantity) || 0;
        const rate = parseFloat(updated.unitPrice) || 0;
        updated.amount = qty > 0 && rate > 0 ? String(Math.round(qty * rate * 100) / 100) : '';
      }
      return updated;
    });
    onChange(next);
  };

  const addRow = () => onChange([...items, { ...EMPTY_ITEM }]);
  const removeRow = (index) => onChange(items.filter((_, i) => i !== index));

  const formatAmount = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-sm text-mocha italic">No line items yet — add the first one below.</p>
      )}

      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-12 gap-2 items-end border border-sand/60 rounded-md p-2.5 bg-ivory/30"
        >
          <div className="col-span-12 md:col-span-5 space-y-1">
            <label className="block text-[10px] uppercase tracking-[0.12em] text-taupe font-semibold">
              Description
            </label>
            <input
              type="text"
              value={item.description}
              onChange={(e) => update(index, 'description', e.target.value)}
              placeholder="Item or service"
              className="input-field py-1.5"
            />
          </div>
          <div className="col-span-3 md:col-span-2 space-y-1">
            <label className="block text-[10px] uppercase tracking-[0.12em] text-taupe font-semibold">
              Qty
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={item.quantity}
              onChange={(e) => update(index, 'quantity', e.target.value)}
              className="input-field py-1.5 tabnum"
            />
          </div>
          <div className="col-span-4 md:col-span-2 space-y-1">
            <label className="block text-[10px] uppercase tracking-[0.12em] text-taupe font-semibold">
              Unit price
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={item.unitPrice}
              onChange={(e) => update(index, 'unitPrice', e.target.value)}
              className="input-field py-1.5 tabnum"
            />
          </div>
          <div className="col-span-3 md:col-span-2 space-y-1">
            <label className="block text-[10px] uppercase tracking-[0.12em] text-taupe font-semibold">
              Amount
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={item.amount}
              onChange={(e) => update(index, 'amount', e.target.value)}
              className="input-field py-1.5 tabnum"
              title="Auto-computed from qty × rate; you can override it."
            />
          </div>
          <div className="col-span-2 md:col-span-1 flex md:justify-end">
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-taupe hover:text-rust transition-colors p-1.5 rounded-md hover:bg-rose-50"
              title="Remove line item"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {item.amount !== '' && (
            <div className="col-span-12 md:hidden text-right text-sm text-mocha tabnum">
              {formatAmount(item.amount)}
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-2 text-sm font-medium text-brown hover:text-espresso transition-colors"
      >
        <span className="w-6 h-6 rounded-md border border-sand bg-white flex items-center justify-center">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
        Add line item
      </button>
    </div>
  );
}

LineItemsEditor.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      description: PropTypes.string,
      quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      unitPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  currency: PropTypes.string,
};

export default LineItemsEditor;
