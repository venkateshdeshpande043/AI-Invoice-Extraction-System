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
    pending: { label: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
    processed: { label: 'Processed', class: 'bg-green-100 text-green-800' },
    failed: { label: 'Failed', class: 'bg-red-100 text-red-800' },
  };
  return map[status] || { label: status, class: 'bg-gray-100 text-gray-800' };
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
