// pages/connections/[id]/query.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import QueryForm from '../../../components/query/QueryForm';
import SqlDisplay from '../../../components/query/SqlDisplay';
import ResultTable from '../../../components/query/ResultTable';
import TableSelector from '../../../components/tables/TableSelector';
import Button from '../../../components/common/Button';
import Alert from '../../../components/common/Alert';
import { connectionAPI, queryAPI } from '../../../lib/api';
import { withAuth } from '../../../lib/auth';

const QueryPage = () => {
  const router = useRouter();
  const { id } = router.query;
  
  const [connection, setConnection] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTables, setSelectedTables] = useState([]);
  const [recentQueries, setRecentQueries] = useState([]);
  const [hasStoredSchema, setHasStoredSchema] = useState(false);
  const [showSchemaSelector, setShowSchemaSelector] = useState(false);
  const [isTableSelectorLoading, setIsTableSelectorLoading] = useState(false);
  const [isSchemaStoring, setIsSchemaStoring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [isSavingQuery, setIsSavingQuery] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Get connection and check if schema exists
  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get connection details from session storage
        const connectionsStr = sessionStorage.getItem('connections');
        if (connectionsStr) {
          const connections = JSON.parse(connectionsStr);
          const found = connections.find(c => c.id.toString() === id);
          if (found) {
            setConnection(found);
          }
        }
        
        // Get recent queries
        try {
          const historyResponse = await queryAPI.getHistory();
          if (historyResponse.status === 'success') {
            // Filter for queries related to this connection and extract the natural language queries
            const connectionQueries = historyResponse.history
              .filter(q => q.connection_id.toString() === id)
              .map(q => q.natural_language_query);
            
            // Remove duplicates and take the 5 most recent
            const uniqueQueries = [...new Set(connectionQueries)].slice(0, 5);
            setRecentQueries(uniqueQueries);
          }
        } catch (err) {
          // Not critical, we can still continue without recent queries
          console.error("Failed to fetch query history:", err);
        }
        
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while loading the query page');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  // Load any query result from URL (for redirects from history page)
  useEffect(() => {
    if (router.query.result) {
      try {
        const result = JSON.parse(router.query.result);
        setQueryResult(result);
        
        // Remove the result from the URL to avoid reloading on refresh
        const { pathname } = router;
        router.replace(pathname, undefined, { shallow: true });
      } catch (err) {
        console.error("Failed to parse query result from URL:", err);
      }
    }
  }, [router.query.result, router]);
  
  const handleShowSchemaSelector = () => {
    // Instead of showing inline selector, redirect to tables page
    router.push(`/connections/${id}/tables`);
  };
  
  const handleTableSelection = (tables) => {
    setSelectedTables(tables);
  };
  
  const handleStoreSchema = async () => {
    if (selectedTables.length === 0) {
      setError('Please select at least one table');
      return;
    }
    
    try {
      setIsSchemaStoring(true);
      setError(null);
      
      const response = await connectionAPI.storeSchema(id, selectedTables);
      
      if (response.status === 'success') {
        setHasStoredSchema(true);
        setShowSchemaSelector(false);
      } else {
        setError(response.message || 'Failed to store schema');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while storing schema');
    } finally {
      setIsSchemaStoring(false);
    }
  };
  
  const handleQueryExecution = async (query, pairs = []) => {
    try {
      setError(null);
      
      // Add a console log to help with debugging
      console.log('Executing query:', query);
      
      // Skip execution if we already have a result with the same query
      if (queryResult && queryResult.natural_language_query === query) {
        console.log('Skipping duplicate query execution');
        return queryResult;
      }
      
      const response = await queryAPI.executeQuery(id, query, pairs);
      
      if (response.status === 'success') {
        setQueryResult(response);
        
        // Add to recent queries if not already present
        if (!recentQueries.includes(query)) {
          setRecentQueries([query, ...recentQueries.slice(0, 5)]);
        }
        
        return response;
      } else {
        setError(response.message || 'Query execution failed');
        return { status: 'error', message: response.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred while executing the query';
      setError(errorMessage);
      return { status: 'error', message: errorMessage };
    }
  };

  const handleSaveQuery = async () => {
    if (!queryResult) return;
    
    try {
      setIsSavingQuery(true);
      setError(null);
      
      const response = await queryAPI.saveQueryExample({
        connection_id: id,
        natural_language_query: queryResult.natural_language_query,
        sql_query: queryResult.sql_query
      });
      
      if (response.status === 'success') {
        setSaveSuccess(true);
        // Reset success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(response.message || 'Failed to save query example');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while saving the query');
    } finally {
      setIsSavingQuery(false);
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
        <title>
          {connection ? `${connection.name} - ` : ''}Query Database - NLP SQL Bot
        </title>
      </Head>
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900">
                {connection ? connection.name : 'Database'} - Natural Language Query
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Link href={`/connections/${id}`}>
                <Button variant="outline">
                  Back to Connection
                </Button>
              </Link>
              
              {hasStoredSchema && !showSchemaSelector && (
                <Button
                  variant="outline"
                  onClick={handleShowSchemaSelector}
                >
                  Change Tables
                </Button>
              )}
            </div>
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
          
         
          {/* Query Form */}
          { (
            <div className="mt-6">
              <QueryForm
                connectionId={id}
                onQueryResult={handleQueryExecution}
                recentQueries={recentQueries}
              />
            </div>
          )}
          
          {/* SQL Display and Results */}
          {queryResult && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Query Results</h2>
                <div className="flex items-center space-x-2">
                  {saveSuccess && (
                    <span className="text-green-600 text-sm">
                      Query saved successfully!
                    </span>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleSaveQuery}
                    disabled={isSavingQuery}
                  >
                    {isSavingQuery ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Add to Query Examples
                      </span>
                    )}
                  </Button>
                </div>
              </div>
              <SqlDisplay sql={queryResult.sql_query} />
              <ResultTable
                data={queryResult.result}
                rowCount={queryResult.row_count}
              />
            </div>
          )}
          
        
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(QueryPage);
