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

// Register ChartJS components once
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
  onChartPreferencesChange = null,
  initialChartType = null,
  initialXAxisField = null,
  initialYAxisField = null,
  initialColors = null,
  disableAutoDetection = false,
  hideControls = false // New prop to hide controls
}) => {
  const chartRef = useRef(null);
  // Use initialChartType if provided, otherwise default to 'bar'
  const [chartType, setChartType] = useState(initialChartType || 'bar');
  const [activeTab, setActiveTab] = useState('graph');
  const [copiedSQL, setCopiedSQL] = useState(false);
  // Use initialXAxisField and initialYAxisField if provided
  const [xAxisField, setXAxisField] = useState(initialXAxisField || '');
  const [yAxisField, setYAxisField] = useState(initialYAxisField || '');
  // Store colors for datasets
  const [datasetColors, setDatasetColors] = useState(initialColors || {});
  // If initial values are provided, consider it as user-selected
  const [userSelectedChartType, setUserSelectedChartType] = useState(!!initialChartType);
  const [isChartReady, setIsChartReady] = useState(false);

  // Generate random colors if not provided
  const generateRandomColor = (index) => {
    if (datasetColors[index]) return datasetColors[index];
    
    const hue = (index * 137.5) % 360; // Use golden angle approximation for better distribution
    const newColor = {
      backgroundColor: `hsla(${hue}, 70%, 50%, 0.6)`,
      borderColor: `hsla(${hue}, 70%, 50%, 1)`
    };
    
    // Store the generated color
    setDatasetColors(prev => ({
      ...prev,
      [index]: newColor
    }));
    
    return newColor;
  };

  // Optimize field selection by using useMemo
  const availableFields = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Set initial fields only when data changes and no initial fields were provided
  useEffect(() => {
    if (!data || data.length === 0 || availableFields.length === 0) {
      setXAxisField('');
      setYAxisField('');
      return;
    }

    // Only set initial fields if they're not already set or if they're not valid anymore
    if ((!xAxisField || !yAxisField || !availableFields.includes(xAxisField) || !availableFields.includes(yAxisField)) && !disableAutoDetection) {
      // Try to find string/date fields for x-axis and numeric fields for y-axis
      const numericFields = availableFields.filter(field => 
        !isNaN(parseFloat(data[0][field])) && field !== 'id'
      );
      
      const nonNumericFields = availableFields.filter(field => 
        isNaN(parseFloat(data[0][field])) || field === 'id'
      );
      
      // Set default fields
      if (nonNumericFields.length > 0 && numericFields.length > 0) {
        setXAxisField(nonNumericFields[0]);
        setYAxisField(numericFields[0]);
      } else if (availableFields.length >= 2) {
        setXAxisField(availableFields[0]);
        setYAxisField(availableFields[1]);
      } else if (availableFields.length === 1) {
        setXAxisField(availableFields[0]);
        setYAxisField(availableFields[0]);
      }
    }
  }, [data, availableFields, xAxisField, yAxisField, disableAutoDetection]);

  // Initialize with provided values when component mounts
  useEffect(() => {
    if (initialChartType) {
      setChartType(initialChartType);
      setUserSelectedChartType(true);
    }
    
    if (initialXAxisField && availableFields.includes(initialXAxisField)) {
      setXAxisField(initialXAxisField);
    }
    
    if (initialYAxisField && availableFields.includes(initialYAxisField)) {
      setYAxisField(initialYAxisField);
    }
    
    if (initialColors) {
      setDatasetColors(initialColors);
    }
  }, [initialChartType, initialXAxisField, initialYAxisField, initialColors, availableFields]);

  // Optimize chart data generation with useMemo
  const chartData = useMemo(() => {
    if (!data || data.length === 0 || !xAxisField || !yAxisField) return null;
    setIsChartReady(false);

    try {
      const firstRow = data[0];
      const keys = Object.keys(firstRow);

      // Special handling for single record with two columns
      if (keys.length === 2 && data.length === 1) {
        const labels = keys.map(key => key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim());
        const values = keys.map(key => parseFloat(firstRow[key]) || 0);
        
        // Use provided colors or generate new ones
        const colors = keys.map((_, index) => {
          const color = datasetColors[index] || generateRandomColor(index);
          return color;
        });
        
        return {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors.map(c => c.backgroundColor),
            borderColor: colors.map(c => c.borderColor),
            borderWidth: 1
          }]
        };
      }

      // Format labels (x-axis)
      const labels = data.map(row => {
        const value = row[xAxisField];
        // Handle month numbers
        if (!isNaN(value) && value >= 1 && value <= 12) {
          return new Date(2024, value - 1).toLocaleString('default', { month: 'long' });
        }
        return value?.toString() || '';
      });

      // Limit the number of data points to prevent performance issues
      const maxDataPoints = 100;
      const dataToUse = data.length > maxDataPoints ? data.slice(0, maxDataPoints) : data;

      // Use provided colors or generate new ones
      const color = datasetColors[0] || generateRandomColor(0);

      return {
        labels: labels.slice(0, maxDataPoints),
        datasets: [{
          label: yAxisField.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
          data: dataToUse.map(row => parseFloat(row[yAxisField]) || 0),
          backgroundColor: color.backgroundColor,
          borderColor: color.borderColor,
          borderWidth: 1,
          yAxisID: 'y'
        }]
      };
    } catch (error) {
      console.error('Error generating chart data:', error);
      return null;
    } finally {
      setIsChartReady(true);
    }
  }, [data, xAxisField, yAxisField, datasetColors]);

  // Automatically determine the best chart type
  useEffect(() => {
    if (!chartData || userSelectedChartType || disableAutoDetection) return; // Skip if user has selected a type or auto-detection is disabled

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
  }, [chartData, data, userSelectedChartType, disableAutoDetection]);

  // Reset userSelectedChartType when data changes completely
  useEffect(() => {
    if (!data || data.length === 0) {
      setUserSelectedChartType(false);
    }
  }, [data]);

  // Debounce chart preferences update to prevent excessive re-renders
  useEffect(() => {
    if (!onChartPreferencesChange || !chartType || !xAxisField || !yAxisField || !isChartReady) return;
    
    const timer = setTimeout(() => {
      onChartPreferencesChange({
        chartType,
        xAxisField,
        yAxisField,
        colors: datasetColors,
        showLegend: chartData?.datasets?.length > 1 || chartType === 'doughnut'
      });
    }, 300);
    
    return () => clearTimeout(timer);
  }, [chartType, xAxisField, yAxisField, chartData, datasetColors, onChartPreferencesChange, isChartReady]);

  // Function to change a dataset's color
  const changeDatasetColor = (index, newColor) => {
    setDatasetColors(prev => ({
      ...prev,
      [index]: {
        backgroundColor: `hsla(${newColor}, 70%, 50%, 0.6)`,
        borderColor: `hsla(${newColor}, 70%, 50%, 1)`
      }
    }));
  };

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

  const renderChart = () => {
    const options = {
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
            text: yAxisField.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
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
            text: xAxisField.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
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
    };

    return (
      <div ref={chartRef} style={{ height: '100%' }}>
        {chartType === 'bar' && <Bar data={chartData} options={options} />}
        {chartType === 'line' && <Line data={chartData} options={options} />}
        {chartType === 'doughnut' && <Doughnut data={chartData} options={options} />}
      </div>
    );
  };

  const handleChartTypeChange = (type) => {
    setChartType(type);
    setUserSelectedChartType(true); // User has manually selected a chart type
  };

  // Color picker component
  const ColorPicker = ({ index }) => {
    const colors = [0, 60, 120, 180, 240, 300]; // Hue values for different colors
    
    return (
      <div className="flex space-x-1 items-center">
        <span className="text-xs text-gray-500">Color:</span>
        <div className="flex space-x-1">
          {colors.map(hue => (
            <button
              key={hue}
              onClick={() => changeDatasetColor(index, hue)}
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: `hsl(${hue}, 70%, 50%)` }}
              title={`Change to hue ${hue}`}
            />
          ))}
        </div>
      </div>
    );
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

      {/* Only show controls if hideControls is false */}
      {activeTab === 'graph' && !hideControls && (
        <div className="flex flex-wrap justify-end space-x-2 mb-4">
          <div className="flex space-x-2 items-center">
            <button
              onClick={() => handleChartTypeChange('bar')}
              className={`px-3 py-1 rounded ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Bar
            </button>
            <button
              onClick={() => handleChartTypeChange('line')}
              className={`px-3 py-1 rounded ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Line
            </button>
            <button
              onClick={() => handleChartTypeChange('doughnut')}
              className={`px-3 py-1 rounded ${chartType === 'doughnut' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Doughnut
            </button>
          </div>
          
          {/* Color picker */}
          <ColorPicker index={0} />
          
          {/* Axis selection dropdowns */}
          {chartType !== 'doughnut' && (
            <div className="flex space-x-2">
              <div className="flex flex-col">
                <select
                  value={xAxisField}
                  onChange={(e) => setXAxisField(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    maxWidth: '100px',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                  title={xAxisField} // Show full field name on hover
                >
                  <option value="" disabled>Select X-Axis</option>
                  {availableFields.map(field => (
                    <option 
                      key={`x-${field}`} 
                      value={field}
                      title={field} // Show full field name on hover
                    >
                      {field}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col">
                <select
                  value={yAxisField}
                  onChange={(e) => setYAxisField(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  style={{
                    maxWidth: '100px',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden'
                  }}
                  title={yAxisField} // Show full field name on hover
                >
                  <option value="" disabled>Select Y-Axis</option>
                  {availableFields.map(field => (
                    <option 
                      key={`y-${field}`} 
                      value={field}
                      title={field} // Show full field name on hover
                    >
                      {field}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <button
            onClick={downloadImage}
            className="px-3 py-1 rounded bg-green-600 text-white"
          >
            Download PNG
          </button>
        </div>
      )}
      
      {/* Always show download buttons for data view */}
      {activeTab !== 'sql' && !hideControls && (
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadCSV}
            className="px-3 py-1 rounded bg-green-600 text-white"
          >
            Download CSV
          </button>
        </div>
      )}
      
      <div style={{ height: maxHeight }}>
        {activeTab === 'graph' ? (
          renderChart()
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
