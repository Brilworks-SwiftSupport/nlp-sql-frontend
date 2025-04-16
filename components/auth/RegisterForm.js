// components/auth/RegisterForm.js
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Input from '../common/Input';
import Button from '../common/Button';
import Alert from '../common/Alert';
import { authAPI } from '../../lib/api';

const RegisterForm = ({
  onSuccess = () => {},
  redirectTo = '/dashboard',
  showLoginLink = true,
  loginLinkText = 'Already have an account? Sign in',
  loginLinkHref = '/login',
  logoUrl = null,
  title = 'Create a new account',
}) => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear specific field error when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setGeneralError('');
      
      const response = await authAPI.register(
        formData.email,
        formData.password,
        formData.name
      );
      
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
        setGeneralError(response.message || 'Registration failed');
      }
    } catch (err) {
      setGeneralError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
        {showLoginLink && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href={loginLinkHref}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {loginLinkText}
            </Link>
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {generalError && (
            <Alert
              type="error"
              message={generalError}
              className="mb-6"
            />
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              id="name"
              name="name"
              type="text"
              label="Full name"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />
            
            <Input
              id="email"
              name="email"
              type="email"
              label="Email address"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              autoComplete="new-password"
              required
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
            
            <Input
              id="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              label="Confirm password"
              autoComplete="new-password"
              required
              value={formData.passwordConfirmation}
              onChange={handleChange}
              error={errors.passwordConfirmation}
            />

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                loadingText="Creating account..."
              >
                Create account
              </Button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  By signing up, you agree to our Terms and Privacy Policy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;