import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="text-center">
        <p className="eyebrow mb-3">Error 404</p>
        <h1 className="text-7xl font-display font-semibold text-sand">404</h1>
        <h2 className="text-2xl font-semibold text-espresso mt-4">Page not found</h2>
        <p className="text-mocha mt-2 mb-8 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
