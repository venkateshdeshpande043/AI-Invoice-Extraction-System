import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <nav className="bg-white border-b border-sand sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-espresso rounded-md flex items-center justify-center shadow-soft transition-colors group-hover:bg-brown">
              <svg className="w-5 h-5 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <span className="font-display text-lg font-semibold text-espresso tracking-tight">
                Invoice <span className="text-brown">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-taupe">
                Document Intelligence
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden md:flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-beige border border-sand flex items-center justify-center text-xs font-semibold text-brown">
                {initials}
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-espresso">{user?.name}</p>
                <p className="text-[11px] text-mocha">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-mocha hover:text-espresso transition-colors px-3 py-1.5 rounded-md border border-transparent hover:border-sand hover:bg-ivory"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
