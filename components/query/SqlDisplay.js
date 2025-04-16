// components/query/SqlDisplay.js
import React, { useState } from 'react';
import { formatSql } from '../../lib/helpers';

const SqlDisplay = ({ 
  sql, 
  title = 'Generated SQL Query',
  className = '', 
  onCopy = () => {},
  showCopyButton = true,
  maxHeight = null
}) => {
  const [copied, setCopied] = useState(false);
  
  // Format SQL for better readability if provided
  const formattedSql = sql ? formatSql(sql) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopied(true);
      onCopy();
      
      // Reset copied status after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  if (!sql) {
    return null;
  }

  return (
    <div className={`bg-white shadow rounded-lg p-6 mb-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        
        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 mr-1.5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4 mr-1.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy SQL
              </>
            )}
          </button>
        )}
      </div>
      
      <div 
        className="bg-gray-800 rounded-md p-4 overflow-auto"
        style={maxHeight ? { maxHeight } : {}}
      >
        <pre className="text-gray-100 font-mono text-sm whitespace-pre-wrap break-words">{formattedSql}</pre>
      </div>
    </div>
  );
};

export default SqlDisplay;