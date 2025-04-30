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
  sql = '',
  title = 'Query Results',
  className = '',
  maxHeight = 400,
  emptyMessage = 'No results found.',
}) => {
  const chartRef = useRef(null);
  const [chartType, setChartType] = useState('bar');
  const [activeTab, setActiveTab] = useState('graph');
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [swappedAxes, setSwappedAxes] = useState(false); // New state for axis swapping

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const firstRow = data[0];
    const keys = Object.keys(firstRow);

    // Special handling for single record with two columns
    if (keys.length === 2 && data.length === 1) {
      const labels = keys.map(key => key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim());
      const values = keys.map(key => parseFloat(firstRow[key]));
      
      return {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [
            'hsla(210, 70%, 50%, 0.6)',
            'hsla(150, 70%, 50%, 0.6)'
          ],
          borderColor: [
            'hsla(210, 70%, 50%, 1)',
            'hsla(150, 70%, 50%, 1)'
          ],
          borderWidth: 1
        }]
      };
    }

    // Special handling for two-column data
    if (keys.length === 2) {
      // First, identify which column is numeric and which is categorical/date
      const numericColumn = keys.find(key => {
        const value = firstRow[key];
        return typeof value === 'number' || (!isNaN(parseFloat(value)) && value !== null && value !== '');
      });
      const categoryColumn = keys.find(key => key !== numericColumn);

      // Always ensure numeric values go on y-axis
      const yAxisColumn = numericColumn;
      const xAxisColumn = categoryColumn;

      // Format labels (x-axis)
      const labels = data.map(row => {
        const value = row[xAxisColumn];
        // Handle month numbers
        if (!isNaN(value) && value >= 1 && value <= 12) {
          return new Date(2024, value - 1).toLocaleString('default', { month: 'long' });
        }
        return value?.toString() || '';
      });

      return {
        labels,
        datasets: [{
          label: yAxisColumn.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
          data: data.map(row => parseFloat(row[yAxisColumn])),
          backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`,
          borderColor: `hsla(${Math.random() * 360}, 70%, 50%, 1)`,
          borderWidth: 1,
          yAxisID: 'y'
        }]
      };
    }

    // Find numeric columns
    const numericColumns = keys.filter(key => {
      const value = firstRow[key];
      return typeof value === 'number' || (!isNaN(parseFloat(value)) && value !== null && value !== '');
    });

    // Find potential date/time columns
    const dateColumns = keys.filter(key => {
      const value = String(firstRow[key]).toLowerCase();
      return (
        value.match(/^\d{4}-\d{2}-\d{2}/) || // ISO date
        value.match(/^\d{2}\/\d{2}\/\d{4}/) || // DD/MM/YYYY
        value.match(/^\d{4}\/\d{2}\/\d{2}/) || // YYYY/MM/DD
        /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/.test(value) || // Month names
        key.toLowerCase().includes('date') ||
        key.toLowerCase().includes('time') ||
        key.toLowerCase().includes('month') ||
        key.toLowerCase().includes('year')
      );
    });

    // Find categorical columns (non-numeric, non-date)
    const categoricalColumns = keys.filter(key => 
      !numericColumns.includes(key) && !dateColumns.includes(key)
    );

    // Case 1: Single row with multiple numeric values
    if (data.length === 1 && numericColumns.length > 0) {
      return {
        labels: numericColumns.map(col => col.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()),
        datasets: [{
          label: 'Values',
          data: numericColumns.map(col => parseFloat(firstRow[col])),
          backgroundColor: numericColumns.map(() => `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`),
          borderColor: numericColumns.map(() => `hsla(${Math.random() * 360}, 70%, 50%, 1)`),
          borderWidth: 1,
        }]
      };
    }

    // Case 2: Time series data
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      const dateColumn = dateColumns[0];
      return {
        labels: data.map(row => row[dateColumn]),
        datasets: numericColumns.map(column => ({
          label: column.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
          data: data.map(row => parseFloat(row[column])),
          backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`,
          borderColor: `hsla(${Math.random() * 360}, 70%, 50%, 1)`,
          borderWidth: 1,
        }))
      };
    }

    // Case 3: Categorical data with numeric values
    if (categoricalColumns.length > 0 && numericColumns.length > 0) {
      const categoryColumn = categoricalColumns[0];
      return {
        labels: data.map(row => row[categoryColumn]),
        datasets: numericColumns.map(column => ({
          label: column.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
          data: data.map(row => parseFloat(row[column])),
          backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`,
          borderColor: `hsla(${Math.random() * 360}, 70%, 50%, 1)`,
          borderWidth: 1,
        }))
      };
    }

    // Case 4: Only numeric columns
    if (numericColumns.length > 0) {
      return {
        labels: data.map((_, index) => `Row ${index + 1}`),
        datasets: numericColumns.map(column => ({
          label: column.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
          data: data.map(row => parseFloat(row[column])),
          backgroundColor: `hsla(${Math.random() * 360}, 70%, 50%, 0.6)`,
          borderColor: `hsla(${Math.random() * 360}, 70%, 50%, 1)`,
          borderWidth: 1,
        }))
      };
    }

    return null;
  }, [data]);

  // Automatically determine the best chart type
  useEffect(() => {
    if (!chartData) return;

    if (data.length === 1 && Object.keys(data[0]).length === 2) {
      setChartType('doughnut'); // Force doughnut chart for single record with two columns
    } else if (chartData.datasets[0].data.length === 1) {
      setChartType('doughnut');
    } else if (chartData.datasets.length === 1 && chartData.labels.length <= 5) {
      setChartType('doughnut');
    } else if (data.length > 10 || chartData.datasets.length > 3) {
      setChartType('line');
    } else {
      setChartType('bar');
    }
  }, [chartData, data]);

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
        display: chartData.datasets.length > 1 || chartType === 'doughnut',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: chartType !== 'doughnut' ? {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: data && data[0] ? 
            (Object.keys(data[0]).find(key => {
              const value = data[0][key];
              return typeof value === 'number' || (!isNaN(parseFloat(value)) && value !== null);
            }) || '').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
            : 'Value',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          callback: (value) => {
            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
            if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
            return value;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: data && data[0] ? 
            (Object.keys(data[0]).find(key => {
              const value = data[0][key];
              return typeof value !== 'number' && isNaN(parseFloat(value));
            }) || '').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()
            : 'Category',
          font: {
            weight: 'bold'
          }
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      }
    } : undefined,
    indexAxis: swappedAxes ? 'y' : 'x', // This will swap the axes when true
  };

  return (
    <div className={`flex flex-col ${className}`}>
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
            {/* Add axis swap button */}
            {chartType !== 'doughnut' && (
              <button
                onClick={() => setSwappedAxes(!swappedAxes)}
                className={`px-3 py-1 rounded ${swappedAxes ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                title="Swap X/Y axes"
              >
                Swap Axes
              </button>
            )}
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
