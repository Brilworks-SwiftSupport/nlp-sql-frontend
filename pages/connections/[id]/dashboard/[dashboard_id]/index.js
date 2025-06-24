import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../../components/layout/Layout';
import Button from '../../../../../components/common/Button';
import Alert from '../../../../../components/common/Alert';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { dashboardAPI, queryAPI } from '../../../../../lib/api';
import { showSuccess, showError } from '../../../../../lib/toast';
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

const InsightsSection = ({ connectionId, dashboardId }) => {
  const router = useRouter();
  const exampleQuestions = useMemo(() => {
    // Fintech template questions
    // Fintech Id 120
    if (connectionId === "120" ) {
      return [
        "e.g. Break down loan disbursement by month in 2024",
        "e.g. Top 5 client by credit card spend in last quarter",
        "e.g. Total interest earned per month for last 6 months",
        "e.g. How many new accounts were opened in december 2023"
        
      ];
    }
    // Retail Tech template questions
    // Retail Tech Id 128
    else if (connectionId === "128") {
      return [
        "e.g. How many total orders have been placed in 2024?",
        "e.g. What is the total revenue generated?",
        "e.g. Which product categories have the highest sales?",
        "e.g. Top 10 products with the highest number of orders?"
      ];
    }
    else if (connectionId === "135") {
      return [
        "e.g. Which brand tyre you have?",
        "e.g. Give me type of tyres",
        "e.g. Model list of tyre",
        "e.g. What's my top revenue product by month?"
      ];
    }
    // Default general questions for other connection IDs
    else {
      return [
        "e.g. What's my top revenue product by month?",
        "e.g. Show loan disbursement by gender in 2024",
        "e.g. Display monthly active users trend",
        "e.g. Compare sales by region for Q1 2024"
      ];
    }
  }, [connectionId]);

  const handleQuestionClick = (question) => {
    // Redirect to edit dashboard with the question as a query parameter
    router.push({
      pathname: `/connections/${connectionId}/dashboard/${dashboardId}/edit`,
      query: { question: question.replace("e.g. ", "") }
    });
  };

  return (
    <div className="mb-6 bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h3 className="text-lg font-medium text-gray-900">Insights</h3>
          <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">NEW</span>
        </div>
        <button 
          onClick={() => router.push(`/connections/${connectionId}/dashboard/${dashboardId}/edit`)}
          className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
        >
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ask a Question
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {exampleQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => handleQuestionClick(question)}
            className="text-left px-3 py-2 bg-yellow-50 border border-yellow-100 rounded-md text-sm text-gray-700 hover:bg-yellow-100 transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

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
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [questionToAsk, setQuestionToAsk] = useState("");

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
      showError('Failed to delete widget. Please try again.');
    }
  };

  const formatFieldName = (fieldName) => {
    if (!fieldName) return '';
    // Handle snake_case and camelCase
    return fieldName
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  };

  const formatNumericValue = (value) => {
    if (value === null || value === undefined) return '';
    
    // Check if it's a number
    if (typeof value === 'number' || !isNaN(parseFloat(value))) {
      const num = parseFloat(value);
      
      // For large numbers, use the existing formatting in the ticks callback
      if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
      
      // Format with 2 decimal places for float values
      if (Math.floor(num) !== num) {
        return num.toFixed(2);
      }
    }
    
    return value.toString();
  };

  // Function to save layout to backend (only changed widgets)
  const saveLayout = async (newLayouts, oldLayouts) => {
    try {
      setIsSaving(true);
      
      // Get the current breakpoint's layout (typically 'lg' for large screens)
      const currentLayout = newLayouts.lg || Object.values(newLayouts)[0];
      
      // Create a map of the old layouts for comparison
      const oldLayoutMap = {};
      if (oldLayouts) {
        Object.values(oldLayouts).forEach(layout => {
          if (layout) {
            layout.forEach(item => {
              oldLayoutMap[item.i] = item;
            });
          }
        });
      }

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
        prevLayouts.current = JSON.parse(JSON.stringify(newLayouts));
        
        // Update the dashboard state with new positions
        setDashboard(prev => {
          if (!prev) return prev;
          
          const updatedWidgets = prev.widgets.map(widget => {
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
          
          return {
            ...prev,
            widgets: updatedWidgets
          };
        });
      } else {
        console.error('Failed to update layout:', response);
        setError('Failed to save layout changes');
        showError('Failed to save layout changes');
      }

    } catch (err) {
      console.error('Error saving layout:', err);
      setError('Failed to save layout changes');
      showError('Failed to save layout changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAskQuestion = (question) => {
    setQuestionToAsk(question);
    setIsAskingQuestion(true);
    setCurrentMessage(question);
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
        
        console.log('Initial layouts:', initialLayouts);
        setLayouts(initialLayouts);
        
        // Store a deep copy of the initial layouts as the previous layouts reference
        prevLayouts.current = JSON.parse(JSON.stringify(initialLayouts));
        
        // Mark initial load as complete after a short delay
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 500);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
        showError(err.response?.data?.message || err.message || 'Failed to load dashboard');
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
    const formattedLabel = formatFieldName(label);
    const formattedValue = formatNumericValue(value);

    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-sm text-gray-500">{formattedLabel}</p>
        <p className="text-4xl font-bold text-blue-600">{formattedValue}</p>
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

    // Use the chart type from the API response
    const chartType = widget.visualization_settings?.chartType || 'bar';
    
    // Use the axis fields from the API response
    const xAxisField = widget.visualization_settings?.axisFields?.xAxis || '';
    const yAxisField = widget.visualization_settings?.axisFields?.yAxis || '';
    
    // Extract colors from the API response if available
    const colors = {};
    if (chartData.datasets && chartData.datasets.length > 0) {
      chartData.datasets.forEach((dataset, index) => {
        colors[index] = {
          backgroundColor: dataset.backgroundColor || `hsla(${index * 137.5 % 360}, 70%, 50%, 0.6)`,
          borderColor: dataset.borderColor || `hsla(${index * 137.5 % 360}, 70%, 50%, 1)`
        };
      });
    }

    return (
      <div className="h-full">
        <ResultGraph
          data={chartData.data}
          title={widget.name}
          sql={widget.sql_query}
          maxHeight="100%"
          className="h-full"
          // Pass the visualization settings from the API
          initialChartType={chartType}
          initialXAxisField={xAxisField}
          initialYAxisField={yAxisField}
          initialColors={colors}
          // Disable auto-detection of chart type and fields
          disableAutoDetection={true}
          // Hide controls in the main dashboard view
          hideControls={true}
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
    
    // Don't save layout changes immediately on every change
    // This will be handled by onDragStop and onResizeStop
    setLayouts(layouts);
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
    
    // Update layouts state
    setLayouts(layouts);
    
    // Save layout changes to backend
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
    
    // Update layouts state
    setLayouts(layouts);
    
    // Save layout changes to backend
    saveLayout(layouts, prevLayouts.current);
  };

  const handleQueryExecution = async (query) => {
    try {
      setIsExecuting(true);
      const response = await queryAPI.executeQuery(connectionId, query);
      
      // Ensure the response includes chartPreferences
      if (response.status === 'success') {
        // Initialize chart preferences if not present
        if (!response.chartPreferences) {
          const data = response.result;
          if (data && data.length > 0) {
            const firstRow = data[0];
            const keys = Object.keys(firstRow);
            
            // Try to find numeric and non-numeric fields
            const numericFields = keys.filter(key => 
              !isNaN(parseFloat(firstRow[key])) && key !== 'id'
            );
            
            const nonNumericFields = keys.filter(key => 
              isNaN(parseFloat(firstRow[key])) || key === 'id'
            );
            
            // Set default chart preferences
            response.chartPreferences = {
              chartType: 'bar',
              xAxisField: nonNumericFields.length > 0 ? nonNumericFields[0] : keys[0],
              yAxisField: numericFields.length > 0 ? numericFields[0] : (keys.length > 1 ? keys[1] : keys[0]),
              colors: {
                0: {
                  backgroundColor: 'hsla(210, 70%, 50%, 0.6)',
                  borderColor: 'hsla(210, 70%, 50%, 1)'
                }
              },
              showLegend: false
            };
          }
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isExecuting) return;
    
    // Add user message to chat
    const userMessage = {
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsExecuting(true);
    
    try {
      const response = await handleQueryExecution(userMessage.content);
      
      // Update latest query result for the save button
      setQueryResult(response);
      
      const systemMessage = {
        type: 'system',
        content: response.status === 'success' 
          ? 'Here are the results for your query.'
          : response.message || 'Sorry, I could not process your query.',
        timestamp: new Date().toISOString(),
        queryResult: response.status === 'success' ? {
          result: response.result,
          sql_query: response.sql_query,
          natural_language_query: userMessage.content,
          chartPreferences: {
            chartType: response.chartPreferences?.chartType || 'bar',
            xAxisField: response.chartPreferences?.xAxisField || '',
            yAxisField: response.chartPreferences?.yAxisField || '',
            colors: response.chartPreferences?.colors || {},
            showLegend: response.chartPreferences?.showLegend || false
          }
        } : null
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
    } finally {
      setIsExecuting(false);
    }
  };

  const handleUpdateWidget = async () => {
    if (!queryResult || !selectedWidget) return;

    try {
      // Get the last user message from the messages array
      const lastUserMessage = messages
        .filter(msg => msg.type === 'user')
        .pop()?.content;

      // Use the last message or fall back to existing values
      const widgetName = lastUserMessage || selectedWidget.name;
      const naturalLanguageQuery = lastUserMessage || selectedWidget.natural_language_query;

      if (!widgetName || !naturalLanguageQuery) {
        setError('Widget name and query cannot be empty');
        return;
      }

      // Get chart preferences from the queryResult - these will include any user changes
      const chartPreferences = queryResult.chartPreferences || {};
      
      // Use chart type from preferences or fall back to existing or default
      const chartType = chartPreferences.chartType || 
                        selectedWidget.visualization_settings?.chartType || 
                        'bar';
      
      // Get axis fields from preferences or fall back to existing values
      const xAxisField = chartPreferences.xAxisField || 
                         selectedWidget.visualization_settings?.axisFields?.xAxis || 
                         '';
      const yAxisField = chartPreferences.yAxisField || 
                         selectedWidget.visualization_settings?.axisFields?.yAxis || 
                         '';
      
      // Get colors from preferences or fall back to existing values
      const colors = chartPreferences.colors || {};
      
      // Create datasets with colors
      const datasets = [];
      if (queryResult.result && queryResult.result.length > 0) {
        // For doughnut charts or single value metrics
        if (chartType === 'doughnut' && queryResult.result.length === 1) {
          const firstRow = queryResult.result[0];
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
            label: formatFieldName(yAxisField),
            data: queryResult.result.map(row => row[yAxisField]),
            backgroundColor: colors[0]?.backgroundColor || 'hsla(210, 70%, 50%, 0.6)',
            borderColor: colors[0]?.borderColor || 'hsla(210, 70%, 50%, 1)',
            borderWidth: 1
          });
        }
      }

      const chartData = {
        type: chartType,
        data: queryResult.result,
        datasets: datasets,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: chartPreferences.showLegend || false
            },
            title: {
              display: true,
              text: widgetName
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      };

      // Structure the update data to match the backend expectations
      const updateData = {
        name: widgetName,
        widget_type: selectedWidget.widget_type || 'chart',
        natural_language_query: naturalLanguageQuery,
        sql_query: queryResult.sql_query,
        visualization_settings: {
          chartType: chartType,
          chartData: chartData,
          axisFields: {
            xAxis: xAxisField,
            yAxis: yAxisField
          }
        },
        position: selectedWidget.position,
        size: selectedWidget.size,
        refresh_interval: selectedWidget.refresh_interval || 0
      };

      // Log the data being sent for debugging
      console.log('Sending update data:', updateData);

      const response = await dashboardAPI.updateWidget(selectedWidget.id, updateData);
      
      if (response.status === 'success') {
        // Show success message
        showSuccess('Widget updated successfully');
        
        // Close the popup
        handleClosePopup();
        
        // Refresh the page to ensure all changes are reflected
        setTimeout(() => {
          window.location.reload();
        }, 500); // Short delay to allow the success message to be seen
      } else {
        throw new Error(response.message || 'Failed to update widget');
      }
    } catch (err) {
      console.error('Error updating widget:', err);
      setError(err.message || 'Failed to update widget');
      showError(err.message || 'Failed to update widget');
    }
  };

  const handleClosePopup = () => {
    setIsEditPopupOpen(false);
    setSelectedWidget(null);
    setMessages([]);
    setCurrentMessage('');
    setQueryResult(null);
  };

  const handleEditWidget = (widget) => {
    setSelectedWidget(widget);
    setCurrentMessage(widget.natural_language_query || widget.name || '');
    
    // Extract visualization settings from the widget
    const chartType = widget.visualization_settings?.chartType || 'bar';
    const xAxisField = widget.visualization_settings?.axisFields?.xAxis || '';
    const yAxisField = widget.visualization_settings?.axisFields?.yAxis || '';
    
    // Extract colors from the widget's visualization settings
    const colors = {};
    if (widget.visualization_settings?.chartData?.datasets) {
      widget.visualization_settings.chartData.datasets.forEach((dataset, index) => {
        colors[index] = {
          backgroundColor: dataset.backgroundColor || `hsla(${index * 137.5 % 360}, 70%, 50%, 0.6)`,
          borderColor: dataset.borderColor || `hsla(${index * 137.5 % 360}, 70%, 50%, 1)`
        };
      });
    }
    
    // Set query result with all the visualization preferences
    setQueryResult({
      result: widget.visualization_settings?.chartData?.data || [],
      sql_query: widget.sql_query,
      chartPreferences: {
        chartType: chartType,
        xAxisField: xAxisField,
        yAxisField: yAxisField,
        colors: colors,
        showLegend: widget.visualization_settings?.chartData?.options?.plugins?.legend?.display || false
      }
    });
    
    // Initialize messages with the current widget data
    setMessages([
      {
        type: 'user',
        content: widget.natural_language_query || widget.name,
        timestamp: new Date().toISOString()
      },
      {
        type: 'system',
        content: 'Current widget visualization:',
        timestamp: new Date().toISOString(),
        queryResult: {
          result: widget.visualization_settings?.chartData?.data || [],
          sql_query: widget.sql_query,
          natural_language_query: widget.natural_language_query || widget.name,
          chartPreferences: {
            chartType: chartType,
            xAxisField: xAxisField,
            yAxisField: yAxisField,
            colors: colors,
            showLegend: widget.visualization_settings?.chartData?.options?.plugins?.legend?.display || false
          }
        }
      }
    ]);
    
    setIsEditPopupOpen(true);
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

          {/* Insights Section */}
          <InsightsSection 
            connectionId={connectionId}
            dashboardId={dashboardId}
          />

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
                
                // Format the field name for single value display
                const formattedFieldName = isSingleValue ? 
                  formatFieldName(Object.keys(chartData.data[0])[0]) : '';
                
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
                          handleEditWidget(widget);
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
                      {isSingleValue ? renderMetricDisplay(widget, formattedFieldName) : renderChart(widget)}
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
      {(isEditPopupOpen || isAskingQuestion) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl m-4 flex flex-col max-h-[90vh] relative">
            {/* Loading Overlay */}
            {isExecuting && (
              <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Executing query...</p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900">
                  {isEditPopupOpen ? "Edit Widget" : "Ask a Question"}
                </h2>
                <button
                  onClick={() => {
                    if (isEditPopupOpen) handleClosePopup();
                    setIsAskingQuestion(false);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Current Query Display */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Current Query:</p>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap break-words">
                    {selectedWidget.natural_language_query || selectedWidget.name}
                  </p>
                </div>
              </div>

              {/* Messages and Graphs Display */}
              <div className="mb-6 space-y-6">
                {messages.map((message, index) => (
                  <div key={index}>
                    {/* Message */}
                    <div className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                      <div
                        className={`inline-block p-3 rounded-lg max-w-[80%] break-words ${
                          message.type === 'user'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>

                    {/* Graph for system messages with query results */}
                    {message.type === 'system' && message.queryResult && (
                      <div className="mt-4 bg-gray-50 rounded-lg p-4" style={{ height: '300px' }}>
                        <ResultGraph
                          data={message.queryResult.result}
                          sql={message.queryResult.sql_query}
                          maxHeight="100%"
                          // Pass the visualization settings from the API
                          initialChartType={message.queryResult.chartPreferences?.chartType}
                          initialXAxisField={message.queryResult.chartPreferences?.xAxisField}
                          initialYAxisField={message.queryResult.chartPreferences?.yAxisField}
                          initialColors={message.queryResult.chartPreferences?.colors}
                          // Disable auto-detection to use the API settings
                          disableAutoDetection={false}
                          // Show controls in the popup
                          hideControls={false}
                          // Add callback to capture chart preference changes
                          onChartPreferencesChange={(preferences) => {
                            // Update the queryResult with the new preferences
                            setQueryResult(prev => ({
                              ...prev,
                              chartPreferences: preferences
                            }));
                            
                            // Also update the message's queryResult to reflect changes
                            setMessages(prev => prev.map((msg, idx) => 
                              idx === index && msg.type === 'system' && msg.queryResult
                                ? {
                                    ...msg,
                                    queryResult: {
                                      ...msg.queryResult,
                                      chartPreferences: preferences
                                    }
                                  }
                                : msg
                            ));
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 shrink-0">
              <div className="flex flex-col space-y-3">
                <div className="relative flex-1">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => {
                      setCurrentMessage(e.target.value);
                      // Reset height to auto first to get the correct scrollHeight
                      e.target.style.height = 'auto';
                      // Add some extra padding to prevent scrollbar flashing
                      e.target.style.height = `${e.target.scrollHeight + 2}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isExecuting && currentMessage.trim()) {
                          handleSendMessage();
                        }
                      }
                    }}
                    placeholder="Ask a question..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    disabled={isExecuting}
                    rows={1}
                    style={{
                      resize: 'none',
                      minHeight: '56px',
                      lineHeight: '1.5',
                      display: 'block',
                      width: '100%',
                      boxSizing: 'border-box',
                      whiteSpace: 'pre-wrap',
                      overflowY: 'hidden', // Hide scrollbar but allow content to expand
                      wordBreak: 'break-word',
                      fontFamily: 'inherit',
                      paddingBottom: '8px'
                    }}
                  />
                  <div className="text-xs text-gray-500 mt-1 flex justify-between items-center">
                    <span>Press Shift + Enter for new line, Enter to submit</span>
                    <span>{currentMessage.length} characters</span>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={handleSendMessage}
                    disabled={isExecuting || !currentMessage.trim()}
                    className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                      isExecuting || !currentMessage.trim()
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isExecuting ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Execute Query</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleUpdateWidget}
                    disabled={!queryResult || isExecuting}
                    className={`px-4 py-2 rounded-lg ${
                      !queryResult || isExecuting
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    Save Chart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default DashboardView;
