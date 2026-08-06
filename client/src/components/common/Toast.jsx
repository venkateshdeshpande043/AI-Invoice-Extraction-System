import PropTypes from 'prop-types';
import { useEffect } from 'react';

const types = {
  success: { bg: 'bg-green-50 border-green-400 text-green-800', icon: '✓' },
  error: { bg: 'bg-red-50 border-red-400 text-red-800', icon: '✕' },
  info: { bg: 'bg-blue-50 border-blue-400 text-blue-800', icon: 'ℹ' },
  warning: { bg: 'bg-yellow-50 border-yellow-400 text-yellow-800', icon: '⚠' },
};

function Toast({ message, type = 'info', isVisible, onClose, duration = 4000 }) {
  useEffect(() => {
    if (isVisible && onClose && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!isVisible) return null;

  const config = types[type] || types.info;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in">
      <div className={`flex items-center gap-3 px-4 py-3 border rounded-lg shadow-lg ${config.bg}`}>
        <span className="font-bold text-lg leading-none">{config.icon}</span>
        <p className="text-sm font-medium">{message}</p>
        {onClose && (
          <button onClick={onClose} className="ml-2 hover:opacity-70" aria-label="Dismiss">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(['success', 'error', 'info', 'warning']),
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
  duration: PropTypes.number,
};

export default Toast;
