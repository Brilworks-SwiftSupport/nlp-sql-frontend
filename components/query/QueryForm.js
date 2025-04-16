// components/query/QueryForm.js
import React, { useState } from 'react';
import Button from '../common/Button';

const QueryForm = ({
  connectionId,
  onQueryResult,
  placeholder = "Ask a question in natural language (e.g., 'Show me all users who signed up last month')",
  buttonText = 'Execute Query',
  className = '',
  initialQuery = '',
  minRows = 3,
  maxRows = 6,
  recentQueries = [],
  showRecentQueries = true,
  onQuerySelect = null,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState(minRows);

  const handleChange = (e) => {
    const textarea = e.target;
    setQuery(textarea.value);
    
    // Auto-resize textarea based on content
    textarea.style.height = 'auto';
    const newRows = Math.min(
      Math.max(
        Math.ceil(textarea.scrollHeight / 24), // 24px is roughly one line height
        minRows
      ),
      maxRows
    );
    setRows(newRows);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await onQueryResult(query);
      
      if (result && result.status === 'error') {
        setError(result.message || 'Failed to execute query');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while executing the query');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleQuerySelect = (selectedQuery) => {
    setQuery(selectedQuery);
    if (onQuerySelect) {
      onQuerySelect(selectedQuery);
    }
  };

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Ask a question about your data</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={rows}
            placeholder={placeholder}
            value={query}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
        
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            loadingText="Executing..."
          >
            {buttonText}
          </Button>
        </div>
      </form>
      
      {showRecentQueries && recentQueries && recentQueries.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Queries</h3>
          <div className="space-y-2">
            {recentQueries.slice(0, 5).map((recentQuery, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleQuerySelect(recentQuery)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md truncate"
              >
                {recentQuery}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryForm;