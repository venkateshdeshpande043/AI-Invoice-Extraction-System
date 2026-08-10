import PropTypes from 'prop-types';
import ServiceStatusBanner from '../components/common/ServiceStatusBanner';

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <ServiceStatusBanner />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-espresso rounded-md shadow-lift mb-5">
              <svg className="w-6 h-6 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="eyebrow mb-2">Invoice AI</p>
            <h1 className="text-3xl font-semibold text-espresso">{title}</h1>
            {subtitle && <p className="text-mocha mt-2 text-sm">{subtitle}</p>}
          </div>
          <div className="bg-white rounded-lg border border-sand shadow-lift p-8">{children}</div>
          <p className="text-center text-xs text-taupe mt-6">
            Secure JWT authentication · Offline PaddleOCR extraction
          </p>
        </div>
      </div>
    </div>
  );
}

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
};

export default AuthLayout;
