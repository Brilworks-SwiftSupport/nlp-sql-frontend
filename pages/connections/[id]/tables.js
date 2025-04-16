// pages/connections/[id]/tables.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import TableSelector from '../../../components/tables/TableSelector';
import Button from '../../../components/common/Button';
import Alert from '../../../components/common/Alert';
import { connectionAPI } from '../../../lib/api';
import { withAuth } from '../../../lib/auth';

const TablesPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [connection, setConnection] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStoring, setIsStoring] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [loadingSavedSchema, setLoadingSavedSchema] = useState(false);
  const [savedSchemaLoaded, setSavedSchemaLoaded] = useState(false);
  const [savedSchemaTables, setSavedSchemaTables] = useState([]);
  
  useEffect(() => {
    if (!id) return;
    
    // Get connection details from session storage
    const connectionsStr = sessionStorage.getItem('connections');
    if (connectionsStr) {
      const connections = JSON.parse(connectionsStr);
      const found = connections.find(c => c.id.toString() === id);
      if (found) {
        setConnection(found);
      }
    }
    
    // Use an async function to properly await both operations
    const loadAllData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await connectionAPI.getTables(id);
        
        if (response.status === 'success') {
          console.log('Tables fetched successfully:', response.tables.length, 'tables');
          setTables(response.tables);
          
          // Await the saved schema fetch to ensure tables are pre-selected
          await fetchSavedSchema();
        } else {
          setError(response.message || 'Failed to fetch tables');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching tables');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAllData();
  }, [id]);
  
  // Function to fetch saved schema
  const fetchSavedSchema = async () => {
    try {
      setLoadingSavedSchema(true);
      console.log('Fetching saved schema for connection:', id);
      
      const schemaResponse = await connectionAPI.getSavedSchema(id);
      console.log('Saved schema response:', schemaResponse);
      
      if (schemaResponse.status === 'success' && schemaResponse.tables && schemaResponse.tables.length > 0) {
        console.log('Pre-selecting tables:', schemaResponse.tables);
        // Store the saved tables
        setSavedSchemaTables(schemaResponse.tables);
        // Pre-select previously saved tables
        setSelectedTables(schemaResponse.tables);
        setSavedSchemaLoaded(true);
      } else {
        console.log('No saved tables found or empty tables array returned');
        setSavedSchemaLoaded(false);
      }
    } catch (err) {
      console.error('Error fetching saved schema:', err);
      // Don't show error to user, just silently fail
      setSavedSchemaLoaded(false);
    } finally {
      setLoadingSavedSchema(false);
    }
  };
  
  const handleTableSelection = (tables) => {
    console.log('Tables selected:', tables);
    setSelectedTables(tables);
  };
  
  const handleStoreSchema = async () => {
    try {
      setIsStoring(true);
      setError(null);
      setSuccessMessage('');
      
      console.log('Storing schema with tables:', selectedTables);
      const response = await connectionAPI.storeSchema(id, selectedTables);
      
      if (response.status === 'success') {
        setSavedSchemaTables(selectedTables);
        setSavedSchemaLoaded(true);
        setSuccessMessage('Schema stored successfully. You can now query these tables.');
        // Optionally, redirect to query page after a delay
        setTimeout(() => {
          router.push(`/connections/${id}/query`);
        }, 2000);
      } else {
        setError(response.message || 'Failed to store schema');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while storing schema');
    } finally {
      setIsStoring(false);
    }
  };
  
  return (
    <Layout>
      <Head>
        <title>
          {connection ? `${connection.name} - ` : ''}Tables - NLP SQL Bot
        </title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900">
                {connection ? connection.name : 'Connection'} - Select Tables
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Link href={`/connections/${id}`}>
                <Button variant="outline">Back to Connection</Button>
              </Link>
              <Link href={`/connections/${id}/query`}>
                <Button>Go to Query</Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
          {/* Show error message if any */}
          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} />
            </div>
          )}
          
          {/* Show success message if any */}
          {successMessage && (
            <div className="mb-6">
              <Alert type="success" message={successMessage} />
            </div>
          )}
          
          {/* Show message about previously saved tables */}
          {savedSchemaLoaded && savedSchemaTables.length > 0 && (
            <div className="mb-6">
              <Alert 
                type="info" 
                message={`Previously saved tables (${savedSchemaTables.length}) have been pre-selected. You can modify your selection and save again.`} 
              />
            </div>
          )}
          
          {/* Table selector */}
          <div className="mb-6">
            <TableSelector
              tables={tables}
              selectedTables={selectedTables}
              onSelect={handleTableSelection}
              onSubmit={handleStoreSchema}
              isLoading={isLoading || isStoring}
              maxHeight="60vh"
              title="Select Tables for Your Schema"
              subtitle="Choose the tables you want to include in your schema for natural language queries. Tables with foreign key relationships should be selected together for best results."
              submitButtonText={isStoring ? "Storing Schema..." : "Store Selected Tables Schema"}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(TablesPage);