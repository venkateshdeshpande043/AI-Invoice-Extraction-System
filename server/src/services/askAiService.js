/**
 * Ask Invoice AI service (Phase G) — rule-based, data-driven Q&A over the
 * user's real invoice documents.
 *
 * Pipeline (mirrors the intended architecture so a real LLM can be plugged in
 * later without rebuilding the feature):
 *
 *   question ──► detectIntent()   (pure: keyword/pattern matching)
 *           ──► resolve()         (data layer: the caller supplies the user's
 *                                  invoices from MongoDB; each intent performs
 *                                  its own aggregation over that data)
 *           ──► formatAnswer()    (pure: natural-language + structured payload)
 *
 * Everything below is side-effect free and unit-testable with fixture data —
 * the only IO boundary is the invoices array the controller loads from Mongo.
 */

const { roundMoney } = require('../utils/helpers');

const CURRENCY = 'INR';

// ── formatting helpers ─────────────────────────────────────────────

function fmtMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
}

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function monthStart(now) {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function nextMonthStart(now) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

function prevMonthStart(now) {
  return new Date(now.getFullYear(), now.getMonth() - 1, 1);
}

function monthLabel(value) {
  const d = new Date(value);
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

// ── amount parsing ─────────────────────────────────────────────────

/**
 * Extract an amount from natural language: "₹50,000", "50000", "1.5 lakh",
 * "2 cr", "25k". Returns a number or null.
 */
function parseAmount(text) {
  if (!text) return null;
  const normalized = text.toLowerCase();
  const match = normalized.match(
    /(?:₹|rs\.?|inr|usd|\$)?\s*([\d,]+(?:\.\d+)?)\s*(cr|crore|l|lakh|k|thousand|m|million)?/i
  );
  if (!match) return null;
  let value = parseFloat(match[1].replace(/,/g, ''));
  if (Number.isNaN(value)) return null;
  const suffix = (match[2] || '').toLowerCase();
  if (['cr', 'crore'].includes(suffix)) value *= 1e7;
  else if (['l', 'lakh'].includes(suffix)) value *= 1e5;
  else if (['m', 'million'].includes(suffix)) value *= 1e6;
  else if (['k', 'thousand'].includes(suffix)) value *= 1e3;
  return roundMoney(value);
}

// ── intent detection ───────────────────────────────────────────────

const hasAny = (text, keywords) => keywords.some((kw) => text.includes(kw));

/**
 * Classify a natural-language question into an intent + extracted params.
 * @returns {Object} { intent, params }  — intent is one of the keys below.
 */
function detectIntent(question = '') {
  const text = ` ${question.trim().toLowerCase().replace(/[?.!,]+$/, '')} `;
  const params = {};
  const amount = parseAmount(text);
  if (amount !== null) params.amount = amount;

  if (hasAny(text, ['above', 'more than', 'greater than', 'exceeding', 'higher than', 'over ₹', 'over rs', 'over inr'])) {
    params.inclusive = false;
    return { intent: 'invoices_above', params };
  }
  if (hasAny(text, ['at least', 'minimum of', 'no less than'])) {
    params.inclusive = true;
    return { intent: 'invoices_above', params };
  }
  if (hasAny(text, ['below', 'less than', 'under ₹', 'under inr', 'under rs', 'cheaper than'])) {
    return { intent: 'invoices_below', params };
  }

  if (hasAny(text, ['overdue', 'past due', 'late invoices', 'missed payments'])) {
    return { intent: 'overdue_invoices', params };
  }

  if (
    hasAny(text, ['due this week', 'due in the next 7 days', 'due in 7 days', 'due within a week', 'due next week', 'due soon', 'upcoming due', 'coming week', 'due in the coming week'])
  ) {
    return { intent: 'due_this_week', params };
  }

  if (
    hasAny(text, ['paid this month', 'how much have i paid', 'collected this month', 'payments this month', 'received this month', 'money have i received', 'how much did i pay this month', 'paid in this month'])
  ) {
    return { intent: 'paid_this_month', params };
  }

  if (hasAny(text, ['gst', 'vat', 'input tax', 'tax credit'])) {
    const hasPeriod = hasAny(text, ['this month', 'last month', 'month', 'year', 'period', 'total', 'paid', 'how much', 'amount']);
    if (hasPeriod) return { intent: 'gst_period', params };
  }

  if (
    hasAny(text, ['this month vs', 'vs last month', 'compared to last month', 'compare to last month', 'compare with last month', 'versus last month', 'month over month', 'than last month', 'better or worse', 'how does this month compare'])
  ) {
    return { intent: 'month_comparison', params };
  }

  if (
    hasAny(text, ['total invoice value this month', 'total this month', 'spent this month', 'issued this month', 'worth of invoices this month', 'invoices this month', 'this month total', 'value of invoices this month'])
  ) {
    return { intent: 'total_this_month', params };
  }

  if (hasAny(text, ['how many vendors', 'number of vendors', 'vendor count', 'how many suppliers', 'supplier count'])) {
    return { intent: 'vendor_count', params };
  }

  if (hasAny(text, ['top vendor', 'highest vendor', 'biggest vendor', 'largest vendor', 'top supplier', 'vendor with the highest', 'vendor has the highest', 'vendor with most', 'who do i spend most', 'which vendor gets the most'])) {
    return { intent: 'top_vendor', params };
  }

  if (hasAny(text, ['category', 'by category', 'categories', 'spending breakdown', 'breakdown of', 'where does my money go', 'spend by', 'money go to'])) {
    return { intent: 'category_breakdown', params };
  }

  if (hasAny(text, ['largest invoice', 'biggest invoice', 'highest invoice', 'most expensive invoice', 'largest single'])) {
    return { intent: 'largest_invoice', params };
  }

  if (hasAny(text, ['average invoice', 'average amount', 'mean invoice', 'typical invoice', 'on average'])) {
    return { intent: 'average_invoice', params };
  }

  if (hasAny(text, ['how many invoices', 'number of invoices', 'invoice count', 'total invoices', 'count of invoices', 'how many have i'])) {
    return { intent: 'invoice_count', params };
  }

  if (hasAny(text, ['how many unpaid', 'unpaid invoices', 'invoices are unpaid', 'which are unpaid', 'not yet paid', 'open invoices', 'how much is unpaid'])) {
    return { intent: 'unpaid_invoices', params };
  }

  if (hasAny(text, ['outstanding', 'owe', 'owed', 'amount due', 'balance due', 'pending amount', 'money owed', 'how much is pending', 'total due', 'need to pay', 'pay out', 'how much do i owe'])) {
    return { intent: 'outstanding_total', params };
  }

  if (hasAny(text, ['status breakdown', 'breakdown by status', 'how many paid', 'how many partial', 'payment status'])) {
    return { intent: 'status_breakdown', params };
  }

  return { intent: 'fallback', params };
}

// ── data resolution ────────────────────────────────────────────────

function outstandingOf(inv) {
  return Math.max((Number(inv.totalAmount) || 0) - (Number(inv.amountPaid) || 0), 0);
}

function isOpen(inv) {
  return inv.paymentStatus !== 'paid';
}

function inRange(dateValue, from, to) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  return d >= from && d < to;
}

/** Build a lean display projection for invoice list answers. */
function projectInvoice(inv) {
  return {
    _id: inv._id,
    invoiceNumber: inv.invoiceNumber || null,
    vendorName: inv.vendorName || null,
    customerName: inv.customerName || null,
    invoiceDate: inv.invoiceDate || null,
    dueDate: inv.dueDate || null,
    totalAmount: roundMoney(inv.totalAmount || 0),
    amountPaid: roundMoney(inv.amountPaid || 0),
    balance: roundMoney(outstandingOf(inv)),
    currency: inv.currency || CURRENCY,
    paymentStatus: inv.paymentStatus || 'unpaid',
    category: inv.category || null,
  };
}

const SUGGESTION_POOL = [
  'How much money is outstanding?',
  'Which invoices are overdue?',
  'Which invoices are due this week?',
  'Which vendor has the highest invoice amount?',
  'How much GST did I pay this month?',
  'Show invoices above ₹50,000.',
  'What was my total invoice value this month?',
  'How much have I paid this month?',
];

function followUps(intent) {
  const map = {
    outstanding_total: ['Which invoices are overdue?', 'What is my payment status breakdown?'],
    overdue_invoices: ['How much is outstanding in total?', 'Which invoices are due this week?'],
    due_this_week: ['Which vendor has the highest invoice amount?', 'How much is outstanding in total?'],
    top_vendor: ['What is my spending by category?', 'Which invoices are overdue?'],
    gst_period: ['What was my total invoice value this month?', 'Which invoices are overdue?'],
    invoices_above: ['How much GST did I pay this month?', 'What is my spending by category?'],
    invoices_below: ['Show invoices above ₹50,000.', 'How much is outstanding in total?'],
    total_this_month: ['How much have I paid this month?', 'How does this month compare to last month?'],
    paid_this_month: ['Which invoices are still unpaid?', 'What was my total invoice value this month?'],
    month_comparison: ['How much is outstanding in total?', 'What is my payment status breakdown?'],
    invoice_count: ['What was my total invoice value this month?', 'How much is outstanding in total?'],
    largest_invoice: ['Which vendor has the highest invoice amount?', 'Show invoices above ₹50,000.'],
    category_breakdown: ['Which vendor has the highest invoice amount?', 'How much is outstanding in total?'],
    vendor_count: ['Which vendor has the highest invoice amount?', 'What is my spending by category?'],
    average_invoice: ['Show invoices above ₹50,000.', 'How much is outstanding in total?'],
    unpaid_invoices: ['How much is outstanding in total?', 'Which invoices are overdue?'],
    status_breakdown: ['Which invoices are overdue?', 'How much have I paid this month?'],
    fallback: SUGGESTION_POOL.slice(0, 4),
  };
  return map[intent] || SUGGESTION_POOL.slice(0, 3);
}

/**
 * Resolve an intent against a user's invoices and produce the answer payload.
 * @param {string} intent — from detectIntent()
 * @param {Array} invoices — lean invoice docs owned by the user
 * @param {Object} ctx { now, params }
 * @returns {{ answer: string, data: any, chart?: object }}
 */
function resolve(intent, invoices, ctx = {}) {
  const now = ctx.now || new Date();
  const params = ctx.params || {};
  const list = (rows) => rows.sort((a, b) => new Date(b.invoiceDate || 0) - new Date(a.invoiceDate || 0)).map(projectInvoice);

  switch (intent) {
    case 'outstanding_total': {
      const open = invoices.filter(isOpen);
      const total = roundMoney(open.reduce((sum, inv) => sum + outstandingOf(inv), 0));
      return {
        answer: `You have ${fmtMoney(total)} outstanding across ${open.length} open invoice${open.length === 1 ? '' : 's'}.`,
        data: { total, count: open.length },
        chart: { type: 'summary' },
      };
    }

    case 'overdue_invoices': {
      const overdue = invoices.filter((inv) => inv.paymentStatus === 'overdue');
      const total = roundMoney(overdue.reduce((sum, inv) => sum + outstandingOf(inv), 0));
      if (overdue.length === 0) {
        return { answer: 'No invoices are currently overdue. Nice work — everything is on track.', data: { count: 0, total: 0, invoices: [] }, chart: { type: 'list' } };
      }
      return {
        answer: `${overdue.length} invoice${overdue.length === 1 ? ' is' : 's are'} overdue, totalling ${fmtMoney(total)}.`,
        data: { count: overdue.length, total, invoices: list(overdue) },
        chart: { type: 'list' },
      };
    }

    case 'due_this_week': {
      const from = now;
      const to = new Date(now.getTime() + 7 * 86400000);
      const due = invoices.filter(
        (inv) => isOpen(inv) && inRange(inv.dueDate, from, to)
      );
      if (due.length === 0) {
        return { answer: 'Nothing is due in the next 7 days.', data: { count: 0, invoices: [] }, chart: { type: 'list' } };
      }
      return {
        answer: `${due.length} invoice${due.length === 1 ? ' is' : 's are'} due within the next week, worth ${fmtMoney(due.reduce((s, inv) => s + outstandingOf(inv), 0))} in total.`,
        data: { count: due.length, invoices: list(due) },
        chart: { type: 'list' },
      };
    }

    case 'top_vendor': {
      const byVendor = {};
      for (const inv of invoices) {
        const name = inv.vendorName || 'Unknown vendor';
        byVendor[name] = (byVendor[name] || 0) + (Number(inv.totalAmount) || 0);
      }
      const rows = Object.entries(byVendor).sort((a, b) => b[1] - a[1]);
      if (rows.length === 0) {
        return { answer: 'No vendor spend data is available yet.', data: { rows: [] }, chart: { type: 'breakdown' } };
      }
      const [topName, topSpend] = rows[0];
      const share = invoices.length ? Math.round((topSpend / rows.reduce((s, [, v]) => s + v, 0)) * 100) : 0;
      return {
        answer: `${topName} is your top vendor with ${fmtMoney(topSpend)} in total invoice value (${share}% of spend).`,
        data: { top: topName, spend: topSpend, share, rows: rows.slice(0, 5).map(([name, spend]) => ({ vendorName: name, totalSpend: roundMoney(spend) })) },
        chart: { type: 'breakdown' },
      };
    }

    case 'gst_period': {
      const lastMonth = hasAny(questionText(ctx), ['last month']);
      const range = lastMonth ? { from: prevMonthStart(now), to: monthStart(now) } : { from: monthStart(now), to: nextMonthStart(now) };
      const period = lastMonth ? monthLabel(prevMonthStart(now)) : monthLabel(monthStart(now));
      const periodInvoices = invoices.filter((inv) => inRange(inv.invoiceDate, range.from, range.to));
      const tax = roundMoney(periodInvoices.reduce((sum, inv) => sum + (Number(inv.tax) || 0), 0));
      return {
        answer: `You paid ${fmtMoney(tax)} in GST/VAT during ${period} across ${periodInvoices.length} invoice${periodInvoices.length === 1 ? '' : 's'}.`,
        data: { tax, count: periodInvoices.length, period },
        chart: { type: 'summary' },
      };
    }

    case 'invoices_above':
    case 'invoices_below': {
      const threshold = params.amount ?? parseAmount(ctx.question || '');
      if (!threshold) {
        return { answer: 'I could not find an amount in your question. Try “Show invoices above ₹50,000.”', data: { invoices: [] }, chart: { type: 'list' } };
      }
      const matches = invoices.filter((inv) => {
        const amount = Number(inv.totalAmount) || 0;
        if (intent === 'invoices_above') {
          return params.inclusive ? amount >= threshold : amount > threshold;
        }
        return amount <= threshold;
      });
      const total = roundMoney(matches.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0));
      const dir = intent === 'invoices_above' ? 'above' : 'at or below';
      return {
        answer: `${matches.length} invoice${matches.length === 1 ? '' : 's'} ${dir} ${fmtMoney(threshold)}, totalling ${fmtMoney(total)}.`,
        data: { threshold, total, invoices: list(matches) },
        chart: { type: 'list' },
      };
    }

    case 'total_this_month': {
      const range = { from: monthStart(now), to: nextMonthStart(now) };
      const month = monthLabel(monthStart(now));
      const monthInvoices = invoices.filter((inv) => inRange(inv.invoiceDate, range.from, range.to));
      const total = roundMoney(monthInvoices.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0));
      return {
        answer: `Your total invoice value for ${month} is ${fmtMoney(total)} across ${monthInvoices.length} invoice${monthInvoices.length === 1 ? '' : 's'}.`,
        data: { total, count: monthInvoices.length, period: month },
        chart: { type: 'summary' },
      };
    }

    case 'paid_this_month': {
      const range = { from: monthStart(now), to: nextMonthStart(now) };
      const month = monthLabel(monthStart(now));
      const paidInvoices = invoices.filter(
        (inv) => inv.paidDate && inRange(inv.paidDate, range.from, range.to)
      );
      const paidTotal = roundMoney(paidInvoices.reduce((s, inv) => s + (Number(inv.amountPaid) || 0), 0));
      return {
        answer: `You have paid ${fmtMoney(paidTotal)} in ${month} across ${paidInvoices.length} payment${paidInvoices.length === 1 ? '' : 's'}.`,
        data: { total: paidTotal, count: paidInvoices.length, period: month },
        chart: { type: 'summary' },
      };
    }

    case 'month_comparison': {
      const cur = invoices.filter((inv) => inRange(inv.invoiceDate, monthStart(now), nextMonthStart(now)));
      const prev = invoices.filter((inv) => inRange(inv.invoiceDate, prevMonthStart(now), monthStart(now)));
      const curTotal = roundMoney(cur.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0));
      const prevTotal = roundMoney(prev.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0));
      let comparison;
      if (prevTotal === 0) comparison = `This month (${fmtMoney(curTotal)}) vs last month (${fmtMoney(0)}) — last month had no recorded invoices.`;
      else {
        const diff = roundMoney(curTotal - prevTotal);
        const pct = Math.round((Math.abs(diff) / prevTotal) * 100);
        comparison = `This month (${fmtMoney(curTotal)}) is ${diff >= 0 ? 'up' : 'down'} ${pct}% versus last month (${fmtMoney(prevTotal)}).`;
      }
      return {
        answer: comparison,
        data: { current: curTotal, previous: prevTotal, currentLabel: monthLabel(monthStart(now)), previousLabel: monthLabel(prevMonthStart(now)) },
        chart: { type: 'summary' },
      };
    }

    case 'invoice_count': {
      return {
        answer: `You have ${invoices.length} invoice${invoices.length === 1 ? '' : 's'} in your account.`,
        data: { count: invoices.length },
        chart: { type: 'summary' },
      };
    }

    case 'largest_invoice': {
      if (invoices.length === 0) {
        return { answer: 'There are no invoices to look at yet.', data: null, chart: { type: 'summary' } };
      }
      const largest = invoices.reduce((best, inv) =>
        (Number(inv.totalAmount) || 0) > (Number(best.totalAmount) || 0) ? inv : best
      );
      return {
        answer: `Your largest invoice is ${largest.invoiceNumber || 'an unnumbered invoice'} from ${largest.vendorName || 'an unknown vendor'} for ${fmtMoney(largest.totalAmount)} (dated ${fmtDate(largest.invoiceDate)}).`,
        data: { invoice: projectInvoice(largest) },
        chart: { type: 'detail' },
      };
    }

    case 'category_breakdown': {
      const byCat = {};
      for (const inv of invoices) {
        const cat = inv.category || 'uncategorized';
        byCat[cat] = (byCat[cat] || 0) + (Number(inv.totalAmount) || 0);
      }
      const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([category, amount]) => ({ category, amount: roundMoney(amount) }));
      if (rows.length === 0) {
        return { answer: 'No category data is available yet.', data: { rows: [] }, chart: { type: 'breakdown' } };
      }
      return {
        answer: `Your top category is ${rows[0].category} at ${fmtMoney(rows[0].amount)}.`,
        data: { rows },
        chart: { type: 'breakdown' },
      };
    }

    case 'vendor_count': {
      const vendors = new Set(invoices.map((inv) => inv.vendorName).filter(Boolean));
      return {
        answer: `You deal with ${vendors.size} vendor${vendors.size === 1 ? '' : 's'}.`,
        data: { count: vendors.size },
        chart: { type: 'summary' },
      };
    }

    case 'average_invoice': {
      if (invoices.length === 0) {
        return { answer: 'There are no invoices to average yet.', data: null, chart: { type: 'summary' } };
      }
      const avg = roundMoney(invoices.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0) / invoices.length);
      return {
        answer: `Your average invoice amount is ${fmtMoney(avg)} across ${invoices.length} invoice${invoices.length === 1 ? '' : 's'}.`,
        data: { average: avg, count: invoices.length },
        chart: { type: 'summary' },
      };
    }

    case 'unpaid_invoices': {
      const open = invoices.filter((inv) => inv.paymentStatus === 'unpaid');
      const total = roundMoney(open.reduce((s, inv) => s + (Number(inv.totalAmount) || 0), 0));
      return {
        answer: `${open.length} invoice${open.length === 1 ? ' is' : 's are'} unpaid, worth ${fmtMoney(total)} in total.`,
        data: { count: open.length, total, invoices: list(open) },
        chart: { type: 'list' },
      };
    }

    case 'status_breakdown': {
      const count = { paid: 0, partial: 0, unpaid: 0, overdue: 0 };
      for (const inv of invoices) {
        const status = inv.paymentStatus || 'unpaid';
        count[status] = (count[status] || 0) + 1;
      }
      const label = (k) => `${count[k]} ${k}`;
      return {
        answer: `Payment status: ${label('paid')} paid, ${label('partial')} partial, ${label('unpaid')} unpaid, ${label('overdue')} overdue.`,
        data: count,
        chart: { type: 'breakdown' },
      };
    }

    case 'fallback':
    default: {
      return {
        answer:
          'I can answer questions about your invoice data — for example outstanding totals, overdue or upcoming invoices, top vendors, GST paid, and spending by category or month. Try one of the suggested questions below.',
        data: null,
        chart: null,
      };
    }
  }
}

function questionText(ctx) {
  return ` ${(ctx.question || '').toLowerCase()} `;
}

/**
 * Full Q&A entry point (pure — takes the user's invoices from the caller).
 * @param {string} question
 * @param {Array} invoices — lean invoice docs owned by the user
 * @param {Object} opts { now } — injectable clock for tests
 * @returns {Object} { intent, question, answer, data, chart, suggestions }
 */
function answerQuestion(question, invoices = [], opts = {}) {
  const ctx = { ...opts, question, params: {} };
  const { intent, params } = detectIntent(question);
  ctx.params = params;
  const resolved = resolve(intent, invoices, ctx);
  return {
    intent,
    question,
    answer: resolved.answer,
    data: resolved.data,
    chart: resolved.chart || null,
    suggestions: followUps(intent),
  };
}

/** Suggested starter questions shown in the UI. */
function getSuggestions() {
  return SUGGESTION_POOL;
}

module.exports = {
  detectIntent,
  parseAmount,
  resolve,
  answerQuestion,
  getSuggestions,
};
