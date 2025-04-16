// components/common/Input.js
import React, { forwardRef } from 'react';

const Input = forwardRef(({
  type = 'text',
  label = '',
  name,
  id,
  value,
  onChange,
  onBlur,
  placeholder = '',
  error = '',
  helper = '',
  className = '',
  containerClassName = '',
  labelClassName = '',
  inputClassName = '',
  disabled = false,
  required = false,
  leftIcon = null,
  rightIcon = null,
  ...props
}, ref) => {
  const baseInputClasses = 'block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm';
  const errorInputClasses = error ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : '';
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
  const inputId = id || name;

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium text-gray-700 mb-1 ${labelClassName}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative rounded-md shadow-sm">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          name={name}
          id={inputId}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            ${baseInputClasses}
            ${errorInputClasses}
            ${disabledClasses}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${inputClassName}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>

      {(error || helper) && (
        <p className={`mt-2 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helper}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;