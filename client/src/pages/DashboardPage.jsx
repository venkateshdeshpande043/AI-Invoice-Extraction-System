import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import InvoiceCard from '../components/invoice/InvoiceCard';
import Button from '../components/common/Button';
import api from '../services/api';
import { formatCurrency, formatDate, formatPaymentStatus } from '../utils/formatters';

const iconPaths = {
  total: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  ),
  outstanding: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  paid: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  overdue: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  ),
  processed: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
  ),
  pending: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  failed: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
  ),
};

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-taupe">{label}</p>
          <p className="mt-2 text-2xl font-display font-semibold text-espresso tabnum">{value}</p>
          {sub && <p className="mt-1 text-xs text-mocha">{sub}</p>}
        </div>
        <div className="w-9 h-9 rounded-md bg-beige/70 border border-sand flex items-center justify-center text-brown flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {icon}
          </svg>
        </div>
      </div>
    </div>
  );
}

function formatPercent(stats) {
  const outstanding = stats.outstandingTotal || 0;
  const total = stats.paidTotal + outstanding;
  if (total <= 0) return '—';
  return `${Math.round((outstanding / total) * 100)}%`;
}

function formatCompact(value) {
  if (value == null || isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e7) return `${(value / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${(value / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
  return String(value);
}

const INSIGHT_STYLES = {
  critical: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', cls: 'text-rust', chip: 'bg-rust/10 text-rust border-rust/30', label: 'Critical' },
  warning: { icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', cls: 'text-amber-700', chip: 'bg-amber-100 text-amber-900 border-amber-200', label: 'Warning' },
  positive: { icon: 'M5 13l4 4L19 7', cls: 'text-emerald-700', chip: 'bg-emerald-100 text-emerald-900 border-emerald-200', label: 'Positive' },
  info: { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', cls: 'text-brown', chip: 'bg-ivory text-brown border-sand', label: 'Info' },
};

function InsightRow({ insight }) {
  const style = INSIGHT_STYLES[insight.severity] || INSIGHT_STYLES.info;
  return (
    <li className="flex items-start gap-3 py-3 border-b border-sand/40 last:border-b-0">
      <span className={`mt-0.5 w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${style.chip}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={style.icon} />
        </svg>
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-espresso">{insight.title}</p>
          <span className={`text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 border ${style.chip}`}>
            {style.label}
          </span>
        </div>
        <p className="text-sm text-mocha mt-1 leading-relaxed">{insight.message}</p>
        {insight.link && (
          <Link
            to={insight.link}
            className="text-xs font-medium text-brown hover:text-espresso mt-1.5 inline-block"
          >
            View related invoices →
          </Link>
        )}
      </div>
    </li>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, insightsRes] = await Promise.allSettled([
          api.get('/dashboard/stats'),
          api.get('/insights'),
        ]);
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data.data);
        } else {
          setError(statsRes.reason?.response?.data?.message || 'Failed to load dashboard');
        }
        if (insightsRes.status === 'fulfilled') {
          setInsights(insightsRes.value.data.data.insights || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner size="lg" message="Loading dashboard..." />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 max-w-xl">
          <p className="text-rose-900">{error}</p>
          <button onClick={() => window.location.reload()} className="text-rust underline text-sm mt-2">
            Try again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const upcomingDue = stats?.upcomingDue || [];

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle="Invoice volumes, payment health and recent activity at a glance."
        actions={
          <Button variant="primary" onClick={() => navigate('/upload')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" />
            </svg>
            Upload Invoice
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Invoices" value={stats?.totalInvoices || 0} icon={iconPaths.total} />
        <StatCard
          label="Outstanding"
          value={formatCurrency(stats?.outstandingTotal || 0)}
          sub="Across open invoices"
          icon={iconPaths.outstanding}
        />
        <StatCard
          label="Paid"
          value={stats?.paidCount || 0}
          sub={`${formatCurrency(stats?.paidTotal || 0)} collected`}
          icon={iconPaths.paid}
        />
        <StatCard
          label="Overdue"
          value={stats?.overdueCount || 0}
          sub="Past their due date"
          icon={iconPaths.overdue}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatCard label="Processed" value={stats?.processedCount || 0} icon={iconPaths.processed} />
        <StatCard label="Pending" value={stats?.pendingCount || 0} icon={iconPaths.pending} />
        <StatCard label="Failed" value={stats?.failedCount || 0} icon={iconPaths.failed} />
      </div>

      {insights.length > 0 && (
        <div className="mt-6 card p-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1">Insights</p>
              <h2 className="text-lg font-semibold text-espresso">What the numbers are telling you</h2>
            </div>
            <Link to="/ask" className="text-sm text-brown hover:text-espresso font-medium">
              Ask Invoice AI
            </Link>
          </div>
          <ul className="divide-y divide-sand/40">
            {insights.map((insight, idx) => (
              <InsightRow key={`${insight.type}-${idx}`} insight={insight} />
            ))}
          </ul>
        </div>
      )}

      {stats?.gstSummary && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-taupe">Total Tax</p>
            <p className="mt-2 text-2xl font-display font-semibold text-espresso tabnum">
              {formatCurrency(stats.gstSummary.totalTax)}
            </p>
            <p className="mt-1 text-xs text-mocha">Across {stats.gstSummary.taxedInvoices} taxed invoices</p>
          </div>
          <div className="card p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-taupe">Average GST Rate</p>
            <p className="mt-2 text-2xl font-display font-semibold text-espresso tabnum">
              {stats.gstSummary.avgRate != null ? `${stats.gstSummary.avgRate}%` : '—'}
            </p>
            <p className="mt-1 text-xs text-mocha">Across {stats.gstSummary.withRate} invoices with rates</p>
          </div>
          <div className="card p-5">
            <p className="text-[11px] uppercase tracking-[0.14em] text-taupe">Outstanding Ratio</p>
            <p className="mt-2 text-2xl font-display font-semibold text-espresso tabnum">
              {formatPercent(stats)}
            </p>
            <p className="mt-1 text-xs text-mocha">Outstanding vs total invoice value</p>
          </div>
        </div>
      )}

      {upcomingDue.length > 0 && (
        <div className="mt-6 card p-0 overflow-hidden">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1">Payment Schedule</p>
              <h2 className="text-lg font-semibold text-espresso">Open & upcoming payments</h2>
            </div>
            <Link to="/invoices" className="text-sm text-brown hover:text-espresso font-medium">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sand/50">
              <thead className="bg-ivory/60">
                <tr>
                  <th className="table-head">Invoice</th>
                  <th className="table-head">Vendor</th>
                  <th className="table-head">Due</th>
                  <th className="table-head text-right">Amount</th>
                  <th className="table-head">Payment</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-sand/50">
                {upcomingDue.map((invoice) => {
                  const paymentInfo = formatPaymentStatus(invoice.paymentStatus);
                  return (
                    <tr key={invoice._id} className="hover:bg-ivory/50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-brown">
                        <Link to={`/invoices/${invoice._id}`} className="hover:underline">
                          {invoice.invoiceNumber || '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-espresso">
                        {invoice.vendorName || '—'}
                      </td>
                      <td
                        className={`px-4 py-3 whitespace-nowrap text-sm tabnum ${
                          invoice.paymentStatus === 'overdue' ? 'text-rust font-medium' : 'text-mocha'
                        }`}
                      >
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-espresso text-right tabnum">
                        {formatCurrency(invoice.totalAmount, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`status-pill ${paymentInfo.class}`}>{paymentInfo.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats?.invoicesByMonth && stats.invoicesByMonth.length > 0 && (
        <div className="mt-6 card p-6">
          <p className="eyebrow mb-1">Volume</p>
          <h2 className="text-lg font-semibold text-espresso mb-5">Invoices by month</h2>
          <div className="flex items-end gap-3 h-36">
            {stats.invoicesByMonth.map((item) => {
              const maxCount = Math.max(...stats.invoicesByMonth.map((i) => i.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs text-mocha tabnum">{item.count}</span>
                  <div
                    className="w-full bg-espresso rounded-sm transition-all duration-300 hover:bg-brown"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[11px] text-taupe truncate w-full text-center">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stats?.paymentTrends && stats.paymentTrends.length > 0 && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="eyebrow mb-1">Cash Flow</p>
                <h2 className="text-lg font-semibold text-espresso">Issued vs paid, by month</h2>
              </div>
              <div className="flex items-center gap-4 text-xs text-mocha">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-espresso inline-block" /> Issued
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-taupe inline-block" /> Paid
                </span>
              </div>
            </div>
            <div className="flex items-end gap-4 h-40">
              {stats.paymentTrends.map((item) => {
                const maxValue = Math.max(...stats.paymentTrends.map((i) => Math.max(i.issued, i.paid)), 1);
                const issuedH = (item.issued / maxValue) * 100;
                const paidH = (item.paid / maxValue) * 100;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-mocha tabnum">{formatCompact(item.issued)}</span>
                    <div className="flex items-end gap-1 w-full justify-center">
                      <div
                        className="w-1/2 max-w-6 bg-espresso rounded-sm transition-all duration-300"
                        style={{ height: `${Math.max(issuedH, 3)}%` }}
                        title={`Issued: ${formatCurrency(item.issued)}`}
                      />
                      <div
                        className="w-1/2 max-w-6 bg-taupe/70 rounded-sm transition-all duration-300"
                        style={{ height: `${Math.max(paidH, 3)}%` }}
                        title={`Paid: ${formatCurrency(item.paid)}`}
                      />
                    </div>
                    <span className="text-[11px] text-taupe truncate w-full text-center">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {stats?.topVendors && stats.topVendors.length > 0 && (
            <div className="card p-6">
              <p className="eyebrow mb-1">Concentration</p>
              <h2 className="text-lg font-semibold text-espresso mb-5">Top vendors</h2>
              <ul className="space-y-4">
                {stats.topVendors.map((vendor) => {
                  const maxSpend = Math.max(...stats.topVendors.map((v) => v.totalSpend), 1);
                  return (
                    <li key={vendor._id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <Link
                          to={`/vendors/${encodeURIComponent(vendor.vendorName)}`}
                          className="text-brown hover:text-espresso font-medium truncate max-w-[60%]"
                        >
                          {vendor.vendorName}
                        </Link>
                        <span className="text-espresso tabnum font-medium">
                          {formatCurrency(vendor.totalSpend)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-beige rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brown rounded-full transition-all duration-500"
                          style={{ width: `${(vendor.totalSpend / maxSpend) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {stats?.overdueAlerts && stats.overdueAlerts.length > 0 && (
        <div className="mt-6 card p-0 overflow-hidden border-rose-200">
          <div className="px-6 pt-5 pb-3">
            <p className="eyebrow mb-1 text-rust">Attention</p>
            <h2 className="text-lg font-semibold text-espresso">Overdue invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-sand/50">
              <thead className="bg-rose-50/60">
                <tr>
                  <th className="table-head">Invoice</th>
                  <th className="table-head">Vendor</th>
                  <th className="table-head">Days Overdue</th>
                  <th className="table-head text-right">Outstanding</th>
                  <th className="table-head">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-sand/50">
                {stats.overdueAlerts.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-ivory/50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-brown">
                      <Link to={`/invoices/${invoice._id}`} className="hover:underline">
                        {invoice.invoiceNumber || '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-espresso">
                      {invoice.vendorName || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="status-pill bg-rose-100 text-rose-900 border border-rose-200">
                        {invoice.daysOverdue} day{invoice.daysOverdue !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-rust text-right tabnum">
                      {formatCurrency(
                        Math.max((invoice.totalAmount || 0) - (invoice.amountPaid || 0), 0),
                        invoice.currency
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link
                        to={`/invoices/${invoice._id}`}
                        className="text-sm text-brown hover:text-espresso font-medium"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {stats?.recentUploads && stats.recentUploads.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="eyebrow mb-1">Recent</p>
              <h2 className="text-lg font-semibold text-espresso">Recent uploads</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.recentUploads.map((invoice) => (
              <InvoiceCard key={invoice._id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default DashboardPage;
