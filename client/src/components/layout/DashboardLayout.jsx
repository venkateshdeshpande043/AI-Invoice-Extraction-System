import PropTypes from 'prop-types';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ServiceStatusBanner from '../common/ServiceStatusBanner';

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-cream">
      <ServiceStatusBanner />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;
