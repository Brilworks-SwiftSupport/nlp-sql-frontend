// pages/connections/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import ConnectionCard from '../../components/connections/ConnectionCard';
import Alert from '../../components/common/Alert';
import Button from '../../components/common/Button';
import { connectionAPI } from '../../lib/api';
import { withAuth } from '../../lib/auth';

const ConnectionsPage = () => {
  const router = useRouter();
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Fetch connections
    const fetchConnections = async () => {
      try {
        setIsLoading(true);
        
        const response = await connectionAPI.getAll();
        
        if (response.status === 'success') {
          setConnections(response.connections);
          
          // Store connections in session storage for easy access
          sessionStorage.setItem('connections', JSON.stringify(response.connections));
        } else {
          setError(response.message || 'Failed to fetch connections');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching connections');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConnections();
  }, []);
  
  return (
    <Layout>
      <Head>
        <title>Database Connections - NLP SQL Bot</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Database Connections</h1>
            <Link href="/connections/new">
              <Button
                variant="primary"
                icon={
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                }
              >
                Add Connection
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {error && (
            <Alert
              type="error" 
              message={error}
              className="mt-4"
            />
          )}
          
          {isLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white shadow rounded-lg p-6">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-blue-400 h-12 w-12"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {connections.map((connection) => (
                <ConnectionCard key={connection.id} connection={connection} />
              ))}
              
              {connections.length === 0 && (
                <div className="col-span-full bg-white shadow rounded-lg p-6 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No connections</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new database connection.
                  </p>
                  <div className="mt-6">
                    <Link href="/connections/new">
                      <Button
                        variant="primary"
                        icon={
                          <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        }
                      >
                        New Connection
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(ConnectionsPage);