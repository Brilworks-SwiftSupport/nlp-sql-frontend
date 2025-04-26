// pages/connections/[id]/dashboard/[dashboard_id]/edit.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../../components/layout/Layout';
import QueryForm from '../../../../../components/query/QueryForm';
import Button from '../../../../../components/common/Button';
import Alert from '../../../../../components/common/Alert';
import { dashboardAPI, queryAPI } from '../../../../../lib/api';
import ResultGraph from '../../../../../components/query/ResultGraph';

const DashboardEditPage = () => {
  const router = useRouter();
  const { id: connectionId, dashboard_id: dashboardId } = router.query;
  
  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryResult, setQueryResult] = useState(null);

  useEffect(() => {
    if (!connectionId || !dashboardId) return;

    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await dashboardAPI.getDashboard(dashboardId);
        if (response.status === 'success') {
          setDashboard(response.dashboard);
          setWidgets(response.dashboard.widgets || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [connectionId, dashboardId]);

  const handleQueryExecution = async (query, pairs = []) => {
    try {
      setError(null);
      setIsLoading(true);
      
      const response = await queryAPI.executeQuery(connectionId, query, pairs);
      
      if (response.status === 'success') {
        setQueryResult(response);
        return response;
      } else {
        setError(response.message || 'Query execution failed');
        return { status: 'error', message: response.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred while executing the query';
      setError(errorMessage);
      return { status: 'error', message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWidget = async (query, result, chartConfig = null) => {
    try {
      setError(null);
      
      // Calculate position for new widget
      const position = {
        x: 0,
        y: widgets.length * 2, // Simple vertical stacking
        w: 6,
        h: 2
      };

      const widgetData = {
        dashboard_id: dashboardId,
        name: `Widget ${widgets.length + 1}`,
        widget_type: chartConfig ? 'chart' : 'table',
        natural_language_query: query,
        sql_query: result.sql_query,
        visualization_settings: chartConfig,
        position: position,
        refresh_interval: 0 // Default to no auto-refresh
      };

      const response = await dashboardAPI.addWidget(widgetData);
      
      // Update local state with the new widget
      const newWidget = response.widget;
      setWidgets(prev => [...prev, newWidget]);
      
      // Show success message or handle UI updates
      // You might want to add a toast notification here
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add widget');
    }
  };

  const handleRemoveWidget = async (index) => {
    try {
      setError(null);
      const updatedWidgets = widgets.filter((_, i) => i !== index);
      setWidgets(updatedWidgets);

      await dashboardAPI.update(dashboardId, {
        ...dashboard,
        widgets: updatedWidgets
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove widget');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Edit Dashboard - {dashboard?.name || 'Loading...'}</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Edit Dashboard</h1>
            <Link href={`/connections/${connectionId}/dashboard/${dashboardId}`}>
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {error && (
            <Alert type="error" message={error} className="mb-6" />
          )}

          {/* Query Form for adding widgets */}
          <div className="mt-6">
            <QueryForm
              connectionId={connectionId}
              onQueryResult={handleQueryExecution}
              placeholder="Ask a question to create a new widget..."
            />
          </div>

          {/* Query Results */}
          {queryResult && queryResult.status === 'success' && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Query Results</h3>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => handleAddWidget(
                      queryResult.natural_language_query, 
                      queryResult,
                      null // Add as table widget
                    )}
                  >
                    Add as Table Widget
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleAddWidget(
                      queryResult.natural_language_query, 
                      queryResult,
                      {
                        type: 'chart',
                        chartType: 'bar', // or 'line', 'pie', etc.
                        // Add other visualization settings as needed
                        options: {
                          xAxis: Object.keys(queryResult.result[0])[0], // First column as X-axis
                          yAxis: Object.keys(queryResult.result[0])[1], // Second column as Y-axis
                          // Add other chart-specific settings
                        }
                      }
                    )}
                  >
                    Add as Chart Widget
                  </Button>
                </div>
              </div>

              {/* SQL Query */}
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Generated SQL</h4>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                  {queryResult.sql_query}
                </pre>
              </div>

              {/* Graph Visualization */}
              <div className="mb-6">
                <ResultGraph
                  data={queryResult.result}
                  title="Query Results Visualization"
                  className="h-[400px]"
                />
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {queryResult.result[0] && Object.keys(queryResult.result[0]).map((header, i) => (
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
                    {queryResult.result.map((row, i) => (
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
            </div>
          )}

          {/* Widgets List */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900">Dashboard Widgets</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {widgets.map((widget, index) => (
                <div
                  key={index}
                  className="relative bg-white p-4 shadow rounded-lg"
                >
                  <h4 className="text-base font-medium text-gray-900">{widget.name}</h4>
                  <p className="mt-1 text-sm text-gray-500">{widget.natural_language_query}</p>
                  
                  {/* Display either chart or table based on widget type */}
                  {widget.widget_type === 'chart' && widget.latest_graph_data ? (
                    <div className="mt-4 h-[200px]">
                      <ResultGraph
                        data={widget.latest_graph_data.data}
                        title={widget.name}
                        minimal={true}
                        chartConfig={widget.visualization_settings}
                      />
                    </div>
                  ) : widget.latest_graph_data ? (
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {widget.latest_graph_data.data[0] && 
                              Object.keys(widget.latest_graph_data.data[0]).map((header, i) => (
                                <th
                                  key={i}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {header}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {widget.latest_graph_data.data.slice(0, 3).map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).map((value, j) => (
                                <td
                                  key={j}
                                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                                >
                                  {value?.toString() || ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">No data available</p>
                    </div>
                  )}

                  <button
                    onClick={() => handleRemoveWidget(index)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Remove widget</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardEditPage;
