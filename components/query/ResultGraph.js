import React, { useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ResultGraph = ({
  data = [],
  title = 'Query Results',
  className = '',
  maxHeight = 400,
  emptyMessage = 'No results found.',
}) => {
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'line'
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');

  // Get column headers from first row if data exists
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Filter numeric columns for Y-axis
  const numericColumns = useMemo(() => {
    if (data.length === 0) return [];
    return columns.filter(col => 
      typeof data[0][col] === 'number' || 
      !isNaN(parseFloat(data[0][col]))
    );
  }, [data, columns]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!xAxis || !yAxis || data.length === 0) return null;

    const labels = data.map(row => row[xAxis]);
    const values = data.map(row => parseFloat(row[yAxis]));

    return {
      labels,
      datasets: [
        {
          label: yAxis,
          data: values,
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgb(53, 162, 235)',
          borderWidth: 1,
        },
      ],
    };
  }, [data, xAxis, yAxis]);

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
    scales: {
      y: {
        beginAtZero: true,
      },
    },
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
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex items-center space-x-4">
            <select
              className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">X-Axis</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
            >
              <option value="">Select X-Axis</option>
              {columns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Y-Axis</label>
            <select
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
            >
              <option value="">Select Y-Axis</option>
              {numericColumns.map(col => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ height: maxHeight }}>
          {chartData && (
            chartType === 'bar' ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <Line data={chartData} options={chartOptions} />
            )
          )}
          {!chartData && (
            <div className="h-full flex items-center justify-center text-gray-500">
              Please select both X and Y axes to display the chart
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultGraph;