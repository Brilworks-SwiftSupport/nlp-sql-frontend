// components/tables/TableSelector.js
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';

const TableSelector = ({
  tables = [],
  selectedTables = [],
  onSelect = () => {},
  onSubmit = () => {},
  isLoading = false,
  className = '',
  title = 'Select Tables',
  subtitle = 'Choose which tables you want to include in your schema for natural language queries.',
  submitButtonText = 'Store Selected Tables Schema',
  maxHeight = null,
  allTablesOption = true,
  searchable = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalSelectedTables, setInternalSelectedTables] = useState(selectedTables);
  
  // Log props for debugging
  useEffect(() => {
    console.log('TableSelector - received props:');
    console.log('tables:', tables);
    console.log('selectedTables:', selectedTables);
    
    // Update internal state when prop changes
    setInternalSelectedTables(selectedTables);
  }, [selectedTables]);

  // Filter tables based on search query
  const filteredTables = searchable && searchQuery
    ? tables.filter(table => table.toLowerCase().includes(searchQuery.toLowerCase()))
    : tables;

  // Handle select all tables
  const handleSelectAll = () => {
    setInternalSelectedTables(tables);
    onSelect(tables, true);
  };

  // Handle deselect all tables
  const handleDeselectAll = () => {
    setInternalSelectedTables([]);
    onSelect([], false);
  };

  // Handle table selection change
  const handleTableSelectionChange = (tableName, isSelected) => {
    let newSelectedTables;
    if (isSelected) {
      newSelectedTables = [...internalSelectedTables, tableName];
    } else {
      newSelectedTables = internalSelectedTables.filter(table => table !== tableName);
    }
    
    setInternalSelectedTables(newSelectedTables);
    onSelect(newSelectedTables, false);
  };

  // Handle submit
  const handleSubmit = () => {
    onSubmit(internalSelectedTables);
  };

  // Calculate if all tables are selected
  const allTablesSelected = tables.length > 0 && internalSelectedTables.length === tables.length;

  if (!tables || tables.length === 0) {
    return (
      <Card
        title={title}
        subtitle="No tables found in this database or you don't have permission to access them."
        className={className}
      >
        <div className="flex justify-center items-center py-8">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="ml-3 text-sm text-gray-500">No tables available to select.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={title}
      subtitle={subtitle}
      className={className}
      style={{width: '100%'}}
    >
      <div className="w-full space-y-4">
        {/* Search and bulk actions */}
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          {searchable && (
            <div className="relative rounded-md shadow-sm max-w-xs">
              <input
                type="text"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search tables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}

          {allTablesOption && (
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={allTablesSelected || isLoading}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={internalSelectedTables.length === 0 || isLoading}
              >
                Deselect All
              </Button>
            </div>
          )}
        </div>

        {/* Table checkboxes */}
        <div
          className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4"
          style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}
        >
          {filteredTables.map((table) => (
            <div key={table} className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={`table-${table}`}
                  type="checkbox"
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  checked={internalSelectedTables.includes(table)}
                  onChange={(e) => handleTableSelectionChange(table, e.target.checked)}
                  disabled={isLoading}
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor={`table-${table}`}
                  className={`font-medium ${isLoading ? 'text-gray-400' : 'text-gray-700'} cursor-pointer`}
                >
                  {table}
                </label>
              </div>
            </div>
          ))}

          {filteredTables.length === 0 && searchQuery && (
            <div className="col-span-full text-center py-4 text-gray-500">
              No tables match your search query "{searchQuery}"
            </div>
          )}
        </div>

        {/* Selected tables count */}
        <div className="text-sm text-gray-500">
          {internalSelectedTables.length} of {tables.length} tables selected
        </div>

        {/* Submit button */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={internalSelectedTables.length === 0 || isLoading}
            isLoading={isLoading}
            loadingText="Storing Schema..."
          >
            {submitButtonText}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default TableSelector;