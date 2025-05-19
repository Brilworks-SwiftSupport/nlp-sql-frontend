import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../components/layout/Layout';
import Button from '../../../../components/common/Button';
import Alert from '../../../../components/common/Alert';
import { dashboardAPI } from '../../../../lib/api';

const NewDashboardPage = () => {
  const router = useRouter();
  const { id: connectionId } = router.query;
  const [dashboardInfo, setDashboardInfo] = useState({
    name: '',
    description: '',
    is_public: false
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  

  const handleCreateDashboard = async () => {
    if (!dashboardInfo.name) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await dashboardAPI.create({
        connection_id: connectionId,
        name: dashboardInfo.name,
        description: dashboardInfo.description,
        is_public: dashboardInfo.is_public,
        layout: {}
      });
      if (response && response.dashboard.id) {
        router.push(`/connections/${connectionId}/dashboard/${response.dashboard.id}`);
      } else {
        setError('Failed to create dashboard.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Create Dashboard - NLP SQL Bot</title>
      </Head>
      <div className="py-6">
        <div className="max-w-xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Create New Dashboard</h1>
          {error && (
            <Alert type="error" message={error} className="mb-4" />
          )}
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
                  disabled={!dashboardInfo.name || isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Dashboard'}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Link href={`/connections/${connectionId}/dashboard`}>
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewDashboardPage;
