import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../../components/layout/Layout';
import Button from '../../../../../components/common/Button';
import Alert from '../../../../../components/common/Alert';
import { dashboardAPI, queryAPI } from '../../../../../lib/api';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import ResultGraph from '../../../../../components/query/ResultGraph';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardView = () => {
  const router = useRouter();
  const { id: connectionId, dashboard_id: dashboardId } = router.query;
  
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [layouts, setLayouts] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const isInitialLoad = useRef(true);
  const prevLayouts = useRef({});
  const [widgetChartTypes, setWidgetChartTypes] = useState({});
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleDeleteWidget = async (widgetId) => {
    console.log('Deleting widget with ID:', widgetId); // Add this for debugging
    
    if (!confirm('Are you sure you want to delete this widget? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await dashboardAPI.deleteWidget(widgetId);
      if (response.status === 'success') {
        // Update dashboard state by removing the deleted widget
        setDashboard(prev => ({
          ...prev,
          widgets: prev.widgets.filter(w => w.id !== widgetId)
        }));
        
        // Update layouts
        const newLayouts = { ...layouts };
        Object.keys(newLayouts).forEach(breakpoint => {
          newLayouts[breakpoint] = newLayouts[breakpoint].filter(
            item => item.i !== widgetId.toString()
          );
        });
        setLayouts(newLayouts);
      }
    } catch (err) {
      console.error('Error deleting widget:', err);
      setError('Failed to delete widget. Please try again.');
    }
  };

  // Function to save layout to backend (only changed widgets)
  const saveLayout = async (newLayouts, oldLayouts) => {
    try {
      setIsSaving(true);
      
      // Get the current breakpoint's layout (typically 'lg' for large screens)
      const currentLayout = newLayouts.lg || Object.values(newLayouts)[0];
      
      // Create a map of the old layouts for comparison
      const oldLayoutMap = {};
      Object.values(oldLayouts).forEach(layout => {
        layout.forEach(item => {
          oldLayoutMap[item.i] = item;
        });
      });

      // Find widgets whose position or size has changed
      const changedWidgets = currentLayout
        .filter(layout => {
          const oldLayout = oldLayoutMap[layout.i];
          return !oldLayout || 
                 oldLayout.x !== layout.x || 
                 oldLayout.y !== layout.y || 
                 oldLayout.w !== layout.w || 
                 oldLayout.h !== layout.h;
        })
        .map(layout => ({
          widget_id: parseInt(layout.i),
          position: {
            x: layout.x,
            y: layout.y,
            w: layout.w,
            h: layout.h
          },
          size: {
            width: layout.w,
            height: layout.h
          }
        }));

      if (changedWidgets.length === 0) {
        console.log('No layout changes detected');
        return;
      }

      console.log('Saving layout changes:', changedWidgets);
      
      // Match the backend API's expected structure
      const payload = {
        widgets: changedWidgets
      };

      const response = await dashboardAPI.updateLayout(dashboardId, payload);

      if (response.status === 'success') {
        console.log('Layout updated successfully');
        // Update the previous layouts reference
        prevLayouts.current = { ...newLayouts };
        
        // Update the dashboard state with new positions
        const updatedDashboard = { ...dashboard };
        updatedDashboard.widgets = updatedDashboard.widgets.map(widget => {
          const changed = changedWidgets.find(w => w.widget_id === widget.id);
          if (changed) {
            return {
              ...widget,
              position: changed.position,
              size: changed.size
            };
          }
          return widget;
        });
        setDashboard(updatedDashboard);
      } else {
        console.error('Failed to update layout:', response);
        setError('Failed to save layout changes');
      }

    } catch (err) {
      console.error('Error saving layout:', err);
      setError('Failed to save layout changes');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;
    if (!connectionId || !dashboardId) return;
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardAPI.getDashboard(dashboardId);
        const dashboardData = response.dashboard.dashboard;
        setDashboard(dashboardData);
        // Initialize layouts from widget positions and sizes
        const initialLayouts = {
          lg: dashboardData.widgets.map((widget) => ({
            i: widget.id.toString(),
            x: widget.position?.x || 0,
            y: widget.position?.y || 0,
            w: widget.size?.width || widget.position?.w || 1,
            h: widget.size?.height || widget.position?.h || 1,
            minW: 1,
            minH: 1,
            maxW: 3,
            maxH: Infinity,
            static: false
          })),
          md: dashboardData.widgets.map((widget) => ({
            i: widget.id.toString(),
            x: widget.position?.x || 0,
            y: widget.position?.y || 0,
            w: widget.size?.width || widget.position?.w || 1,
            h: widget.size?.height || widget.position?.h || 1,
            minW: 1,
            minH: 1,
            maxW: 3,
            maxH: Infinity,
            static: false
          })),
          sm: dashboardData.widgets.map((widget) => ({
            i: widget.id.toString(),
            x: widget.position?.x || 0,
            y: widget.position?.y || 0,
            w: widget.size?.width || widget.position?.w || 1,
            h: widget.size?.height || widget.position?.h || 1,
            minW: 1,
            minH: 1,
            maxW: 3,
            maxH: Infinity,
            static: false
          })),
          xs: dashboardData.widgets.map((widget) => ({
            i: widget.id.toString(),
            x: widget.position?.x || 0,
            y: widget.position?.y || 0,
            w: widget.size?.width || widget.position?.w || 1,
            h: widget.size?.height || widget.position?.h || 1,
            minW: 1,
            minH: 1,
            maxW: 3,
            maxH: Infinity,
            static: false
          })),
          xxs: dashboardData.widgets.map((widget) => ({
            i: widget.id.toString(),
            x: widget.position?.x || 0,
            y: widget.position?.y || 0,
            w: widget.size?.width || widget.position?.w || 1,
            h: widget.size?.height || widget.position?.h || 1,
            minW: 1,
            minH: 1,
            maxW: 3,
            maxH: Infinity,
            static: false
          }))
        };
        setLayouts(initialLayouts);
        prevLayouts.current = { ...initialLayouts };
        isInitialLoad.current = false;
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, [router.isReady, connectionId, dashboardId]);

  // Function to render a metric display for single value data
  const renderMetricDisplay = (widget) => {
    const data = widget.visualization_settings?.chartData?.data?.[0] || {};
    const value = Object.values(data)[0];
    const label = Object.keys(data)[0];

    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-4xl font-bold text-blue-600">{value}</p>
      </div>
    );
  };

  // Function to handle chart type changes
  const handleChartTypeChange = (widgetId, chartType) => {
    setWidgetChartTypes(prev => ({
      ...prev,
      [widgetId]: chartType
    }));
  };

  // Function to render a chart for time series data
  const renderChart = (widget) => {
    const chartData = widget.visualization_settings?.chartData;
    
    if (!chartData || !chartData.data) {
      console.log('No chart data available');
      return null;
    }

    return (
      <div className="h-full">
        <ResultGraph
          data={chartData.data}
          title={widget.name}
          sql={widget.sql_query}
          maxHeight="100%"
          className="h-full"
        />
      </div>
    );
  };

  // Function to handle layout changes (both drag and resize)
  const onLayoutChange = (layout, layouts) => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    
    // Save layout changes
    saveLayout(layouts, prevLayouts.current);
  };

  // Function to handle drag stop
  const onDragStop = (layout, oldItem, newItem, placeholder, e, element) => {
    const layouts = {
      lg: layout,
      md: layout,
      sm: layout,
      xs: layout,
      xxs: layout
    };
    saveLayout(layouts, prevLayouts.current);
  };

  // Function to handle resize stop
  const onResizeStop = (layout, oldItem, newItem, placeholder, e, element) => {
    const layouts = {
      lg: layout,
      md: layout,
      sm: layout,
      xs: layout,
      xxs: layout
    };
    saveLayout(layouts, prevLayouts.current);
  };

  const handleQueryExecution = async (query) => {
    try {
      setIsExecuting(true);
      const response = await queryAPI.executeQuery(connectionId, query);
      setQueryResult(response);
      return response;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');

    try {
      const response = await handleQueryExecution(userMessage.content);
      
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
      const errorMessage = {
        type: 'system',
        content: 'Sorry, an error occurred while processing your query.',
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleUpdateWidget = async () => {
    if (!queryResult || !selectedWidget) return;

    try {
      const chartData = {
        type: 'bar',
        data: queryResult.result,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: currentMessage
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      };

      const updatedWidget = {
        ...selectedWidget,
        natural_language_query: currentMessage,
        sql_query: queryResult.sql_query,
        visualization_settings: {
          chartType: 'bar',
          chartData: chartData
        }
      };

      const response = await dashboardAPI.updateWidget(selectedWidget.id, updatedWidget);
      
      if (response.status === 'success') {
        // Update the widget in the dashboard state
        setDashboard(prev => ({
          ...prev,
          widgets: prev.widgets.map(w => 
            w.id === selectedWidget.id ? updatedWidget : w
          )
        }));
        
        // Close the popup
        handleClosePopup();
      }
    } catch (err) {
      console.error('Error updating widget:', err);
      setError('Failed to update widget');
    }
  };

  const handleClosePopup = () => {
    setIsEditPopupOpen(false);
    setSelectedWidget(null);
    setMessages([]);
    setCurrentMessage('');
    setQueryResult(null);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{dashboard?.name || 'Dashboard'} - NLP SQL Bot</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900">
                {dashboard?.name}
              </h1>
              {dashboard?.description && (
                <p className="mt-1 text-sm text-gray-500">
                  {dashboard.description}
                </p>
              )}
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
              <Link href={`/connections/${connectionId}/dashboard`}>
                <Button variant="outline">Back to Dashboards</Button>
              </Link>
              <Button 
                variant="outline"
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const response = await dashboardAPI.refreshDashboard(dashboardId);
                    setDashboard(response.dashboard.dashboard);
                  } catch (err) {
                    setError(err.response?.data?.message || 'Failed to refresh dashboard');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                    Refreshing...
                  </div>
                ) : (
                  'Refresh Data'
                )}
              </Button>
              <Link href={`/connections/${connectionId}/dashboard/${dashboardId}/edit`}>
                <Button variant="primary">Edit Dashboard</Button>
              </Link>
            </div>
          </div>

          {error && (
            <Alert
              type="error"
              message={error}
              className="mb-6"
            />
          )}

          {/* Widgets Grid */}
          <div className="relative min-h-[800px] overflow-auto rounded-lg bg-white shadow">
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 3, md: 3, sm: 3, xs: 3, xxs: 3 }}
              rowHeight={150}
              onLayoutChange={onLayoutChange}
              onDragStop={onDragStop}
              onResizeStop={onResizeStop}
              isDraggable={true}
              isResizable={true}
              margin={[12, 12]}
              containerPadding={[12, 12]}
              autoSize={true}
              compactType={null}
              preventCollision={true}
              resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
              allowOverlap={false}
              verticalCompact={false}
              useCSSTransforms={true}
              isBounded={false}
              style={{ minHeight: '100%' }}
              draggableHandle=".drag-handle"
            >
              {dashboard?.widgets?.map((widget) => {
                const chartData = widget.visualization_settings?.chartData;
                const isSingleValue = chartData?.data?.length === 1 && 
                  Object.keys(chartData.data[0]).length === 1;
                
                console.log('Widget being rendered:', widget); // Add this for debugging
                
                return (
                  <div 
                    key={widget.id}
                    className="bg-white shadow rounded-lg overflow-hidden h-full relative"
                    style={{ touchAction: 'none' }} // Prevent touch events from interfering
                  >
                    {/* Increased z-index and added pointer-events-auto to ensure clickability */}
                    <div className="absolute top-2 right-2 z-[999] pointer-events-auto flex space-x-1">
                      {/* Edit Button */}
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedWidget(widget);
                          setIsEditPopupOpen(true);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        title="Edit widget"
                      >
                        <svg 
                          className="h-5 w-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                          />
                        </svg>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Delete button clicked for widget:', widget.id);
                          handleDeleteWidget(widget.id);
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                        title="Delete widget"
                      >
                        <svg 
                          className="h-5 w-5" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="p-4 border-b border-gray-200 drag-handle">
                      <div className="flex justify-between items-center pr-8"> {/* Added pr-8 to account for delete button */}
                        <h3 className="text-sm font-medium text-center text-gray-900">
                        {widget.natural_language_query}
                        </h3>
                      </div>
                      
                    </div>
                    <div className="h-[calc(100%-80px)] overflow-auto">
                      {isSingleValue ? renderMetricDisplay(widget) : renderChart(widget)}
                    </div>
                  </div>
                );
              })}
            </ResponsiveGridLayout>

            {(!dashboard?.widgets || dashboard.widgets.length === 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                <p className="text-gray-500 text-lg mb-4">No widgets added to this dashboard yet.</p>
                <Link href={`/connections/${connectionId}/dashboard/${dashboardId}/edit`}>
                  <Button variant="primary">Add Widget</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      {isEditPopupOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col relative">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Edit Widget</h2>
              <button
                onClick={handleClosePopup}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      message.type === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    <p>{message.content}</p>
                    {message.queryResult && (
                      <div className="mt-4 h-64">
                        <ResultGraph
                          data={message.queryResult.result}
                          sql={message.queryResult.sql_query}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isExecuting || !currentMessage.trim()}
                  variant="primary"
                >
                  {isExecuting ? 'Executing...' : 'Execute Query'}
                </Button>
                <Button
                  onClick={handleUpdateWidget}
                  disabled={!queryResult}
                  variant="primary"
                >
                  Save Chart
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DashboardView;
