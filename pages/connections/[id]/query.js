// pages/connections/[id]/query.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import QueryForm from '../../../components/query/QueryForm';
import SqlDisplay from '../../../components/query/SqlDisplay';
import ResultTable from '../../../components/query/ResultTable';
import ResultGraph from '../../../components/query/ResultGraph';
import TableSelector from '../../../components/tables/TableSelector';
import Button from '../../../components/common/Button';
import Alert from '../../../components/common/Alert';
import { connectionAPI, queryAPI, dashboardAPI } from '../../../lib/api';
import { withAuth } from '../../../lib/auth';
import Select from '../../../components/common/Select';
import { showSuccess, showError  } from '../../../lib/toast';


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
  const [dashboards, setDashboards] = useState([]);
  const [selectedDashboard, setSelectedDashboard] = useState(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [generatedScript, setGeneratedScript] = useState('');
  const [pairs, setPairs] = useState([{ table: '', column: '', value: '' }]); // Initialize with one empty pair
  const handlePairsUpdate = (newPairs) => {
    console.log('QueryPage received updated pairs:', newPairs);
    setPairs(newPairs);
  };
  const generateChatbotScript = () => {
    // Get the base URL of the application
    const baseUrl = window.location.origin;
    
    // Process pairs to ensure they're in the correct format
    const processedParams = pairs && Array.isArray(pairs) 
      ? pairs.filter(pair => pair.table && pair.column)
            .map(pair => ({
              table: pair.table,
              column: pair.column,
              value: pair.value || null,
              promptForValue: pair.value ? false : true
            }))
      : [];
    
    console.log('Generating script with parameters:', processedParams);
    
    // Create a more professional script that follows standard practices
    const scriptCode = `
<!-- NLP SQL Bot Chatbot Widget -->
<script>
  window.nlpSqlBotConfig = {
    connectionId: '${id}',
    baseUrl: '${baseUrl}', // Explicitly set the base URL
    embedded: true,
    fullPage: true, // Set to true for full page mode, false for widget mode
    params: ${JSON.stringify(processedParams)}
  };
</script>
<script
  defer
  id="nlpsql-chatbot-widget-script"
  src="${baseUrl}/api/chatbot-widget">
</script>
  `;
    
    setGeneratedScript(scriptCode);
    setShowScriptModal(true);
  };
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
          showError("Failed to fetch query history");
        }
        
      } catch (err) {
        showError(err.response?.data?.message || 'An error occurred while loading the query page');
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
        showError("Failed to load query result");
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
        sql_query: queryResult.sql_query,
        params: queryResult.params
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

  const handleAddWidget = async (query, result, chartConfig = null) => {
    try {
      if (!selectedDashboard) {
        setError('Please select a dashboard first');
        console.error('No dashboard selected');
        return;
      }

      console.log('Adding widget to dashboard:', selectedDashboard);
      setError(null);
      
      // Get chart preferences from the result
      const chartPreferences = result.chartPreferences || {};
      
      // Use chart type from preferences or fall back to config or default
      const chartType = chartPreferences.chartType || 
                        chartConfig?.chartType || 
                        'bar';
      
      // Get axis fields from preferences or fall back to config
      const xAxisField = chartPreferences.xAxisField || 
                         chartConfig?.customSettings?.categoryColumn || 
                         '';
      const yAxisField = chartPreferences.yAxisField || 
                         (chartConfig?.customSettings?.valueColumns && 
                          chartConfig.customSettings.valueColumns.length > 0 ? 
                          chartConfig.customSettings.valueColumns[0] : '');
      
      // Get colors from preferences or fall back to config
      const colors = chartPreferences.colors || {};
      
      const position = {
        x: 0,
        y: 0, // The dashboard will handle positioning
        w: 6,
        h: 2
      };

      // Create datasets with colors
      const datasets = [];
      if (result.result && result.result.length > 0) {
        // For doughnut charts or single value metrics
        if (chartType === 'doughnut' && result.result.length === 1) {
          const firstRow = result.result[0];
          const keys = Object.keys(firstRow);
          
          datasets.push({
            data: keys.map(key => parseFloat(firstRow[key]) || 0),
            backgroundColor: keys.map((_, i) => 
              colors[i]?.backgroundColor || `hsla(${i * 137.5 % 360}, 70%, 50%, 0.6)`
            ),
            borderColor: keys.map((_, i) => 
              colors[i]?.borderColor || `hsla(${i * 137.5 % 360}, 70%, 50%, 1)`
            ),
            borderWidth: 1
          });
        } 
        // For bar and line charts
        else {
          datasets.push({
            label: yAxisField.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
            data: result.result.map(row => parseFloat(row[yAxisField]) || 0),
            backgroundColor: colors[0]?.backgroundColor || 'hsla(210, 70%, 50%, 0.6)',
            borderColor: colors[0]?.borderColor || 'hsla(210, 70%, 50%, 1)',
            borderWidth: 1
          });
        }
      }

      const chartData = {
        type: chartType,
        data: result.result,
        datasets: datasets,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: chartPreferences.showLegend || chartConfig?.showLegend || false
            },
            title: {
              display: true,
              text: query
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      };

      const widgetData = {
        dashboard_id: selectedDashboard,
        name: query,
        widget_type: 'chart',
        natural_language_query: query,
        sql_query: result.sql_query,
        visualization_settings: {
          chartType: chartType,
          chartData: chartData,
          axisFields: {
            xAxis: xAxisField,
            yAxis: yAxisField
          }
        },
        position: position,
        refresh_interval: 0
      };

      console.log('Widget data being sent:', widgetData);
      const response = await dashboardAPI.addWidget(widgetData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (err) {
      console.error('Error adding widget:', err);
      setError(err.response?.data?.message || 'Failed to add widget');
    }
  };

  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        if (!id) return; // Make sure connection ID is available
        
        console.log('Fetching dashboards for connection:', id);
        const response = await dashboardAPI.getDashboardsByCollection(id);
        
        if (response.status === 'success' && response.dashboards) {
          console.log('Loaded dashboards:', response.dashboards);
          setDashboards(response.dashboards);
          
          // If there are dashboards, select the first one by default
          if (response.dashboards.length > 0) {
            setSelectedDashboard(response.dashboards[0].id);
          }
        } else {
          console.error('Failed to load dashboards:', response);
        }
      } catch (err) {
        console.error('Error fetching dashboards:', err);
      }
    };
    
    fetchDashboards();
  }, [id]);
  
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
                {connection ? connection.name : 'Database'} - Query To Database
              </h1>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Link href={`/connections/${id}`}>
                <Button variant="outline">
                  Back to Connection
                </Button>
              </Link>

              <button
              type="button"
              onClick={generateChatbotScript}
              className="ml-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Generate Chatbot Script
            </button>
              
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
                onPairsChange={handlePairsUpdate}
                pairs={pairs}
                initialQuery={router.query.query || ''}
              />
            </div>
          )}
          
          {/* SQL Display and Results */}
          {queryResult && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Query Results</h2>
                <div className="flex items-center space-x-4">
                  <div className="w-64">
                    <Select
                      value={selectedDashboard}
                      onChange={(value) => setSelectedDashboard(value)}
                      options={dashboards.map(d => ({ value: d.id, label: d.name }))}
                      placeholder="Select Dashboard"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const data = queryResult.result;
                      const firstRow = data[0];
                      const keys = Object.keys(firstRow);
                      
                      const numericColumns = keys.filter(key => 
                        typeof firstRow[key] === 'number' || !isNaN(parseFloat(firstRow[key]))
                      );
                      const nonNumericColumns = keys.filter(key => !numericColumns.includes(key));
                      
                      let chartConfig;
                      if (data.length === 1) {
                        chartConfig = {
                          type: 'chart',
                          chartType: 'bar',
                          title: queryResult.natural_language_query,
                          showLegend: false,
                          backgroundColor: 'rgba(54, 162, 235, 0.2)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1,
                          customSettings: {
                            dataStructure: 'single-row'
                          }
                        };
                      } else if (nonNumericColumns.length >= 1 && numericColumns.length >= 1) {
                        chartConfig = {
                          type: 'chart',
                          chartType: 'bar',
                          title: queryResult.natural_language_query,
                          showLegend: numericColumns.length > 1,
                          backgroundColor: 'rgba(54, 162, 235, 0.2)',
                          borderColor: 'rgba(54, 162, 235, 1)',
                          borderWidth: 1,
                          customSettings: {
                            dataStructure: 'time-series',
                            categoryColumn: nonNumericColumns[0],
                            valueColumns: numericColumns
                          }
                        };
                      }

                      handleAddWidget(
                        queryResult.natural_language_query,
                        queryResult,
                        chartConfig
                      );
                    }}
                    disabled={!selectedDashboard}
                  >
                    Save to Dashboard
                  </Button>
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
              <div className="mt-6">
                <ResultGraph
                  data={queryResult.result}
                  sql={queryResult.sql_query}
                  title="Query Results Visualization"
                  className="h-[400px]"
                  // Show controls in the query page
                  hideControls={false}
                  // Add callback to capture chart preference changes
                  onChartPreferencesChange={(preferences) => {
                    // Update the queryResult with the new preferences
                    setQueryResult(prev => ({
                      ...prev,
                      chartPreferences: preferences
                    }));
                  }}
                />
              </div>
              <SqlDisplay sql={queryResult.sql_query} />
              <ResultTable
                data={queryResult.result}
                rowCount={queryResult.row_count}
              />
            </div>
          )}
          
        
        </div>

        {showScriptModal && (
  <div className="fixed z-10 inset-0 overflow-y-auto">
    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 transition-opacity" aria-hidden="true">
        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
        <div>
          <div className="mt-3 text-center sm:mt-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              Chatbot Embed Script
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-4">
                Copy and paste this script into any website to embed the AI Assistant chatbot with your current query parameters.
              </p>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-left text-xs overflow-x-auto whitespace-pre-wrap">
                  {generatedScript}
                </pre>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
            onClick={() => {
              navigator.clipboard.writeText(generatedScript);
              showSuccess('Script copied to clipboard');
            }}
          >
            Copy to Clipboard
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            onClick={() => setShowScriptModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}
      </div>
    </Layout>
  );
};

export default withAuth(QueryPage);
