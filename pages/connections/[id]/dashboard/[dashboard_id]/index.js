import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../../components/layout/Layout';
import Button from '../../../../../components/common/Button';
import Alert from '../../../../../components/common/Alert';
import { dashboardAPI } from '../../../../../lib/api';
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

const DashboardView = () => {
  const router = useRouter();
  const { id: connectionId, dashboard_id: dashboardId } = router.query;
  
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!connectionId || !dashboardId) return;

    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardAPI.getDashboard(dashboardId);
        setDashboard(response.dashboard);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [connectionId, dashboardId]);

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
            {dashboard?.widgets?.map((widget, index) => (
              <div 
                key={index}
                className="bg-white shadow rounded-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {widget.title || `Widget ${index + 1}`}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {widget.natural_language_query}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md mb-4">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {widget.query}
                    </pre>
                  </div>

                  {renderChart(widget.result)}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {(!dashboard?.widgets || dashboard.widgets.length === 0) && (
            <div className="text-center bg-white shadow sm:rounded-lg p-6">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No widgets</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding some widgets to your dashboard.
              </p>
              <div className="mt-6">
                <Link href={`/connections/${connectionId}/dashboard/${dashboardId}/edit`}>
                  <Button variant="primary">Add Widgets</Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DashboardView;
