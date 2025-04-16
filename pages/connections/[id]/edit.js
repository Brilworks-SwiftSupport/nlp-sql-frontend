// pages/connections/[id]/edit.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../../components/layout/Layout';
import Alert from '../../../components/common/Alert';
import ConnectionManager from '../../../src/components/ConnectionManager/ConnectionManager';
import { connectionAPI } from '../../../lib/api';
import { withAuth } from '../../../lib/auth';

const EditConnectionPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [connection, setConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  useEffect(() => {
    if (!id) return;
    
    // Fetch connection details for editing
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
  
  const handleClose = (success) => {
    if (success) {
      setIsSuccess(true);
      // Redirect to connection details page after successful update
      setTimeout(() => {
        router.push(`/connections/${id}`);
      }, 1500);
    } else {
      router.push(`/connections/${id}`);
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>Edit Connection | NL SQL Bot</title>
      </Head>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Connection</h1>
        </div>
        
        {error && (
          <Alert 
            type="error" 
            message={error}
            onClose={() => setError(null)}
          />
        )}
        
        {isSuccess && (
          <Alert
            type="success"
            message="Connection updated successfully"
          />
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {connection && (
              <ConnectionManager
                onClose={handleClose}
                connectionToEdit={connection}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default withAuth(EditConnectionPage);
