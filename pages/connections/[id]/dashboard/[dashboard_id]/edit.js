
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../../components/layout/Layout';
import Button from '../../../../../components/common/Button';
import Alert from '../../../../../components/common/Alert';
import { dashboardAPI, queryAPI,conversationAPI } from '../../../../../lib/api';
import ResultGraph from '../../../../../components/query/ResultGraph';
import axios from '../../../../../lib/api';
import { showSuccess, showError } from '../../../../../lib/toast';

const DashboardEditPage = () => {
  const router = useRouter();
  const { id: connectionId, dashboard_id: dashboardId } = router.query;
  
  const [dashboard, setDashboard] = useState(null);
  const [widgets, setWidgets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isConversationListOpen, setIsConversationListOpen] = useState(false);
  const [chartPreferences, setChartPreferences] = useState(null);
  const [processedQuestion, setProcessedQuestion] = useState(false);

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
      if (!router.isReady) return;
      if (!connectionId || !dashboardId) return;

      try {
        setIsInitialLoading(true);
        const response = await dashboardAPI.get(dashboardId);
        setDashboard(response.dashboard);
        setWidgets(response.dashboard.widgets || []);
        
        // Fetch conversations
        await fetchConversations();
      } catch (err) {
        setError(err.response?.data?.message || '');
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadDashboard();
  }, [router.isReady, connectionId, dashboardId]);

  // Add a separate useEffect for fetching conversations
  useEffect(() => {
    if (router.isReady && connectionId && dashboardId) {
      fetchConversations();
    }
  }, [router.isReady]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      console.log('Fetching conversations...');
      const response = await conversationAPI.getConversations(connectionId);
      if (response.status === 'success') {
        console.log('Conversations fetched:', response.conversations);
        setConversations(response.conversations);
        
        // If there are conversations and no current conversation is selected,
        // select the most recent one
        if (response.conversations.length > 0 && !currentConversation) {
          const mostRecent = response.conversations[0];
          setCurrentConversation(mostRecent);
          await fetchMessages(mostRecent.id);
        } else if (response.conversations.length === 0) {
          // No conversations exist for this connection, create a new one
          console.log('No conversations found, creating a new one...');
          
          await createNewConversation();
        }
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId) => {
    try {
      const response = await axios.get(`/queries/${conversationId}/history`);
      if (response.data.status === 'success') {
        // Process the new message format
        const formattedMessages = [];
        
        // For each message in the API response, create a user message and a system message
        response.data.messages.forEach(msg => {
          // Add user message
          formattedMessages.push({
            id: `${msg.id}-user`,
            type: 'user',
            content: msg.natural_language_query,
            timestamp: msg.created_at,
            sql_query: msg.sql_query
          });
          
          // Add system message
          formattedMessages.push({
            id: `${msg.id}-system`,
            type: 'system',
            content: msg.ai_response,
            timestamp: msg.created_at,
            sql_query: msg.sql_query,
            queryResult: msg.sql_query ? {
              status: 'success',
              result: msg.result || [],
              sql_query: msg.sql_query,
              natural_language_query: msg.natural_language_query
            } : null
          });
        });
        
        setMessages(formattedMessages);
        
        // Update current conversation if provided in the response
        if (response.data.conversation) {
          setCurrentConversation(response.data.conversation);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // Create a new conversation
  const createNewConversation = async () => {
    try {
      // Create a title with current date and time
      const now = new Date();
      const formattedDate = now.toLocaleDateString();
      const formattedTime = now.toLocaleTimeString();
      const title = `Chat_${formattedDate}_${formattedTime}`;
      
      const response = await axios.post('/conversations', {
        title: title,
        connection_id: connectionId
      });
      
      if (response.data.status === 'success') {
        const newConversation = response.data.conversation;
        setCurrentConversation(newConversation);
        setMessages([]);
        
        // Update the conversations list
        await fetchConversations();
        showSuccess('New conversation created');
      }
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      showError('Failed to create new conversation');
    }
  };

  // Save messages to localStorage whenever they change
  // useEffect(() => {
  //   if (currentConversation) {
  //     localStorage.setItem(`chat_history_${currentConversation.id}`, JSON.stringify(messages));
  //   }
  // }, [messages, currentConversation]);

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
      setIsLoading(true);
      
      // Include conversation ID if available
      const conversationId = currentConversation?.id;
      
      // Execute query with conversation context if available
      const response = await queryAPI.executeQuery(
        connectionId, 
        query, 
        pairs,
        conversationId // Pass conversation ID as an additional parameter
      );
      
      if (response.status === 'success') {
        setQueryResult(response);
        return response;
      }
      
      setError(response.message || 'Query execution failed');
      showError(response.message || 'Query execution failed');
      return { status: 'error', message: response.message };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'An error occurred while executing the query';
      setError(errorMessage);
      showError(errorMessage);
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

      // Get user-selected chart preferences from ResultGraph if available
      const chartType = chartConfig?.chartType || result.chartPreferences?.chartType || 'bar';
      const xAxisField = result.chartPreferences?.xAxisField || '';
      const yAxisField = result.chartPreferences?.yAxisField || '';
      const colors = result.chartPreferences?.colors || {};
      
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
      
      // Prepare chart data structure with user selections
      const chartData = {
        type: chartType,
        data: result.result, // Store the raw data
        datasets: datasets,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: chartPreferences?.showLegend || false
            },
            title: {
              display: true,
              text: query
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: !!chartPreferences?.yAxisField,
                text: chartPreferences?.yAxisField?.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim() || ''
              }
            },
            x: {
              title: {
                display: !!chartPreferences?.xAxisField,
                text: chartPreferences?.xAxisField?.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim() || ''
              }
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
          chartType: chartPreferences?.chartType || 'bar',
          chartData: chartData,
          axisFields: {
            xAxis: chartPreferences?.xAxisField || '',
            yAxis: chartPreferences?.yAxisField || ''
          }
        },
        position: position,
        refresh_interval: 0
      };

      console.log('Adding widget with data:', widgetData);
      const response = await dashboardAPI.addWidget(widgetData);
      
      // Update local state with the new widget
      const newWidget = response.widget;
      setWidgets(prev => [...prev, newWidget]);
      
      // Show success message
      showSuccess('Widget added successfully');
      
    } catch (err) {
      console.error('Error adding widget:', err);
      setError(err.response?.data?.message || 'Failed to add widget');
      showError(err.response?.data?.message || 'Failed to add widget');
    }
  };

  // Add this useEffect to handle the question parameter
  useEffect(() => {
    if (!router.isReady) return;
    if (processedQuestion) return; // Skip if we've already processed a question
    
    // Check if there's a question in the URL query parameters
    const { question } = router.query;
    if (question && question.trim() !== '') {
      console.log('Question from URL:', question);
      
      // Mark as processed to prevent duplicate processing
      setProcessedQuestion(true);
      
      // Set the current message to the question from the URL
      setCurrentMessage(question);
      
      // Wait for the next render cycle before sending
      setTimeout(() => {
        // Manually trigger the query execution
        const messageToSend = question;
        
        // Add user message to chat
        const userMessage = {
          type: 'user',
          content: messageToSend,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Execute query directly
        handleQueryExecution(messageToSend)
          .then(response => {
            if (response) {
              // Add system response to chat
              const systemMessage = {
                type: 'system',
                content: response.status === 'success' 
                  ? response.message
                  : response.message || 'Sorry, I could not process your query.',
                timestamp: new Date().toISOString(),
                queryResult: response.status === 'success' ? response : null
              };
              setMessages(prev => [...prev, systemMessage]);
            }
          })
          .catch(error => {
            // Add error message to chat
            const errorMessage = {
              type: 'system',
              content: 'Sorry, an error occurred while processing your query.',
              timestamp: new Date().toISOString(),
              error: true
            };
            setMessages(prev => [...prev, errorMessage]);
          });
        
        // Clear the input field
        setCurrentMessage('');
        
        // Remove the question from the URL to prevent re-execution on page refresh
        router.replace(
          `/connections/${connectionId}/dashboard/${dashboardId}/edit`, 
          undefined, 
          { shallow: true }
        );
      }, 1500);
    }
  }, [router.isReady, router.query, processedQuestion, connectionId, dashboardId]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!currentMessage.trim()) return;

    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Store the message to send
    const messageToSend = currentMessage;
    setCurrentMessage('');

    try {
      // If no conversation exists, create one
      if (!currentConversation) {
        await createNewConversation();
      }
      
      // Execute query
      const response = await handleQueryExecution(messageToSend);
      
      // If we're using the conversation API, the messages are already updated
      if (!response) return;
      
      // Add system response to chat if not using conversation API
      const systemMessage = {
        type: 'system',
        content: response.status === 'success' 
          ? response.message
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
  const ChatMessage = ({ message }) => {
    // Format the timestamp safely
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      
      try {
        // Add 'Z' to indicate UTC if the timestamp doesn't have a timezone
        const formattedTimestamp = timestamp.includes('Z') ? timestamp : `${timestamp}Z`;
        return new Date(formattedTimestamp).toLocaleTimeString();
      } catch (error) {
        console.error('Error formatting date:', error);
        return 'Unknown time';
      }
    };
    
    return (
      <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-[70%] rounded-lg p-3 ${
          message.type === 'user' 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}>
          <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
          <span className="text-xs opacity-70 mt-1 block">
            {formatTime(message.timestamp || message.created_at)}
          </span>
        </div>
      </div>
    );
  };

  // Show loading spinner only during initial page load
  if (isInitialLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-4rem)]">
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
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">Data Assistant</h1>
            <div className="flex space-x-2">
              <button 
                onClick={() => setIsConversationListOpen(!isConversationListOpen)}
                className="p-1 rounded-full hover:bg-gray-100"
                title="Conversation history"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
              <button 
                onClick={createNewConversation}
                className="p-1 rounded-full hover:bg-gray-100"
                title="New conversation"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Conversation List */}
          {isConversationListOpen && (
            <div className="border-b border-gray-200 max-h-60 overflow-y-auto">
              <div className="p-2 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Conversations</h3>
                {conversations.length === 0 ? (
                  <p className="text-xs text-gray-500 p-2">No conversations yet</p>
                ) : (
                  <div className="space-y-1">
                    {conversations.map(conv => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setCurrentConversation(conv);
                          fetchMessages(conv.id);
                          setIsConversationListOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded text-sm ${
                          currentConversation?.id === conv.id 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <span className="truncate">{conv.title}</span>
                        </div>
                        <div className="text-xs text-gray-500 ml-6">
                          {new Date(conv.created_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
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
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Ask a question about your data..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                style={{ 
                  overflow: 'hidden',
                  height: '40px',
                  maxHeight: '80px'
                }}
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (currentMessage.trim()) {
                      handleSendMessage(e);
                    }
                  }
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
                }}
              />
              <button
                type="submit"
                disabled={!currentMessage.trim()}
                className={`px-4 py-2 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 ${
                  !currentMessage.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            <div className="text-xs text-gray-500 mt-1">
              Press Enter to send, Shift+Enter for new line
            </div>
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
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            )}

            {error && (
              <Alert type="error" message={error} className="mb-6" />
            )}

            {/* Query Results */}
            {!isLoading && queryResult && queryResult.status === 'success' && (
              <div className="space-y-6">
                {/* Query Text Display */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Query</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap break-words">
                      {queryResult.natural_language_query}
                    </p>
                  </div>
                </div>

                {/* Graph Visualization */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Data Visualization</h3>
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => {
                          handleAddWidget(
                            queryResult.natural_language_query,
                            queryResult,
                            chartPreferences
                          );
                        }}
                      >
                        Save Chart
                      </Button>
                    </div>
                  </div>
                  {queryResult?.result && queryResult.result.length > 0 ? (
                    <ResultGraph
                      data={queryResult.result}
                      sql={queryResult.sql_query}
                      title={queryResult.natural_language_query || "Query Results Visualization"}
                      className="h-[400px]"
                      maxHeight={400}
                      onChartPreferencesChange={(preferences) => {
                        setChartPreferences(preferences);
                        // Update queryResult with the preferences
                        setQueryResult(prev => ({
                          ...prev,
                          chartPreferences: {
                            ...preferences,
                            colors: preferences.colors // Make sure colors are included
                          }
                        }));
                      }}
                      // Pass initial values if available from previous settings
                      initialChartType={queryResult.chartPreferences?.chartType}
                      initialXAxisField={queryResult.chartPreferences?.xAxisField}
                      initialYAxisField={queryResult.chartPreferences?.yAxisField}
                      initialColors={queryResult.chartPreferences?.colors}
                    />
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
