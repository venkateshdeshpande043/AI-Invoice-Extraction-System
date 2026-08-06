import PropTypes from 'prop-types';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ServiceStatusBanner from '../common/ServiceStatusBanner';

function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ServiceStatusBanner />
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;
