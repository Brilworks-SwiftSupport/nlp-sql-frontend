// components/common/Card.js
import React from 'react';

const Card = ({
  children,
  className = '',
  title = '',
  subtitle = '',
  footer = null,
  noPadding = false,
  bordered = true,
  shadow = true,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-lg overflow-hidden';
  const borderClasses = bordered ? 'border border-gray-200' : '';
  const shadowClasses = shadow ? 'shadow' : '';

  return (
    <div
      className={`${baseClasses} ${borderClasses} ${shadowClasses} ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
          {title && (
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className={noPadding ? '' : 'px-4 py-5 sm:p-6'}>
        {children}
      </div>

      {footer && (
        <div className="border-t border-gray-200 px-4 py-4 sm:px-6 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;