export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(amount, currency = 'INR') {
  if (amount == null || isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatStatus(status) {
  const map = {
    pending: { label: 'Pending', class: 'bg-amber-100 text-amber-900 border border-amber-200' },
    processed: { label: 'Processed', class: 'bg-emerald-100 text-emerald-900 border border-emerald-200' },
    failed: { label: 'Failed', class: 'bg-rose-100 text-rose-900 border border-rose-200' },
  };
  return map[status] || { label: status, class: 'bg-gray-100 text-gray-700 border border-gray-200' };
}

export function formatPaymentStatus(status) {
  const map = {
    paid: { label: 'Paid', class: 'bg-emerald-100 text-emerald-900 border border-emerald-200' },
    partial: { label: 'Partial', class: 'bg-amber-100 text-amber-900 border border-amber-200' },
    overdue: { label: 'Overdue', class: 'bg-rose-100 text-rose-900 border border-rose-200' },
    unpaid: { label: 'Unpaid', class: 'bg-stone-100 text-stone-700 border border-stone-200' },
  };
  return (
    map[status] || { label: status || '—', class: 'bg-gray-100 text-gray-700 border border-gray-200' }
  );
}

export function formatValidationStatus(status) {
  const map = {
    valid: { label: 'Valid', class: 'bg-emerald-100 text-emerald-900 border border-emerald-200' },
    warning: { label: 'Warning', class: 'bg-amber-100 text-amber-900 border border-amber-200' },
    anomaly: { label: 'Anomaly', class: 'bg-orange-100 text-orange-900 border border-orange-200' },
    error: { label: 'Error', class: 'bg-rose-100 text-rose-900 border border-rose-200' },
  };
  return (
    map[status] || { label: status || '—', class: 'bg-gray-100 text-gray-700 border border-gray-200' }
  );
}

export function daysOverdue(dateString) {
  if (!dateString) return null;
  const due = new Date(dateString);
  if (isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - due.getTime()) / 86400000);
  return Math.max(diff, 0);
}

export function paymentMethodLabel(method) {
  const map = {
    bank_transfer: 'Bank Transfer',
    upi: 'UPI',
    card: 'Card',
    cheque: 'Cheque',
    cash: 'Cash',
    other: 'Other',
  };
  return map[method] || method || '—';
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text || '—';
  return text.substring(0, maxLength) + '...';
}
