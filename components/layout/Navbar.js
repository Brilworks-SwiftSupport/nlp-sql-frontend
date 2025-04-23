// components/layout/Navbar.js
import { useRouter } from 'next/router';
import { authAPI } from '../../lib/api';
import { useState } from 'react';

const Navbar = ({ sidebarOpen, setSidebarOpen, user }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    authAPI.logout();
    router.push('/login');
  };

  return (
    <nav className="relative z-10 bg-white shadow">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Mobile sidebar toggle */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </button>
          </div>

          {/* Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">NLP SQL Bot</h1>
          </div>

          {/* Profile */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500">
              <span className="text-sm font-medium leading-none text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </span>
            </span>
            <span className="text-sm text-gray-700">{user?.name || 'User'}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="ml-2 p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
            >
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500">
              <span className="text-sm font-medium leading-none text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </span>
            </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-3 space-y-1">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-500">
              <span className="text-sm font-medium leading-none text-white">
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </span>
            </span>
            <span className="text-sm text-gray-700">{user?.name || 'User'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
