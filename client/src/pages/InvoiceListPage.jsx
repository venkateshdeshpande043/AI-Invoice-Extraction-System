import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import InvoiceFilters from '../components/invoice/InvoiceFilters';
import InvoiceTable from '../components/invoice/InvoiceTable';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { useInvoices } from '../hooks/useInvoices';

function InvoiceListPage() {
  const { invoices, pagination, loading, error, fetchInvoices, deleteInvoice } = useInvoices();
  const [filters, setFilters] = useState({});

  const loadInvoices = useCallback(
    (page = 1) => {
      const params = { ...filters, page };
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      fetchInvoices(params);
    },
    [filters, fetchInvoices]
  );

  useEffect(() => {
    loadInvoices(1);
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleDelete = async (id) => {
    try {
      await deleteInvoice(id);
    } catch {
      // Error handled by hook
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">All Invoices</h1>

        <div className="card">
          <InvoiceFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {loading ? (
          <LoadingSpinner size="lg" message="Loading invoices..." />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
            <button onClick={() => loadInvoices(1)} className="text-red-600 underline text-sm mt-2">
              Try again
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No invoices found"
              message={Object.keys(filters).some((k) => filters[k]) ? 'Try adjusting your search filters' : 'Upload your first invoice to get started'}
              actionLabel={Object.keys(filters).some((k) => filters[k]) ? undefined : 'Upload Invoice'}
              onAction={Object.keys(filters).some((k) => filters[k]) ? undefined : () => window.location.href = '/upload'}
            />
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <InvoiceTable invoices={invoices} onDelete={handleDelete} />
            <div className="px-4 py-3 border-t border-gray-200">
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                onPageChange={(p) => loadInvoices(p)}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default InvoiceListPage;
