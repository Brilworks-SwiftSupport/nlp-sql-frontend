// components/query/ResultTable.js
import React, { useState, useMemo } from 'react';

const ResultTable = ({ 
  data = [], 
  rowCount = null,
  title = 'Query Results',
  className = '',
  onDownload = null,
  maxHeight = null,
  emptyMessage = 'No results found.',
  showRowsPerPage = true,
  initialRowsPerPage = 10
}) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);
  
  // Get total row count
  const totalRows = rowCount !== null ? rowCount : data.length;
  
  // Get column headers from first row if data exists
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);
  
  // Calculate pagination
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIdx = (page - 1) * rowsPerPage;
  const paginatedData = data.slice(startIdx, startIdx + rowsPerPage);
  
  // Handle CSV download
  const handleDownload = () => {
    if (!data.length) return;
    
    // Create CSV content
    const csvHeader = columns.join(',');
    const csvRows = data.map(row => {
      return columns.map(col => {
        const value = row[col];
        // Handle null values, string escaping, etc.
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return value;
      }).join(',');
    });
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    // Create blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'query_results.csv');
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (onDownload) onDownload(csvContent);
  };
  
  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10);
    setRowsPerPage(value);
    setPage(1); // Reset to first page
  };
  
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center space-x-4">
          <span className="text-gray-500 text-sm">{totalRows} total rows</span>
          
          {onDownload !== false && (
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-1.5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download CSV
            </button>
          )}
        </div>
      </div>
      
      <div 
        className="overflow-x-auto"
        style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map((column) => (
                  <td
                    key={`${rowIdx}-${column}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {row[column] === null || row[column] === undefined
                      ? <span className="text-gray-400 italic">NULL</span>
                      : typeof row[column] === 'object'
                      ? JSON.stringify(row[column])
                      : String(row[column])
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
          {showRowsPerPage && (
            <div className="flex items-center">
              <label htmlFor="rows-per-page" className="text-sm text-gray-700 mr-2">
                Rows per page:
              </label>
              <select
                id="rows-per-page"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}
          
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIdx + 1}</span> to{' '}
              <span className="font-medium">{Math.min(startIdx + rowsPerPage, data.length)}</span> of{' '}
              <span className="font-medium">{data.length}</span> results
            </div>
            
            <div className="flex ml-4 space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1 text-sm rounded-md ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-3 py-1 text-sm rounded-md ${
                  page === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultTable;