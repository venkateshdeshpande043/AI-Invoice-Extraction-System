import PropTypes from 'prop-types';

function InvoiceFilters({ filters, onFilterChange }) {
  const handleChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[200px]">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
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
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value)}
          className="input-field"
        >
          <option value="">All</option>
          <option value="processed">Processed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div>
        <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
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
        <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
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
    </div>
  );
}

InvoiceFilters.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    status: PropTypes.string,
    dateFrom: PropTypes.string,
    dateTo: PropTypes.string,
  }),
  onFilterChange: PropTypes.func.isRequired,
};

export default InvoiceFilters;
