// components/layout/Navbar.js
import { useRouter } from 'next/router';
import { authAPI } from '../../lib/api';

const Navbar = ({ sidebarOpen, setSidebarOpen, user }) => {
  const router = useRouter();
  
  const handleLogout = () => {
    authAPI.logout();
    router.push('/login');
  };
  
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex items-center">
          <h1 className="text-xl font-semibold text-gray-900">NLP SQL Bot</h1>
        </div>
        <div className="ml-4 flex items-center md:ml-6">
          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <div className="flex items-center">
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500">
                <span className="text-sm font-medium leading-none text-white">
                  {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                </span>
              </span>
              <span className="ml-2 text-sm text-gray-700">{user?.name || 'User'}</span>
              <button
                onClick={handleLogout}
                className="ml-4 px-3 py-1 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;