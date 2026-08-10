export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    ME: '/auth/me',
  },
  INVOICES: {
    BASE: '/invoices',
    UPLOAD: '/invoices/upload',
    BY_ID: (id) => `/invoices/${id}`,
    EXPORT: (id, format) => `/invoices/${id}/export?format=${format}`,
    PAYMENT: (id) => `/invoices/${id}/payment`,
    GENERATE: '/invoices/generate',
    GENERATE_NEXT: '/invoices/generate/next',
    PDF: (id) => `/invoices/${id}/pdf`,
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
  },
  VENDORS: {
    BASE: '/vendors',
    BY_NAME: (name) => `/vendors/${encodeURIComponent(name)}`,
  },
  AI: {
    ASK: '/ai/ask',
    SUGGESTIONS: '/ai/suggestions',
  },
  INSIGHTS: {
    BASE: '/insights',
  },
};

export const INVOICE_SOURCE = {
  EXTRACTED: 'extracted',
  GENERATED: 'generated',
};

export const INVOICE_TEMPLATES = [
  { value: 'classic', label: 'Classic', description: 'Cream header band with bordered tables' },
  { value: 'minimal', label: 'Minimal', description: 'Hairline rules, no filled bands' },
];

export const GST_RATES = [
  { value: '0', label: '0% (exempt)' },
  { value: '5', label: '5%' },
  { value: '12', label: '12%' },
  { value: '18', label: '18%' },
  { value: '28', label: '28%' },
];

export const VALIDATION_STATUS = {
  VALID: 'valid',
  WARNING: 'warning',
  ANOMALY: 'anomaly',
  ERROR: 'error',
};

export const FILE_TYPES = {
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  APPLICATION_PDF: 'application/pdf',
};

export const ALLOWED_FILE_TYPES = [
  FILE_TYPES.IMAGE_JPEG,
  FILE_TYPES.IMAGE_PNG,
  FILE_TYPES.APPLICATION_PDF,
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const INVOICE_STATUS = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  FAILED: 'failed',
};

export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
};

export const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'upi', label: 'UPI' },
  { value: 'card', label: 'Card' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];

export const ITEMS_PER_PAGE = 20;

export const VENDOR_SORT_OPTIONS = [
  { value: 'spend', label: 'Total Spend' },
  { value: 'name', label: 'Name' },
  { value: 'count', label: 'Invoices' },
  { value: 'recent', label: 'Most Recent' },
];
