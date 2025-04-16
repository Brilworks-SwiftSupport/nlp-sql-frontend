// components/auth/LoginForm.js
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { authAPI } from '../../lib/api';

const LoginForm = ({ 
  onSuccess = () => {},
  redirectTo = '/dashboard',
  showRegisterLink = true,
  registerLinkText = 'Create an account',
  registerLinkHref = '/register',
  logoUrl = null,
  title = 'Sign in to your account',
}) => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.status === 'success') {
        // Store token and user data
        localStorage.setItem('token', response.access_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Call success callback
        onSuccess(response);
        
        // Redirect if needed
        if (redirectTo) {
          router.push(redirectTo);
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {logoUrl && (
          <img
            className="mx-auto h-12 w-auto"
            src={logoUrl}
            alt="Logo"
          />
        )}
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {title}
        </h2>
        {showRegisterLink && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href={registerLinkHref}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {registerLinkText}
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <Alert
              type="error"
              message={error}
              className="mb-6"
            />
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                loadingText="Signing in..."
              >
                Sign in
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;