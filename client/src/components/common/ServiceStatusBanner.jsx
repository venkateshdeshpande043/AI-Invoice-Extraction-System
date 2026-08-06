import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

function ServiceStatusBanner() {
  const [status, setStatus] = useState({ loading: true, database: null, ocr: null, error: null });

  const checkHealth = useCallback(async () => {
    try {
      const res = await api.get('/health', { timeout: 5000 });
      const { database, ocr } = res.data;
      setStatus({ loading: false, database, ocr, error: null });
    } catch (err) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setStatus({ loading: false, database: null, ocr: null, error: 'Backend server is not running' });
      } else if (err.response?.status === 503) {
        const data = err.response.data;
        setStatus({ loading: false, database: data.database, ocr: data.ocr, error: null });
      } else {
        setStatus({ loading: false, database: null, ocr: null, error: 'Cannot reach backend server' });
      }
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Re-check every 30s
    return () => clearInterval(interval);
  }, [checkHealth]);

  if (status.loading) return null;

  const servicesDown = [];
  if (status.database === 'disconnected') servicesDown.push('Database');
  if (status.ocr === 'disconnected') servicesDown.push('OCR Engine');
  if (status.error) servicesDown.push('Backend');

  if (servicesDown.length === 0) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>
              {status.error
                ? status.error
                : `Service Unavailable: ${servicesDown.join(', ')}. Some features may not work.`}
            </span>
          </div>
          <button
            onClick={checkHealth}
            className="text-xs text-amber-700 hover:text-amber-900 underline flex-shrink-0 ml-2"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceStatusBanner;
