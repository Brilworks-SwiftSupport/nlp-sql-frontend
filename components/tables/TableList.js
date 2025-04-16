// components/tables/TableList.js
import React, { useState } from 'react';
import Card from '../common/Card';

const TableList = ({ 
  tables = [], 
  onTableSelect = () => {},
  loading = false,
  className = '',
  title = 'Database Tables',
  subtitle = 'Select tables that you want to query with natural language.',
  searchable = true,
  gridCols = { sm: 2, md: 3, lg: 4 },
  maxHeight = null,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tables based on search query
  const filteredTables = searchable && searchQuery
    ? tables.filter(table => table.toLowerCase().includes(searchQuery.toLowerCase()))
    : tables;

  if (loading) {
    return (
      <Card 
        title={title}
        subtitle="Loading tables..."
        className={className}
      >
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Card>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <Card
        title={title}
        subtitle="No tables found in this database or you don't have permission to access them."
        className={className}
      >
        <div className="text-center py-6">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tables found</h3>
          <p className="mt-1 text-sm text-gray-500">
            There are no tables in this database or you don't have permission to access them.
          </p>
        </div>
      </Card>
    );
  }

  const gridClasses = `grid grid-cols-1 gap-y-4 sm:grid-cols-${gridCols.sm} sm:gap-x-6 md:grid-cols-${gridCols.md} lg:grid-cols-${gridCols.lg}`;

  return (
    <Card
      title={title}
      subtitle={subtitle}
      className={className}
    >
      {searchable && tables.length > 5 && (
        <div className="mb-6">
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
        </div>
      )}

      <div 
        className={gridClasses}
        style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}
      >
        {filteredTables.map((table) => (
          <div
            key={table}
            className="group relative bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden hover:border-gray-400"
          >
            <div className="flex-1 p-4 space-y-2 flex flex-col">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {table}
              </h3>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => onTableSelect(table)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredTables.length === 0 && searchQuery && (
          <div className="col-span-full text-center py-4 text-gray-500">
            No tables match your search query "{searchQuery}"
          </div>
        )}
      </div>
    </Card>
  );
};

export default TableList;