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
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
  },
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

export const ITEMS_PER_PAGE = 20;
