import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import InvoiceTable from '../components/invoice/InvoiceTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { useVendors } from '../hooks/useVendors';
import { useInvoices } from '../hooks/useInvoices';
import { formatCurrency, formatDate } from '../utils/formatters';

function Metric({ label, value, tone = 'text-espresso' }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-taupe mb-1">{label}</p>
      <p className={`text-xl font-display font-semibold tabnum ${tone}`}>{value}</p>
    </div>
  );
}

function VendorDetailPage() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { getVendor } = useVendors();
  const { deleteInvoice } = useInvoices();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVendor = async () => {
      try {
        const result = await getVendor(name);
        setData(result);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load vendor');
      } finally {
        setLoading(false);
      }
    };
    fetchVendor();
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    try {
      await deleteInvoice(id);
      const result = await getVendor(name);
      setData(result);
    } catch {
      // Error handled by hook
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner size="lg" message="Loading vendor..." />
      </DashboardLayout>
    );
  }

  if (error || !data || !data.summary) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-rust mb-4">{error || 'Vendor not found'}</p>
          <Button onClick={() => navigate('/vendors')}>Back to Vendors</Button>
        </div>
      </DashboardLayout>
    );
  }

  const summary = data.summary;

  return (
    <DashboardLayout>
      <button
        onClick={() => navigate('/vendors')}
        className="text-sm text-mocha hover:text-espresso mb-6 flex items-center gap-1.5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Vendors
      </button>

      <div className="card p-6 sm:p-8 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow mb-1.5">Vendor</p>
            <h2 className="text-3xl font-semibold text-espresso">{summary.vendorName}</h2>
            <p className="text-mocha mt-1.5">
              {summary.totalInvoices} invoice{summary.totalInvoices !== 1 ? 's' : ''} extracted
            </p>
          </div>
          {summary.gstin && (
            <div className="text-left sm:text-right">
              <p className="text-[11px] uppercase tracking-[0.12em] text-taupe mb-1">GSTIN</p>
              <p className="text-base font-medium text-espresso tabnum">{summary.gstin}</p>
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
          <Metric label="Total Spend" value={formatCurrency(summary.totalSpend)} />
          <Metric label="Paid" value={formatCurrency(summary.paidTotal)} tone="text-emerald-700" />
          <Metric
            label="Outstanding"
            value={formatCurrency(summary.outstanding)}
            tone={(summary.outstanding || 0) > 0 ? 'text-rust' : 'text-espresso'}
          />
          <Metric label="Average Invoice" value={formatCurrency(summary.avgAmount)} />
          <Metric label="Last Invoice" value={formatDate(summary.lastInvoiceDate)} />
          <Metric label="Invoices" value={summary.totalInvoices} />
        </div>
      </div>

      <div className="mb-4">
        <p className="eyebrow mb-1">History</p>
        <h3 className="text-lg font-semibold text-espresso">Invoices from {summary.vendorName}</h3>
      </div>

      {data.invoices.length === 0 ? (
        <div className="card">
          <p className="text-sm text-mocha p-6">No invoices found for this vendor.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <InvoiceTable invoices={data.invoices} onDelete={handleDelete} />
        </div>
      )}
    </DashboardLayout>
  );
}

export default VendorDetailPage;
