import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import InvoiceFilters from '../components/invoice/InvoiceFilters';
import InvoiceTable from '../components/invoice/InvoiceTable';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import { useInvoices } from '../hooks/useInvoices';

function InvoiceListPage() {
  const { invoices, pagination, loading, error, fetchInvoices, deleteInvoice, exportList } = useInvoices();
  const [filters, setFilters] = useState({});
  const [exporting, setExporting] = useState(false);

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

  const hasFilters = Object.keys(filters).some((k) => filters[k]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const blob = await exportList(filters);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'invoices.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // eslint-disable-next-line no-alert
      window.alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="History"
          title="All Invoices"
          subtitle="Search, filter and manage every extracted invoice."
          actions={
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportCsv}
              disabled={exporting}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          }
        />

        <div className="card p-6">
          <InvoiceFilters filters={filters} onFilterChange={handleFilterChange} />
        </div>

        {loading ? (
          <LoadingSpinner size="lg" message="Loading invoices..." />
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <p className="text-rose-900">{error}</p>
            <button onClick={() => loadInvoices(1)} className="text-rust underline text-sm mt-2">
              Try again
            </button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="card">
            <EmptyState
              title="No invoices found"
              message={
                hasFilters
                  ? 'Try adjusting your search filters'
                  : 'Upload your first invoice to get started'
              }
              actionLabel={hasFilters ? undefined : 'Upload Invoice'}
              onAction={hasFilters ? undefined : () => window.location.href = '/upload'}
            />
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <InvoiceTable invoices={invoices} onDelete={handleDelete} />
            <div className="px-4 py-3 border-t border-sand/60">
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
