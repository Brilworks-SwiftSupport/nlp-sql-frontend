import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../../components/layout/Layout';
import Button from '../../../../../components/common/Button';
import Alert from '../../../../../components/common/Alert';
import { dashboardAPI } from '../../../../../lib/api';

const DashboardView = () => {
  const router = useRouter();
  const { id: connectionId, dashboard_id: dashboardId } = router.query;
  
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return; // wait for router to be ready
  
    if (!connectionId || !dashboardId) return;
  
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardAPI.getDashboard(dashboardId);
        console.log('Full dashboard response:', response);
        setDashboard(response.dashboard.dashboard);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchDashboard();
  }, [router.isReady, connectionId, dashboardId]);
  

  // Function to render a metric display for single value data
  const renderMetricDisplay = (widget) => {
    const chartData = widget.visualization_settings?.chartData?.data || [];
    
    if (chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-md">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    // For single value widgets (like count queries)
    if (chartData.length === 1) {
      const key = Object.keys(chartData[0])[0];
      const value = chartData[0][key];
      
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm text-gray-500">{key}</p>
          <p className="text-4xl font-bold text-blue-600">{value}</p>
        </div>
      );
    }

    // For multiple data points, display as a simple table
    return (
      <div className="overflow-auto h-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Object.keys(chartData[0]).map((key) => (
                <th 
                  key={key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {chartData.map((row, index) => (
              <tr key={index}>
                {Object.entries(row).map(([key, value]) => (
                  <td 
                    key={key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Custom simple bar chart using HTML/CSS
  const SimpleBarChart = ({ data }) => {
    if (!data || data.length === 0) return null;
    
    const key = Object.keys(data[0])[0];
    const value = data[0][key];
    const maxValue = 300; // Set a reasonable max for the bar scale
    const percentage = (value / maxValue) * 100;
    
    return (
      <div className="pt-4">
        <div className="mb-1 text-sm font-medium text-gray-700">{key}: {value}</div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-blue-600 h-4 rounded-full" 
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{dashboard?.name || 'Dashboard'} - NLP SQL Bot</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900">
                {dashboard?.name}
              </h1>
              {dashboard?.description && (
                <p className="mt-1 text-sm text-gray-500">
                  {dashboard.description}
                </p>
              )}
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Link href={`/connections/${connectionId}/dashboard`}>
                <Button variant="outline">Back to Dashboards</Button>
              </Link>
              <Link href={`/connections/${connectionId}/dashboard/${dashboardId}/edit`}>
                <Button variant="primary">Edit Dashboard</Button>
              </Link>
            </div>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              className="mb-6"
            />
          )}

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboard?.widgets?.map((widget) => {
              const chartData = widget.visualization_settings?.chartData?.data || [];
              const chartType = widget.visualization_settings?.chartType || 'bar';
              
              return (
                <div 
                  key={widget.id}
                  className="bg-white shadow rounded-lg overflow-hidden"
                >
                  <div className="p-6">
                    {/* <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {widget.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {widget.natural_language_query}
                      </p>
                    </div> */}

                
                    <div className="h-64 flex flex-col">
                      {/* For metric-style display */}
                      {renderMetricDisplay(widget)}
                      
                      {/* For simple bar chart display */}
                      {chartType === 'bar' && chartData.length === 1 && (
                        <SimpleBarChart data={chartData} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(!dashboard?.widgets || dashboard.widgets.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500">No widgets added to this dashboard yet.</p>
              <Link href={`/connections/${connectionId}/dashboard/${dashboardId}/edit`}>
                <Button variant="primary" className="mt-4">Add Widget</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardView;