import PropTypes from 'prop-types';

function InvoiceFilters({ filters, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const selectClass =
    'input-field';

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[220px]">
        <label htmlFor="search" className="block text-sm font-medium text-mocha mb-1.5">
          Search
        </label>
        <input
          id="search"
          type="text"
          placeholder="Invoice # or vendor..."
          value={filters.search || ''}
          onChange={(e) => handleChange('search', e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-mocha mb-1.5">
          Status
        </label>
        <select
          id="status"
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          className={selectClass}
        >
          <option value="">All</option>
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div>
        <label htmlFor="paymentStatus" className="block text-sm font-medium text-mocha mb-1.5">
          Payment
        </label>
        <select
          id="paymentStatus"
          value={filters.paymentStatus || ''}
          onChange={(e) => handleChange('paymentStatus', e.target.value)}
          className={selectClass}
        >
          <option value="">All</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div>
        <label htmlFor="dateFrom" className="block text-sm font-medium text-mocha mb-1.5">
          From
        </label>
        <input
          id="dateFrom"
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => handleChange('dateFrom', e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="dateTo" className="block text-sm font-medium text-mocha mb-1.5">
          To
        </label>
        <input
          id="dateTo"
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => handleChange('dateTo', e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="amountFrom" className="block text-sm font-medium text-mocha mb-1.5">
          Amount from
        </label>
        <input
          id="amountFrom"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={filters.amountFrom || ''}
          onChange={(e) => handleChange('amountFrom', e.target.value)}
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="amountTo" className="block text-sm font-medium text-mocha mb-1.5">
          Amount to
        </label>
        <input
          id="amountTo"
          type="number"
          min="0"
          step="0.01"
          placeholder="Any"
          value={filters.amountTo || ''}
          onChange={(e) => handleChange('amountTo', e.target.value)}
          className="input-field"
        />
      </div>

      {(filters.search || filters.status || filters.paymentStatus || filters.dateFrom || filters.dateTo || filters.amountFrom || filters.amountTo) && (
        <button
          type="button"
          onClick={() => onFilterChange({})}
          className="text-sm text-mocha hover:text-rust transition-colors mb-0.5"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

InvoiceFilters.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.string,
    paymentStatus: PropTypes.string,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
    amountFrom: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    amountTo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onFilterChange: PropTypes.func.isRequired,
};

export default InvoiceFilters;
