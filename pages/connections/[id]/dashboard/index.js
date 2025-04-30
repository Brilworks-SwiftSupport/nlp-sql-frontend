import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../components/layout/Layout';
import Button from '../../../../components/common/Button';

import { dashboardAPI, connectionAPI } from '../../../../lib/api';

const ConnectionDashboard = () => {
  const router = useRouter();
  const { id } = router.query;
  const [connection, setConnection] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch connection details
        const connectionResponse = await connectionAPI.getConnection(id);
        if (connectionResponse.status === 'success') {
          setConnection(connectionResponse.connection);
        }
       
        // Fetch dashboards for this specific collection
        const dashboardsResponse = await dashboardAPI.getDashboardsByCollection(id);
        if (dashboardsResponse.status === 'success') {
          setDashboards(dashboardsResponse.dashboards || []);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);



  return (
    <Layout>
      <Head>
        <title>
          {connection ? `${connection.name}` : ''}
        </title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900">
                {connection ? `${connection.name}` : ''}
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Link href={`/connections/${id}`}>
                <Button variant="outline">Back to Connection</Button>
              </Link>
              <Link href={`/connections/${id}/dashboard/new`}>
                <Button variant="primary" className="inline-flex items-center">
                  <svg 
                    className="-ml-1 mr-2 h-5 w-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  New Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white shadow rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-40 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : dashboards.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {dashboards.map((dashboard) => (
               <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200">
               <div className="p-6">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center space-x-2">
                     <div className="bg-blue-100 rounded-lg p-2">
                       <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                       </svg>
                     </div>
                     {dashboard.is_public && (
                       <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                         Public
                       </span>
                     )}
                   </div>
                   <div className="text-xs text-gray-500">
                     {new Date(dashboard.created_at).toLocaleDateString()}
                   </div>
                 </div>
         
                 <Link href={`/connections/${id}/dashboard/${dashboard.id}`}>
                   <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                     {dashboard.name}
                   </h3>
                 </Link>
         
                 {dashboard.description && (
                   <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                     {dashboard.description}
                   </p>
                 )}
         
                 <div className="mt-4 flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <div className="flex items-center text-sm text-gray-600">
                       <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                       </svg>
                       <span>{connection.name}</span>
                     </div>
              
                   </div>
                   
                   <Link 
                     href={`/connections/${id}/dashboard/${dashboard.id}`}
                     className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                   >
                     View Dashboard →
                   </Link>
                 </div>
               </div>
             </div>
                ))}
              </div>
              
            ) : (
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No dashboards yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first dashboard to get started.
                </p>
                <div className="mt-6">
                  <Link href={`/connections/${id}/dashboard/new`}>
                    <Button variant="primary">Create First Dashboard</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConnectionDashboard;
