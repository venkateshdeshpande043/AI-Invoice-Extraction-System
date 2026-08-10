import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import api from '../services/api';
import { API_ENDPOINTS } from '../utils/constants';
import { formatCurrency, formatDate, formatPaymentStatus } from '../utils/formatters';

const INTENT_LABELS = {
  outstanding_total: 'Outstanding balance',
  overdue_invoices: 'Overdue invoices',
  due_this_week: 'Due this week',
  top_vendor: 'Top vendor',
  gst_period: 'GST / tax',
  invoices_above: 'Amount filter',
  invoices_below: 'Amount filter',
  total_this_month: 'Monthly total',
  paid_this_month: 'Payments made',
  month_comparison: 'Month comparison',
  invoice_count: 'Invoice count',
  largest_invoice: 'Largest invoice',
  category_breakdown: 'Category breakdown',
  vendor_count: 'Vendor count',
  average_invoice: 'Average invoice',
  unpaid_invoices: 'Unpaid invoices',
  status_breakdown: 'Status breakdown',
  fallback: 'Helper',
};

function AnswerTable({ invoices }) {
  if (!invoices || invoices.length === 0) return null;
  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-sand/60">
      <table className="min-w-full divide-y divide-sand/40">
        <thead className="bg-ivory/60">
          <tr>
            <th className="table-head">Invoice</th>
            <th className="table-head">Vendor / Customer</th>
            <th className="table-head">Date</th>
            <th className="table-head">Due</th>
            <th className="table-head text-right">Amount</th>
            <th className="table-head">Payment</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-sand/40">
          {invoices.map((inv) => {
            const payment = formatPaymentStatus(inv.paymentStatus);
            return (
              <tr key={inv._id} className="hover:bg-ivory/40 transition-colors">
                <td className="px-4 py-2.5 whitespace-nowrap text-sm font-medium text-brown">
                  <Link to={`/invoices/${inv._id}`} className="hover:underline">
                    {inv.invoiceNumber || '—'}
                  </Link>
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-sm text-espresso">
                  {inv.vendorName || inv.customerName || '—'}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-sm text-mocha tabnum">
                  {formatDate(inv.invoiceDate)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-sm text-mocha tabnum">
                  {formatDate(inv.dueDate)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap text-sm text-espresso text-right tabnum">
                  {formatCurrency(inv.totalAmount, inv.currency)}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <span className={`status-pill ${payment.class}`}>{payment.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Breakdown({ rows, amountKey, labelKey }) {
  if (!rows || rows.length === 0) return null;
  const max = Math.max(...rows.map((r) => r[amountKey]), 1);
  return (
    <div className="mt-4 space-y-2.5">
      {rows.map((row, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-brown font-medium capitalize">{row[labelKey]}</span>
            <span className="text-espresso tabnum font-medium">
              {formatCurrency(row[amountKey])}
            </span>
          </div>
          <div className="h-1.5 bg-beige rounded-full overflow-hidden">
            <div
              className="h-full bg-brown rounded-full transition-all duration-500"
              style={{ width: `${(row[amountKey] / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function AnswerCard({ entry }) {
  const { question, answer, intent, data, chart } = entry;
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-md bg-espresso flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12a8 8 0 01-8 8H6l-2 2V12a8 8 0 018-8h.01a8 8 0 018 7.99z"
            />
          </svg>
        </div>
        <p className="text-espresso font-medium pt-1.5">{question}</p>
      </div>
      <div className="ml-10 rounded-md border border-sand/70 bg-white shadow-soft p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-taupe border border-sand/70 rounded-full px-2 py-0.5">
            {INTENT_LABELS[intent] || intent}
          </span>
          <span className="text-[10px] text-taupe uppercase tracking-[0.14em]">Rule-based on your data</span>
        </div>
        <p className="text-sm text-espresso leading-relaxed">{answer}</p>

        {chart?.type === 'list' && <AnswerTable invoices={data?.invoices} />}
        {chart?.type === 'breakdown' && data?.rows && (
          <Breakdown
            rows={data.rows}
            amountKey={data.rows[0]?.vendorName !== undefined ? 'totalSpend' : 'amount'}
            labelKey={data.rows[0]?.vendorName !== undefined ? 'vendorName' : 'category'}
          />
        )}
        {chart?.type === 'detail' && data?.invoice && <AnswerTable invoices={[data.invoice]} />}
      </div>
    </div>
  );
}

function AskAIPage() {
  const [question, setQuestion] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .get(API_ENDPOINTS.AI.SUGGESTIONS)
      .then((res) => setSuggestions(res.data.data.suggestions))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [history, asking]);

  const ask = async (text) => {
    const q = (text ?? question).trim();
    if (!q || asking) return;
    setAsking(true);
    setError(null);
    setHistory((prev) => [...prev, { question: q, answer: null, intent: '…', loading: true }]);
    setQuestion('');
    try {
      const res = await api.post(API_ENDPOINTS.AI.ASK, { question: q });
      setHistory((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...res.data.data, loading: false };
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the answer service.');
      setHistory((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          question: q,
          answer: 'I could not answer that right now. Please try again.',
          intent: 'fallback',
          loading: false,
        };
        return next;
      });
    } finally {
      setAsking(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        eyebrow="Ask Invoice AI"
        title="Ask about your invoices"
        subtitle="Ask a question in plain language and get answers computed from your actual invoice data — outstanding balances, overdue items, vendors, GST and more."
      />

      {error && (
        <div className="mb-5 bg-rose-50 border border-rose-200 rounded-lg p-4">
          <p className="text-sm text-rose-900">{error}</p>
        </div>
      )}

      <div className="max-w-3xl">
        <div className="card p-6">
          <p className="eyebrow mb-3">Try a question</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                disabled={asking}
                className="text-sm text-brown border border-sand/80 bg-ivory/40 hover:bg-beige/60 hover:border-taupe hover:text-espresso transition-colors rounded-full px-3.5 py-1.5 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            <input
              className="input-field"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask()}
              placeholder="e.g. How much money is outstanding?"
            />
            <Button onClick={() => ask()} disabled={asking || !question.trim()}>
              {asking ? (
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 12a8 8 0 018-8v4m0 12a8 8 0 01-8-8h4"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
              {asking ? 'Thinking…' : 'Ask'}
            </Button>
          </div>
        </div>

        {history.length > 0 && (
          <div className="mt-6 space-y-5">
            {history.map((entry, idx) =>
              entry.loading ? (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-beige flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-brown animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 12a8 8 0 018-8v4m0 12a8 8 0 01-8-8h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-espresso font-medium pt-1.5">{entry.question}</p>
                    <p className="text-sm text-mocha mt-2 italic">Looking through your invoices…</p>
                  </div>
                </div>
              ) : (
                <AnswerCard key={idx} entry={entry} />
              )
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {history.length === 0 && !asking && (
          <div className="mt-6 card p-8 text-center">
            <p className="font-display text-xl text-espresso mb-2">Ask anything about your documents</p>
            <p className="text-sm text-mocha max-w-md mx-auto">
              The assistant reads your actual invoices in MongoDB — it never guesses. Try an example above
              or type your own question.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AskAIPage;
