import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../components/layout/Layout';
import QueryForm from '../../../../components/query/QueryForm';
import Button from '../../../../components/common/Button';
import Alert from '../../../../components/common/Alert';
import { queryAPI, dashboardAPI } from '../../../../lib/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const STEPS = {
  DASHBOARD_INFO: 'DASHBOARD_INFO',
  ADD_WIDGETS: 'ADD_WIDGETS',
};

const QueryDashboard = () => {
  const router = useRouter();
  const { id: connectionId } = router.query;
  
  const [currentStep, setCurrentStep] = useState(STEPS.DASHBOARD_INFO);
  const [dashboardInfo, setDashboardInfo] = useState({
    name: '',
    description: '',
    connection_id: connectionId,
    is_public: false,
    layout: {},
    id: null
  });
  const [queryResult, setQueryResult] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [error, setError] = useState(null);

  const handleCreateDashboard = async () => {
    try {
      setError(null);
      const response = await dashboardAPI.create({
        connection_id: connectionId,
        name: dashboardInfo.name,
        description: dashboardInfo.description,
        is_public: dashboardInfo.is_public,
        layout: {}  // Initial empty layout
      });

      setDashboardInfo(prev => ({
        ...prev,
        id: response.id
      }));
      
      setCurrentStep(STEPS.ADD_WIDGETS);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dashboard');
    }
  };

  const handleQueryExecution = async (query, pairs) => {
    try {
      setError(null);
      const response = await queryAPI.executeQuery(connectionId, query, pairs);
      setQueryResult(response);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred while executing the query';
      setError(errorMessage);
      return { status: 'error', message: errorMessage };
    }
  };

  const handleSaveWidget = async () => {
    if (!queryResult) return;

    try {
      const response = await dashboardAPI.addWidget({
        dashboard_id: dashboardInfo.id,
        widget_type: 'chart', // You might want to make this dynamic
        query: queryResult.sql_query,
        natural_language_query: queryResult.natural_language_query,
        result: queryResult.result,
        position: {
          x: 0,
          y: widgets.length * 2, // Simple vertical stacking
          w: 6,
          h: 2
        }
      });

      setWidgets(prev => [...prev, response.widget]);
      setQueryResult(null); // Reset for next query
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save widget');
    }
  };

  const renderChart = (data) => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const firstRow = data[0];
    const labels = Object.keys(firstRow);
    const values = Object.values(firstRow);

    // For single value results (like count queries)
    if (labels.length === 1) {
      const chartData = {
        labels: ['Total'],
        datasets: [{
          data: values,
          backgroundColor: ['rgba(54, 162, 235, 0.2)'],
          borderColor: ['rgba(54, 162, 235, 1)'],
          borderWidth: 1,
        }],
      };

      return (
        <div className="h-64">
          <Doughnut
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                title: {
                  display: true,
                  text: labels[0],
                },
              },
            }}
          />
        </div>
      );
    }

    // For multiple values
    const chartData = {
      labels,
      datasets: [{
        label: 'Results',
        data: values,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }],
    };

    return (
      <div className="h-64">
        <Bar
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
            },
          }}
        />
      </div>
    );
  };

  const renderDashboardInfo = () => (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="dashboardName" className="block text-sm font-medium text-gray-700">
            Dashboard Name
          </label>
          <input
            type="text"
            id="dashboardName"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={dashboardInfo.name}
            onChange={(e) => setDashboardInfo(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter dashboard name"
          />
        </div>
        <div>
          <label htmlFor="dashboardDescription" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="dashboardDescription"
            rows={3}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={dashboardInfo.description}
            onChange={(e) => setDashboardInfo(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Enter dashboard description"
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isPublic"
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            checked={dashboardInfo.is_public}
            onChange={(e) => setDashboardInfo(prev => ({ ...prev, is_public: e.target.checked }))}
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
            Make dashboard public
          </label>
        </div>
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleCreateDashboard}
            disabled={!dashboardInfo.name}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAddWidgets = () => (
    <div className="space-y-6">
      <QueryForm
        connectionId={connectionId}
        onQueryResult={handleQueryExecution}
        placeholder="Ask a question to create a widget (e.g., 'Show monthly revenue trends')"
      />

      {queryResult && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Query Results</h3>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap">
              {queryResult.sql_query}
            </pre>
          </div>

          {renderChart(queryResult.result)}

          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={handleSaveWidget}>
              Add to Dashboard
            </Button>
          </div>
        </div>
      )}

      {widgets.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Dashboard Widgets ({widgets.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map((widget, index) => (
              <div key={index} className="border rounded-lg p-4">
                {renderChart(widget.result)}
                <p className="mt-2 text-sm text-gray-500">{widget.natural_language_query}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Link href={`/connections/${connectionId}/dashboard`}>
          <Button variant="primary">
            Finish
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <Layout>
      <Head>
        <title>Create Dashboard - NLP SQL Bot</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900">
                Create New Dashboard
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <Link href={`/connections/${connectionId}/dashboard`}>
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              className="mt-4"
            />
          )}

          <div className="mt-6">
            {currentStep === STEPS.DASHBOARD_INFO && renderDashboardInfo()}
            {currentStep === STEPS.ADD_WIDGETS && renderAddWidgets()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QueryDashboard;
