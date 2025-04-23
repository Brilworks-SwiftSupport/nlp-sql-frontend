// pages/connections/[id]/index.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/common/Button';
import Alert from '../../../components/common/Alert';
import Card from '../../../components/common/Card';
import { connectionAPI } from '../../../lib/api';
import { withAuth } from '../../../lib/auth';
import { formatDate } from '../../../lib/helpers';

const ConnectionDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!id) return;
    
    // Try to get connection from session storage first
    const connectionsStr = sessionStorage.getItem('connections');
    if (connectionsStr) {
      const connections = JSON.parse(connectionsStr);
      const found = connections.find(c => c.id.toString() === id);
      if (found) {
        setConnection(found);
        setIsLoading(false);
        return;
      }
    }
    
    // Fetch connection details
    const fetchConnection = async () => {
      try {
        setIsLoading(true);
        
        const response = await connectionAPI.getConnection(id);
        
        if (response.status === 'success') {
          setConnection(response.connection);
        } else {
          setError(response.message || 'Failed to fetch connection details');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching connection details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConnection();
  }, [id]);
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this connection? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      const response = await connectionAPI.deleteConnection(id);
      
      if (response.status === 'success') {
        router.push('/connections');
      } else {
        setError(response.message || 'Failed to delete connection');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while deleting the connection');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleTestConnection = async () => {
    try {
      setIsTesting(true);
      setTestResult(null);
      
      const response = await connectionAPI.test(id);
      
      setTestResult({
        success: response.status === 'success',
        message: response.message
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Failed to test connection'
      });
    } finally {
      setIsTesting(false);
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
  
  if (error || !connection) {
    return (
      <Layout>
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">Connection Details</h1>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <Alert
              type="error"
              message={error || 'Connection not found'}
              className="mt-4"
            />
            
            <div className="mt-4">
              <Link href="/connections">
                <Button variant="outline">
                  Back to connections
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Head>
        <title>{connection.name} - NLP SQL Bot</title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900">{connection.name}</h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                isLoading={isTesting}
                loadingText="Testing..."
              >
                Test Connection
              </Button>
              
              <Link href={`/connections/${id}/tables`}>
                <Button variant="outline">
                  Manage Tables
                </Button>
              </Link>
              
              <Link href={`/connections/${id}/query`}>
                <Button variant="primary">
                  Query
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {testResult && (
            <Alert
              type={testResult.success ? 'success' : 'error'}
              message={testResult.message}
              className="mt-4"
              autoClose={true}
              autoCloseTime={5000}
            />
          )}
          
          <div className="py-4">
            <Card
              title="Connection Information"
              subtitle="Details about the database connection."
              className="mt-4"
            >
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Connection name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connection.name}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Database type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {connection.db_type === 'mysql' ? 'MySQL' : 
                       connection.db_type === 'postgresql' ? 'PostgreSQL' : 
                       connection.db_type === 'sqlserver' ? 'SQL Server' : 
                       connection.db_type}
                    </dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Host</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connection.host}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Port</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connection.port}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connection.username}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Database</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connection.database}</dd>
                  </div>
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Schema</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connection.db_schema || '—'}</dd>
                  </div>

                  {/* SSH Connection Details - Only show for MySQL with SSH enabled */}
                  {connection.db_type === 'mysql' && connection.ssh_enabled && (
                    <>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">SSH Connection</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                            Enabled
                          </span>
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">SSH Host</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connection.ssh_host}</dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">SSH Port</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connection.ssh_port}</dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">SSH Username</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{connection.ssh_username}</dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">SSH Authentication</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {connection.ssh_auth_method === 'password' ? 'Password' : 'Private Key'}
                        </dd>
                      </div>
                    </>
                  )}

                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Created at</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatDate(connection.created_at)}
                    </dd>
                  </div>
                </dl>
              </div>
            </Card>
            
            <div className="mt-6">
              <Button
                variant="danger"
                onClick={handleDelete}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete Connection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(ConnectionDetailPage);
