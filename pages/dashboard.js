// pages/dashboard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import { connectionAPI, queryAPI } from '../lib/api';
import { isConnectionReady, getConnectionCompletionSuggestion } from '../lib/connectionUtils';

export default function Dashboard() {
  const router = useRouter();
  const [connections, setConnections] = useState([]);
  const [recentQueries, setRecentQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Fetch data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch connections
        const connectionsResponse = await connectionAPI.getAll();
        if (connectionsResponse.status === 'success') {
          setConnections(connectionsResponse.connections);
          
          // Store connections in session storage for easy access
          sessionStorage.setItem('connections', JSON.stringify(connectionsResponse.connections));
        }
        
        // Fetch recent queries
        const queriesResponse = await queryAPI.getHistory();
        if (queriesResponse.status === 'success') {
          setRecentQueries(queriesResponse.queries.slice(0, 5)); // Get only the 5 most recent
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [router]);
  
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
        <title>Dashboard - NLP SQL Bot</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Database Connections Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Database Connections</h2>
              <Link
                href="/connections/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Connection
              </Link>
            </div>
            
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="bg-white overflow-hidden shadow rounded-lg"
                >
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {connection.name}
                          </dt>
                          <dd>
                            <div className="text-lg font-medium text-gray-900">
                              {connection.db_type}
                            </div>
                          </dd>
                          {!isConnectionReady(connection) && (
                            <div className="mt-2 flex items-center text-sm text-yellow-600">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Setup incomplete
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="text-sm flex justify-between">
                      <Link
                        href={`/connections/${connection.id}`}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        View details
                      </Link>
                      
                      {!isConnectionReady(connection) && (
                        <button
                          onClick={() => router.push(`/connections/${connection.id}/edit`)}
                          className="font-medium text-orange-600 hover:text-orange-500"
                        >
                          Complete setup
                        </button>
                      )}
                    </div>
                    
                    {!isConnectionReady(connection) && (
                      <p className="mt-2 text-xs text-gray-500">
                        {getConnectionCompletionSuggestion(connection)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {connections.length === 0 && (
                <div className="col-span-full bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6 text-center">
                    <p className="text-gray-500">No database connections found.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add a connection to get started with querying your databases.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Queries Section */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Recent Queries</h2>
            
            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {recentQueries.map((query) => (
                  <li key={query.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {query.natural_language_query}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            query.successful
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {query.successful ? 'Success' : 'Failed'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Connection: {query.connection_id}
                          </p>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <p>
                            {new Date(query.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <pre className="mt-1 text-sm text-gray-600 overflow-x-auto bg-gray-50 p-2 rounded">
                          {query.sql_query}
                        </pre>
                      </div>
                    </div>
                  </li>
                ))}
                
                {recentQueries.length === 0 && (
                  <li>
                    <div className="px-4 py-5 sm:px-6 text-center">
                      <p className="text-gray-500">No recent queries found.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Start querying your databases to see your query history.
                      </p>
                    </div>
                  </li>
                )}
              </ul>
              
              {recentQueries.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                  <Link
                    href="/queries/history"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View all queries
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}