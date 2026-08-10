import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { useVendors } from '../hooks/useVendors';
import { VENDOR_SORT_OPTIONS } from '../utils/constants';
import { formatCurrency, formatDate } from '../utils/formatters';

function VendorsPage() {
  const navigate = useNavigate();
  const { vendors, pagination, loading, error, fetchVendors } = useVendors();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('spend');
  const [sortOrder, setSortOrder] = useState('desc');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadVendors = useCallback(
    (page = 1) => {
      fetchVendors({ search: debouncedSearch, sortBy, sortOrder, page });
    },
    [debouncedSearch, sortBy, sortOrder, fetchVendors]
  );

  useEffect(() => {
    loadVendors(1);
  }, [debouncedSearch, sortBy, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSortOrder = () => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Directory"
          title="Vendors"
          subtitle="Every vendor extracted from your invoices, with spend and payment health."
        />

        <div className="card p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[220px]">
              <label htmlFor="vendorSearch" className="block text-sm font-medium text-mocha mb-1.5">
                Search vendors
              </label>
              <input
                id="vendorSearch"
                type="text"
                placeholder="Vendor name or GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="vendorSort" className="block text-sm font-medium text-mocha mb-1.5">
                Sort by
              </label>
              <select
                id="vendorSort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
              >
                {VENDOR_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={toggleSortOrder}
              className="btn-secondary"
            >
              {sortOrder === 'desc' ? 'High → Low' : 'Low → High'}
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" message="Loading vendors..." />
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <p className="text-rose-900">{error}</p>
            <button onClick={() => loadVendors(1)} className="text-rust underline text-sm mt-2">
              Try again
            </button>
          </div>
        ) : vendors.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No vendors found"
              message={
                debouncedSearch
                  ? 'Try a different search term'
                  : 'Vendors appear automatically once you upload invoices with extracted vendor names.'
              }
            />
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-sand/60">
                <thead className="bg-ivory/60">
                  <tr>
                    <th className="table-head">Vendor</th>
                    <th className="table-head text-right">Invoices</th>
                    <th className="table-head text-right">Total Spend</th>
                    <th className="table-head text-right">Paid</th>
                    <th className="table-head text-right">Outstanding</th>
                    <th className="table-head text-right">Average</th>
                    <th className="table-head">Last Invoice</th>
                    <th className="table-head">GSTIN</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-sand/50">
                  {vendors.map((vendor) => {
                    const hasOutstanding = (vendor.outstanding || 0) > 0;
                    return (
                      <tr
                        key={vendor._id}
                        onClick={() => navigate(`/vendors/${encodeURIComponent(vendor.vendorName)}`)}
                        className="hover:bg-ivory/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-brown">
                          {vendor.vendorName}
                        </td>
                        <td className="px-4 py-3 text-sm text-mocha text-right tabnum">
                          {vendor.totalInvoices}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-espresso text-right tabnum">
                          {formatCurrency(vendor.totalSpend)}
                        </td>
                        <td className="px-4 py-3 text-sm text-emerald-700 text-right tabnum">
                          {formatCurrency(vendor.paidTotal)}
                        </td>
                        <td className={`px-4 py-3 text-sm text-right tabnum ${hasOutstanding ? 'text-rust font-medium' : 'text-mocha'}`}>
                          {formatCurrency(vendor.outstanding)}
                        </td>
                        <td className="px-4 py-3 text-sm text-mocha text-right tabnum">
                          {formatCurrency(vendor.avgAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-mocha tabnum">
                          {formatDate(vendor.lastInvoiceDate)}
                        </td>
                        <td className="px-4 py-3 text-sm text-mocha">
                          {vendor.gstin || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-sand/60">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                onPageChange={(p) => loadVendors(p)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default VendorsPage;
