// components/query/QueryForm.js
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { validateValue, getInputType } from '../../utils/typeValidator';

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
  const [schema, setSchema] = useState({});
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [pairs, setPairs] = useState([{ table: '', column: '', value: '' }]);

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

  // Fetch schema with tables and columns
  const fetchSchema = async () => {
    setIsLoadingSchema(true);
    setSchemaError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiUrl}/connections/${connectionId}/tables`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok || data.status !== 'success' || !data.tables) {
        throw new Error(data.message || 'Failed to load schema');
      }

      const schemaData = {};
      data.tables.forEach(tableName => {
        if (!tableName) return;
        
        const name = typeof tableName === 'string' ? tableName : tableName.name;
        if (!name) return;
        
        const columns = [];
        if (tableName.columns && Array.isArray(tableName.columns)) {
          tableName.columns.forEach(col => {
            if (col && col.name) {
              columns.push({
                name: col.name,
                type: col.data_type || 'unknown',
                is_primary_key: col.is_primary_key || false,
                is_foreign_key: col.is_foreign_key || false,
                nullable: col.nullable || true
              });
            }
          });
        }
        schemaData[name] = columns;
      });

      setSchema(schemaData);
    } catch (err) {
      setSchemaError(err.message);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  useEffect(() => {
    if (connectionId) {
      fetchSchema();
    }
  }, [connectionId]);

  const addPair = () => {
    setPairs([...pairs, { table: '', column: '', value: '' }]);
  };

  const removePair = (index) => {
    const newPairs = [...pairs];
    newPairs.splice(index, 1);
    setPairs(newPairs);
  };

  const handleTableChange = async (index, tableName) => {
    const newPairs = [...pairs];
    newPairs[index].table = tableName;
    setPairs(newPairs);
    // await fetchColumns(tableName);
  };

  const handleColumnChange = (index, columnName) => {
    const newPairs = [...pairs];
    newPairs[index].column = columnName;
    setPairs(newPairs);
  };

  const handleValueChange = (index, value) => {
    const newPairs = [...pairs];
    const pair = newPairs[index];
    
    // Get column type and nullable info
    const columnInfo = pair.table && schema[pair.table] ? 
      schema[pair.table].find(col => col.name === pair.column) : null;
    
    // Validate value
    let error = null;
    if (columnInfo) {
      error = validateValue(value, columnInfo.type, columnInfo.nullable);
    }
    
    // Update validation errors
    const newErrors = { ...validationErrors };
    if (error) {
      newErrors[index] = error;
    } else {
      delete newErrors[index];
    }
    setValidationErrors(newErrors);
    
    pair.value = value;
    setPairs(newPairs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    // Filter out pairs with empty table or column
    const validPairs = pairs.filter(pair => pair.table && pair.column).map(pair => ({
      table: pair.table,
      column: pair.column,
      value: pair.value
    }));

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await onQueryResult(query, validPairs);
      
      if (result && result.status === 'error') {
        setError(result.message || 'Failed to execute query');
      }
      
      // Reset validation errors after successful submission
      setValidationErrors({});
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
      
      {/* Table-Column-Value Pairs Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Table-Column-Value Pairs</h3>
        
        {/* Loading/Error States */}
        {isLoadingSchema && (
          <div className="mb-4 text-sm text-gray-500">Loading tables...</div>
        )}
        {schemaError && (
          <div className="mb-4 text-sm text-red-500">{schemaError}</div>
        )}

        {pairs.map((pair, index) => (
          <div key={index} className="border rounded-lg p-4 mb-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pair.table}
                  onChange={(e) => handleTableChange(index, e.target.value)}
                  disabled={isLoadingSchema}
                >
                  <option value="">Select table</option>
                  {Object.keys(schema).map((table) => (
                    <option key={table} value={table}>{table}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Column</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pair.column}
                  onChange={(e) => handleColumnChange(index, e.target.value)}
                  disabled={!pair.table || isLoadingSchema}
                >
                  <option value="">Select column</option>
                  {pair.table && schema[pair.table] ? (
                    schema[pair.table].map((column) => (
                      <option key={column.name} value={column.name}>
                        {column.name} ({column.type})
                      </option>
                    ))
                  ) : (
                    <option value="">No columns available</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <div className="relative">
                  <input
                    type={getInputType(
                      pair.column && schema[pair.table] && 
                      schema[pair.table].find(col => col.name === pair.column)?.type || 'text'
                    )}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors[index] ? 'border-red-500' : ''
                    }`}
                    value={pair.value}
                    onChange={(e) => handleValueChange(index, e.target.value)}
                  />
                  {pair.column && schema[pair.table] && schema[pair.table].find(col => col.name === pair.column) && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                      {schema[pair.table].find(col => col.name === pair.column).type}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {validationErrors[index] && (
              <div className="text-sm text-red-500 mt-1">
                {validationErrors[index]}
              </div>
            )}
            {index > 0 && (
              <button
                type="button"
                onClick={() => removePair(index)}
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Remove Pair
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addPair}
          className="text-sm text-blue-500 hover:text-blue-700"
        >
          Add New Pair
        </button>
      </div>

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