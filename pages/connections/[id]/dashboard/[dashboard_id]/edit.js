// pages/connections/[id]/dashboard/[dashboard_id]/edit.js
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../../components/layout/Layout';
import Button from '../../../../../components/common/Button';
import Alert from '../../../../../components/common/Alert';
import { dashboardAPI, queryAPI } from '../../../../../lib/api';
import ResultGraph from '../../../../../components/query/ResultGraph';

const DashboardEditPage = () => {
  const router = useRouter();
  const { id: connectionId, dashboard_id: dashboardId } = router.query;
  
  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Changed to false initially
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Added for initial page load
  const [error, setError] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Resizable column state
  const [leftWidth, setLeftWidth] = useState(350); // px
  const [isResizing, setIsResizing] = useState(false);

  // Mouse event handlers for resizing
  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);
  const handleMouseMove = (e) => {
    if (!isResizing) return;
    setLeftWidth(Math.max(220, Math.min(e.clientX, window.innerWidth - 220)));
  };

  // Attach/detach mousemove listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  // Load initial dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      if (!connectionId || !dashboardId) return;

      try {
        setIsInitialLoading(true);
        const response = await dashboardAPI.get(dashboardId);
        setDashboard(response.dashboard);
        setWidgets(response.dashboard.widgets || []);
        
        // Load chat history
        const savedMessages = localStorage.getItem(`chat_history_${dashboardId}`);
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        }
      } catch (err) {
        setError(err.response?.data?.message || '');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadDashboard();
  }, [connectionId, dashboardId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`chat_history_${dashboardId}`, JSON.stringify(messages));
  }, [messages, dashboardId]);

  // Scroll to bottom of chat when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleQueryExecution = async (query, pairs = []) => {
    try {
      setError(null);
      setIsLoading(true); // This is for query execution loading only
      
      const response = await queryAPI.executeQuery(connectionId, query, pairs);
      
      if (response.status === 'success') {
        console.log('Query result:', response);
        setQueryResult(response);
        return response;
      } else {
        setError(response.message || 'Query execution failed');
        return { status: 'error', message: response.message };
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred while executing the query';
      setError(errorMessage);
      return { status: 'error', message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWidget = async (query, result, chartConfig = null) => {
    try {
      setError(null);
      
      // Calculate position for new widget
      const position = {
        x: 0,
        y: widgets.length * 2, // Simple vertical stacking
        w: 6,
        h: 2
      };

      // Prepare chart data structure
      const chartData = {
        type: chartConfig?.chartType || 'bar',
        data: result.result, // Store the raw data
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: chartConfig?.showLegend || false
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
        dashboard_id: dashboardId,
        name: query,
        widget_type: 'chart',
        natural_language_query: query,
        sql_query: result.sql_query,
        visualization_settings: {
          chartType: chartConfig?.chartType || 'bar',
          chartData: chartData
        },
        position: position,
        refresh_interval: 0
      };

      console.log('Adding widget with data:', widgetData);
      const response = await dashboardAPI.addWidget(widgetData);
      
      // Update local state with the new widget
      const newWidget = response.widget;
      setWidgets(prev => [...prev, newWidget]);
      
    } catch (err) {
      console.error('Error adding widget:', err);
      setError(err.response?.data?.message || 'Failed to add widget');
    }
  };

  const handleRemoveWidget = async (index) => {
    try {
      setError(null);
      const updatedWidgets = widgets.filter((_, i) => i !== index);
      setWidgets(updatedWidgets);

      await dashboardAPI.update(dashboardId, {
        ...dashboard,
        widgets: updatedWidgets
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove widget');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    try {
      // Execute query
      const response = await handleQueryExecution(currentMessage);
      
      // Add system response to chat
      const systemMessage = {
        type: 'system',
        content: response.status === 'success' 
          ? 'Here are the results for your query.'
          : response.message || 'Sorry, I could not process your query.',
        timestamp: new Date().toISOString(),
        queryResult: response.status === 'success' ? response : null
      };
      setMessages(prev => [...prev, systemMessage]);
    } catch (error) {
      // Add error message to chat
      const errorMessage = {
        type: 'system',
        content: 'Sorry, an error occurred while processing your query.',
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Message component
  const ChatMessage = ({ message }) => (
    <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-lg p-3 ${
        message.type === 'user' 
          ? 'bg-blue-600 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-800 rounded-bl-none'
      }`}>
        <p className="text-sm">{message.content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );

  // Show loading spinner only during initial page load
  if (isInitialLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]"> {/* Adjusted height */}
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Edit Dashboard - {dashboard?.name || 'Loading...'}</title>
      </Head>
      <div className="flex flex-row h-[calc(100vh-4rem)] overflow-hidden bg-gray-50">
        {/* Left Column: Data Assistant */}
        <div
          className="bg-white border-r border-gray-200 flex flex-col transition-all duration-200"
          style={{ width: leftWidth, minWidth: 220, maxWidth: 600 }}
        >
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">Data Assistant</h1>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 my-8">
                  <p>👋 Hi! Ask me anything about your data.</p>
                  <p className="text-sm mt-2">Example: "Show me monthly sales trends"</p>
                </div>
              )}
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask a question about your data..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!currentMessage.trim() || isLoading}
                className={`px-4 py-2 rounded-full bg-blue-600 text-white flex items-center justify-center ${
                  (!currentMessage.trim() || isLoading) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
        {/* Divider */}
        <div
          className="w-2 cursor-col-resize bg-gray-200 hover:bg-blue-300 transition"
          onMouseDown={startResizing}
          style={{ zIndex: 20 }}
        />
        {/* Right Column: Results */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">Results</h1>
              <Link href={`/connections/${connectionId}/dashboard/${dashboardId}`}>
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-6">
            {error && (
              <Alert type="error" message={error} className="mb-6" />
            )}

            {/* Query Results */}
            {queryResult && queryResult.status === 'success' && (
              <div className="space-y-6">
                

                {/* Graph Visualization */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Data Visualization</h3>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          // Prepare visualization settings based on data structure
                          const data = queryResult.result;
                          const firstRow = data[0];
                          const keys = Object.keys(firstRow);
                          
                          // Find numeric and non-numeric columns
                          const numericColumns = keys.filter(key => 
                            typeof firstRow[key] === 'number' || !isNaN(parseFloat(firstRow[key]))
                          );
                          const nonNumericColumns = keys.filter(key => !numericColumns.includes(key));
                          
                          // Determine chart type and structure based on data
                          let chartConfig;
                          if (data.length === 1) {
                            // Single row data - use bar chart for comparison
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
                            // Time series or categorical data
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
                      >
                        Save Chart
                      </Button>
                    </div>
                  </div>
                  {queryResult?.result && queryResult.result.length > 0 ? (
                    <>
                      {console.log('Query Result Data:', {
                        data: queryResult.result,
                        firstRow: queryResult.result[0],
                        columns: Object.keys(queryResult.result[0]),
                        numericColumns: Object.keys(queryResult.result[0]).filter(key => 
                          typeof queryResult.result[0][key] === 'number' || !isNaN(parseFloat(queryResult.result[0][key]))
                        ),
                        nonNumericColumns: Object.keys(queryResult.result[0]).filter(key => 
                          typeof queryResult.result[0][key] !== 'number' && isNaN(parseFloat(queryResult.result[0][key]))
                        )
                      })}
                      <ResultGraph
                        data={queryResult.result}
                        sql={queryResult.sql_query}
                        title={queryResult.natural_language_query || "Query Results Visualization"}
                        className="h-[400px]"
                        maxHeight={400}
                      />
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No data available for visualization
                    </div>
                  )}
                </div>

               
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardEditPage;
