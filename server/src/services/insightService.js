/**
 * Insight service (Phase G) — rule-based intelligence that reads a user's
 * invoices and surfaces actionable observations for the dashboard.
 *
 * Each insight is { type, severity, title, message, link?, meta? } where
 *   severity ∈ 'critical' | 'warning' | 'positive' | 'info'
 *
 * Pure and side-effect free: the controller loads the user's invoices from
 * MongoDB and passes them in, so this module is unit-testable with fixtures.
 */

const { roundMoney } = require('../utils/helpers');

const HIGH_VALUE_MULTIPLIER = 3; // invoice ≥ 3× the user's average is flagged
const HIGH_VALUE_MIN = 100000; // …but only if at least this amount
const CONCENTRATION_THRESHOLD = 0.4; // top vendor share of total spend
const UNUSUAL_TAX_DRIFT = 2; // implied vs declared rate gap (percentage points)
const MISSING_RATIO_THRESHOLD = 0.3; // share of docs with missing fields that warrants a flag
const DUE_SOON_DAYS = 7;

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(value, days) {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

function monthStart(now) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function monthLabel(value) {
  return new Date(value).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function inRange(dateValue, from, to) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  return d >= from && d < to;
}

function outstandingOf(inv) {
  return Math.max((Number(inv.totalAmount) || 0) - (Number(inv.amountPaid) || 0), 0);
}

function isOpen(inv) {
  return inv.paymentStatus !== 'paid';
}

/**
 * Generate insights from a user's invoices.
 * @param {Array} invoices — lean invoice docs
 * @param {Object} opts { now } — injectable clock
 * @returns {Array<{type, severity, title, message, link?, meta?}>}
 */
function generateInsights(invoices = [], opts = {}) {
  const now = opts.now || new Date();
  const insights = [];
  const push = (insight) => insights.push(insight);

  const total = invoices.length;
  if (total === 0) {
    push({
      type: 'no_data',
      severity: 'info',
      title: 'No invoices yet',
      message: 'Upload your first invoice or generate one to start tracking your finances.',
      link: '/upload',
    });
    return insights;
  }

  const totalValue = roundMoney(invoices.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0));
  const averageValue = roundMoney(totalValue / total);
  const outstandingTotal = roundMoney(invoices.reduce((s, inv) => s + outstandingOf(inv), 0));

  // ── High-value invoices ──────────────────────────────────────────
  const highValue = invoices.filter(
    (inv) => (Number(inv.totalAmount) || 0) >= Math.max(averageValue * HIGH_VALUE_MULTIPLIER, HIGH_VALUE_MIN)
  );
  if (highValue.length > 0) {
    const biggest = highValue.reduce((a, b) =>
      (Number(a.totalAmount) || 0) >= (Number(b.totalAmount) || 0) ? a : b
    );
    push({
      type: 'high_value_invoice',
      severity: highValue.length >= 3 ? 'critical' : 'warning',
      title: `High-value invoice${highValue.length > 1 ? 's' : ''} detected`,
      message: `${highValue.length} invoice${highValue.length > 1 ? 's are' : ' is'} well above your average (₹${averageValue.toLocaleString('en-IN')}): ${biggest.invoiceNumber || 'unnumbered'} from ${biggest.vendorName || 'unknown vendor'} for ₹${(Number(biggest.totalAmount) || 0).toLocaleString('en-IN')}.`,
      link: `/invoices/${biggest._id}`,
      meta: { count: highValue.length },
    });
  }

  // ── Overdue invoices ─────────────────────────────────────────────
  const overdue = invoices.filter((inv) => inv.paymentStatus === 'overdue');
  const overdueAmount = roundMoney(overdue.reduce((s, inv) => s + outstandingOf(inv), 0));
  if (overdue.length > 0) {
    push({
      type: 'overdue',
      severity: overdue.length >= 3 ? 'critical' : 'warning',
      title: `${overdue.length} overdue invoice${overdue.length > 1 ? 's' : ''}`,
      message: `${overdueAmount.toLocaleString('en-IN')} is past due. ${overdue[0].vendorName || 'The earliest'} is the oldest on the list.`,
      link: '/invoices?paymentStatus=overdue',
      meta: { count: overdue.length, amount: overdueAmount },
    });
  }

  // ── Due soon ─────────────────────────────────────────────────────
  const today = startOfDay(now);
  const weekEnd = addDays(today, DUE_SOON_DAYS);
  const dueSoon = invoices.filter(
    (inv) => isOpen(inv) && inv.dueDate && new Date(inv.dueDate) >= today && new Date(inv.dueDate) < weekEnd
  );
  if (dueSoon.length > 0) {
    push({
      type: 'due_soon',
      severity: 'warning',
      title: `${dueSoon.length} invoice${dueSoon.length > 1 ? 's' : ''} due this week`,
      message: `${dueSoon.length} open invoice${dueSoon.length > 1 ? 's' : ''} fall${dueSoon.length > 1 ? '' : 's'} due within ${DUE_SOON_DAYS} days — total ₹${roundMoney(dueSoon.reduce((s, inv) => s + outstandingOf(inv), 0)).toLocaleString('en-IN')}.`,
      link: '/invoices',
      meta: { count: dueSoon.length },
    });
  }

  // ── Unusual tax amounts ──────────────────────────────────────────
  const unusualTax = invoices.filter((inv) => {
    const subtotal = Number(inv.subtotal) || 0;
    const tax = Number(inv.tax) || 0;
    const declared = inv.gstRate;
    if (subtotal <= 0) return false;
    const implied = (tax / subtotal) * 100;
    if (declared !== null && declared !== undefined && declared !== '') {
      return Math.abs(implied - Number(declared)) > UNUSUAL_TAX_DRIFT;
    }
    return implied > 40; // unusually high with no declared rate
  });
  if (unusualTax.length > 0) {
    const sample = unusualTax[0];
    const impliedRate = sample.subtotal > 0 ? ((Number(sample.tax) || 0) / Number(sample.subtotal)) * 100 : 0;
    push({
      type: 'unusual_tax',
      severity: 'warning',
      title: `Unusual tax on ${unusualTax.length} invoice${unusualTax.length > 1 ? 's' : ''}`,
      message: `Invoice ${sample.invoiceNumber || '#' + sample._id} implies a ${impliedRate.toFixed(1)}% tax rate${sample.gstRate != null ? ` but declares ${sample.gstRate}%` : ' with no declared rate'} — worth a manual review.`,
      link: `/invoices/${sample._id}`,
      meta: { count: unusualTax.length },
    });
  }

  // ── Missing information ──────────────────────────────────────────
  const missing = invoices.filter((inv) => {
    const missingKeys = [];
    if (!inv.invoiceNumber) missingKeys.push('invoice number');
    if (!inv.vendorName) missingKeys.push('vendor');
    if (!inv.invoiceDate) missingKeys.push('date');
    if (!inv.totalAmount || Number(inv.totalAmount) === 0) missingKeys.push('amount');
    return missingKeys.length > 0;
  });
  if (missing.length > 0 && missing.length / total >= MISSING_RATIO_THRESHOLD) {
    push({
      type: 'missing_info',
      severity: 'warning',
      title: `${missing.length} invoice${missing.length > 1 ? 's' : ''} with missing key fields`,
      message: `${Math.round((missing.length / total) * 100)}% of your documents are missing an invoice number, vendor, date or amount — extraction may need review.`,
      link: '/invoices',
      meta: { count: missing.length },
    });
  } else if (missing.length > 0 && missing.length / total < MISSING_RATIO_THRESHOLD) {
    push({
      type: 'missing_info',
      severity: 'info',
      title: `${missing.length} document${missing.length > 1 ? 's' : ''} need${missing.length > 1 ? '' : 's'} attention`,
      message: 'A few invoices are missing key fields (number, vendor, date or amount).',
      link: '/invoices',
      meta: { count: missing.length },
    });
  }

  // ── Vendor concentration ─────────────────────────────────────────
  const byVendor = {};
  for (const inv of invoices) {
    const name = inv.vendorName;
    if (!name) continue;
    byVendor[name] = (byVendor[name] || 0) + (Number(inv.totalAmount) || 0);
  }
  const vendorRows = Object.entries(byVendor).sort((a, b) => b[1] - a[1]);
  if (vendorRows.length > 0 && totalValue > 0) {
    const [topName, topSpend] = vendorRows[0];
    const share = topSpend / totalValue;
    if (share >= CONCENTRATION_THRESHOLD) {
      push({
        type: 'vendor_concentration',
        severity: 'warning',
        title: `${topName} is ${Math.round(share * 100)}% of your spend`,
        message: `Spend is concentrated with a single vendor (₹${roundMoney(topSpend).toLocaleString('en-IN')} of ₹${totalValue.toLocaleString('en-IN')}).`,
        link: `/vendors/${encodeURIComponent(topName)}`,
        meta: { vendor: topName, share: Math.round(share * 100) },
      });
    }
  }

  // ── Monthly summary ──────────────────────────────────────────────
  const monthStartDate = monthStart(now);
  const monthEnd = addDays(new Date(now.getFullYear(), now.getMonth() + 1, 1), 0);
  const monthInvoices = invoices.filter((inv) => inRange(inv.invoiceDate, monthStartDate, monthEnd));
  const monthIssued = roundMoney(monthInvoices.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0));
  const monthPaid = roundMoney(
    invoices
      .filter((inv) => inv.paidDate && inRange(inv.paidDate, monthStartDate, monthEnd))
      .reduce((s, inv) => s + (Number(inv.amountPaid) || 0), 0)
  );
  if (monthInvoices.length > 0) {
    push({
      type: 'monthly_summary',
      severity: 'info',
      title: `${monthLabel(monthStartDate)} at a glance`,
      message: `${monthInvoices.length} invoice${monthInvoices.length > 1 ? 's' : ''} worth ₹${monthIssued.toLocaleString('en-IN')} issued; ₹${monthPaid.toLocaleString('en-IN')} paid so far.`,
      meta: { count: monthInvoices.length, issued: monthIssued, paid: monthPaid },
    });
  }

  // ── Payment trend (this month vs last month) ─────────────────────
  // Payments are attributed by their paidDate, regardless of issue month,
  // so a payment made this month on an older invoice still counts here.
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthPaid = roundMoney(
    invoices
      .filter((inv) => inv.paidDate && inRange(inv.paidDate, lastMonthStart, monthStartDate))
      .reduce((s, inv) => s + (Number(inv.amountPaid) || 0), 0)
  );
  if (monthPaid > 0 || lastMonthPaid > 0) {
    const direction = monthPaid >= lastMonthPaid ? 'up' : 'down';
    const delta = Math.abs(roundMoney(monthPaid - lastMonthPaid));
    push({
      type: 'payment_trend',
      severity: direction === 'up' ? 'positive' : 'warning',
      title: `Payments are ${direction}`,
      message:
        lastMonthPaid === 0
          ? `You have paid ₹${monthPaid.toLocaleString('en-IN')} this month — a strong start.`
          : `You have paid ₹${monthPaid.toLocaleString('en-IN')} this month, ${direction} ₹${delta.toLocaleString('en-IN')} versus last month (₹${lastMonthPaid.toLocaleString('en-IN')}).`,
      meta: { current: monthPaid, previous: lastMonthPaid },
    });
  }

  // ── Overall collection rate ──────────────────────────────────────
  if (totalValue > 0) {
    const paidTotal = roundMoney(invoices.reduce((s, inv) => s + (Number(inv.amountPaid) || 0), 0));
    const collectedPct = Math.round((paidTotal / totalValue) * 100);
    if (collectedPct < 50) {
      push({
        type: 'collection_rate',
        severity: 'warning',
        title: `${collectedPct}% of invoice value collected`,
        message: `Only ₹${paidTotal.toLocaleString('en-IN')} of ₹${totalValue.toLocaleString('en-IN')} has been collected; ₹${outstandingTotal.toLocaleString('en-IN')} remains outstanding.`,
        meta: { collectedPct, paidTotal, outstandingTotal },
      });
    } else if (collectedPct >= 90) {
      push({
        type: 'collection_rate',
        severity: 'positive',
        title: 'Strong collection rate',
        message: `${collectedPct}% of invoice value is collected — healthy cash flow.`,
        meta: { collectedPct },
      });
    }
  }

  return insights;
}

module.exports = { generateInsights };
