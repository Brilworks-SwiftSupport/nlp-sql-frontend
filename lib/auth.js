// lib/auth.js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { isAuthenticated, getStoredUser } from './helpers';

/**
 * Custom hook to protect a page - redirects to login if not authenticated
 * @param {boolean} redirectIfAuthenticated - Whether to redirect away if user is authenticated
 * @param {string} redirectPath - Path to redirect to
 * @returns {object} Authentication state
 */
export const useAuth = (redirectIfAuthenticated = false, redirectPath = '/login') => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Check authentication status
    const authenticated = isAuthenticated();
    const storedUser = getStoredUser();
    
    if (!authenticated && !redirectIfAuthenticated) {
      // Not authenticated, redirect to login
      router.push(redirectPath);
    } else if (authenticated && redirectIfAuthenticated) {
      // Authenticated but should redirect away (used for login/register pages)
      router.push('/dashboard');
    } else {
      // Set user if available
      if (storedUser) {
        setUser(storedUser);
      }
      setLoading(false);
    }
  }, [router, redirectIfAuthenticated, redirectPath]);
  
  return { loading, user };
};

/**
 * Higher-order component to wrap protected pages
 * @param {Component} Component - Component to wrap
 * @param {object} options - Configuration options
 * @returns {Component} Wrapped component
 */
export const withAuth = (Component, options = {}) => {
  const { redirectIfAuthenticated = false, redirectPath = '/login' } = options;
  
  const WrappedComponent = (props) => {
    const { loading, user } = useAuth(redirectIfAuthenticated, redirectPath);
    
    if (loading) {
      // Show loading state
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }
    
    return <Component {...props} user={user} />;
  };
  
  // Copy static methods
  if (Component.getInitialProps) {
    WrappedComponent.getInitialProps = Component.getInitialProps;
  }
  
  return WrappedComponent;
};

/**
 * Create a protected page route
 * @param {Component} Component - Component to protect
 * @returns {Component} Protected component
 */
export const createProtectedRoute = (Component) => withAuth(Component);

/**
 * Create a public page route that redirects to dashboard if authenticated
 * @param {Component} Component - Component to protect
 * @returns {Component} Protected component
 */
export const createPublicRoute = (Component) => withAuth(Component, { redirectIfAuthenticated: true, redirectPath: '/dashboard' });