import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import html2canvas from 'html2canvas';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ResultGraph = ({
  data = [],
  sql = '', // Add SQL prop
  title = 'Query Results',
  className = '',
  maxHeight = 400,
  emptyMessage = 'No results found.',
}) => {
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState('bar');
  const [activeTab, setActiveTab] = useState('graph'); // 'graph' or 'data' or 'sql'
  const [copiedSQL, setCopiedSQL] = useState(false);
  
  // Enhanced chart data processing
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const firstRow = data[0];
    const keys = Object.keys(firstRow);
    
    // Check for time-series data (looking for date/month columns)
    const timeColumns = keys.filter(key => 
      key.toLowerCase().includes('date') || 
      key.toLowerCase().includes('month') || 
      key.toLowerCase().includes('year')
    );
    
    // Find numeric columns (excluding the time column)
    const numericColumns = keys.filter(key => 
      !timeColumns.includes(key) && 
      (typeof firstRow[key] === 'number' || !isNaN(parseFloat(firstRow[key])))
    );

    // If we have time-series data
    if (timeColumns.length > 0 && numericColumns.length > 0) {
      const timeColumn = timeColumns[0];
      return {
        labels: data.map(row => row[timeColumn]),
        datasets: numericColumns.map(column => ({
          label: column.replace(/([A-Z])/g, ' $1').trim(), // Add spaces before capital letters
          data: data.map(row => parseFloat(row[column])),
          backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`,
          borderColor: `hsla(${Math.random() * 360}, 70%, 50%, 1)`,
          borderWidth: 1,
        })),
      };
    }

    // Handle single row with multiple columns
    if (data.length === 1) {
      return {
        labels: numericColumns,
        datasets: [{
          label: 'Values',
          data: numericColumns.map(column => parseFloat(firstRow[column])),
          backgroundColor: numericColumns.map(() => `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`),
          borderColor: numericColumns.map(() => `hsla(${Math.random() * 360}, 70%, 50%, 1)`),
          borderWidth: 1,
        }],
      };
    }

    // Default case: use first non-numeric column as labels
    const nonNumericColumns = keys.filter(key => !numericColumns.includes(key));
    if (nonNumericColumns.length > 0 && numericColumns.length > 0) {
      return {
        labels: data.map(row => row[nonNumericColumns[0]]),
        datasets: numericColumns.map(column => ({
          label: column.replace(/([A-Z])/g, ' $1').trim(),
          data: data.map(row => parseFloat(row[column])),
          backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`,
          borderColor: `hsla(${Math.random() * 360}, 70%, 50%, 1)`,
          borderWidth: 1,
        })),
      };
    }

    return null;
  }, [data]);

  // Automatically determine the best chart type
  useEffect(() => {
    if (!chartData) return;

    if (chartData.datasets[0].data.length === 1) {
      setChartType('doughnut');
    } else if (chartData.labels.some(label => 
      label.includes('-') || label.includes('/') || label.toLowerCase().includes('month')
    )) {
      setChartType('line'); // Use line chart for time series
    } else if (chartData.labels.length > 10) {
      setChartType('line');
    } else {
      setChartType('bar');
    }
  }, [chartData]);

  const downloadImage = async () => {
    if (!chartRef.current) return;
    
    const canvas = await html2canvas(chartRef.current);
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const downloadCSV = () => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = `${title.replace(/\s+/g, '_')}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSQL(true);
      setTimeout(() => setCopiedSQL(false), 2000);
    });
  };

  const renderDataTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Object.keys(data[0]).map((header, i) => (
              <th
                key={i}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, i) => (
            <tr key={i}>
              {Object.values(row).map((value, j) => (
                <td
                  key={j}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                >
                  {value?.toString() || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSQL = () => (
    <div className="bg-gray-800 rounded-lg p-4 relative">
      <button
        onClick={handleCopySQL}
        className="absolute top-2 right-2 px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
      >
        {copiedSQL ? 'Copied!' : 'Copy SQL'}
      </button>
      <pre className="text-gray-100 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
        {sql}
      </pre>
    </div>
  );

  if (!chartData) {
    return <div className="text-center text-gray-500 py-8">{emptyMessage}</div>;
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: chartType !== 'doughnut' ? {
      y: {
        beginAtZero: true,
      },
    } : undefined,
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('graph')}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'graph'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Graph View
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'data'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Data View
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`py-2 px-4 text-sm font-medium ${
            activeTab === 'sql'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          SQL Query
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 mb-4">
        {activeTab === 'graph' && (
          <>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Bar
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 rounded ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('doughnut')}
              className={`px-3 py-1 rounded ${chartType === 'doughnut' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Doughnut
            </button>
            <button
              onClick={downloadImage}
              className="px-3 py-1 rounded bg-green-600 text-white"
            >
              Download PNG
            </button>
          </>
        )}
        {activeTab !== 'sql' && (
          <button
            onClick={downloadCSV}
            className="px-3 py-1 rounded bg-green-600 text-white"
          >
            Download CSV
          </button>
        )}
      </div>
      
      {/* Content */}
      <div style={{ height: maxHeight }}>
        {activeTab === 'graph' ? (
          <div ref={chartRef} style={{ height: '100%' }}>
            {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
            {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
            {chartType === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}
          </div>
        ) : activeTab === 'data' ? (
          renderDataTable()
        ) : (
          renderSQL()
        )}
      </div>
    </div>
  );
};

export default ResultGraph;
