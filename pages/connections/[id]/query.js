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
        
        // Check if schema exists for this connection by trying to get tables
        try {
          const tablesResponse = await connectionAPI.getTables(id);
          if (tablesResponse.status === 'success') {
            setTables(tablesResponse.tables);
            // Let's assume schema exists if we can get tables
            setHasStoredSchema(true);
          }
        } catch (err) {
          // If we can't get tables, we might need to store schema first
          setHasStoredSchema(false);
          setShowSchemaSelector(true);
        }
        
        // Get recent queries
        try {
          const historyResponse = await queryAPI.getHistory();
          if (historyResponse.status === 'success') {
            // Filter for queries related to this connection and extract the natural language queries
            const connectionQueries = historyResponse.queries
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
  
  const handleQueryExecution = async (query) => {
    try {
      setError(null);
      
      // Add a console log to help with debugging
      console.log('Executing query:', query);
      
      // Skip execution if we already have a result with the same query
      if (queryResult && queryResult.natural_language_query === query) {
        console.log('Skipping duplicate query execution');
        return queryResult;
      }
      
      const response = await queryAPI.executeQuery(id, query);
      
      if (response.status === 'success') {
        setQueryResult(response);
        
        // Add to recent queries if not already present
        if (!recentQueries.includes(query)) {
          setRecentQueries([query, ...recentQueries.slice(0, 4)]);
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
          
          {/* Table Schema Selector */}
          {showSchemaSelector && (
            <div className="mt-6">
              <TableSelector
                tables={tables}
                selectedTables={selectedTables}
                onSelect={handleTableSelection}
                onSubmit={handleStoreSchema}
                isLoading={isTableSelectorLoading || isSchemaStoring}
                title="Select Tables for Querying"
                subtitle="Choose which tables you want to include in your schema for natural language queries."
                submitButtonText={isSchemaStoring ? "Storing Schema..." : "Store Selected Tables Schema"}
              />
            </div>
          )}
          
          {/* Query Form */}
          {(hasStoredSchema && !showSchemaSelector) && (
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
              <SqlDisplay sql={queryResult.sql_query} />
              <ResultTable
                data={queryResult.result}
                rowCount={queryResult.row_count}
              />
            </div>
          )}
          
          {/* Schema Required Notice */}
          {(!hasStoredSchema && !showSchemaSelector) && (
            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Table Schema Required</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>
                  Before you can query this database, you need to select which tables to include in your schema.
                  This helps the AI understand your database structure and generate accurate SQL queries.
                </p>
              </div>
              <div className="mt-5">
                <Button 
                  variant="primary"
                  onClick={handleShowSchemaSelector}
                >
                  Select Tables
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(QueryPage);