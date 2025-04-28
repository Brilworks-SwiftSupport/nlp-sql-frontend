import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../../../../components/layout/Layout';
import Button from '../../../../../components/common/Button';
import Alert from '../../../../../components/common/Alert';
import { dashboardAPI } from '../../../../../lib/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
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

  // Function to save layout to backend (only changed widgets)
  const saveLayout = async (newLayouts, oldLayouts) => {
    try {
      setIsSaving(true);
      // Only include widgets whose position or size has changed
      const changedWidgets = Object.values(newLayouts)
        .filter(layout => {
          const prev = oldLayouts[layout.i];
          return !prev || prev.x !== layout.x || prev.y !== layout.y || prev.w !== layout.w || prev.h !== layout.h;
        })
        .filter(layout => layout.i && !isNaN(parseInt(layout.i)))
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
      if (changedWidgets.length === 0) return; // No changes
      const layout = { widgets: changedWidgets };
      await dashboardAPI.updateLayout(dashboardId, layout);
      // Update dashboard state for changed widgets only
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
      setLayouts(newLayouts);
      prevLayouts.current = { ...newLayouts };
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

  // Function to render a bar chart for time series data
  const renderBarChart = (widget) => {
    const chartData = widget.visualization_settings?.chartData;
    if (!chartData) return null;

    const data = {
      labels: chartData.labels,
      datasets: [{
        label: widget.name,
        data: chartData.labels,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };

    const options = {
      ...chartData.options,
      maintainAspectRatio: false,
      responsive: true,
      plugins: {
        ...chartData.options.plugins,
        legend: {
          display: false
        }
      },
      layout: {
        padding: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20
        }
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: true
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            padding: 10
          }
        },
        y: {
          display: true,
          grid: {
            display: true
          },
          ticks: {
            padding: 10
          }
        }
      }
    };

    return (
      <div className="h-full p-6 flex flex-col">
        <div className="flex-1 relative">
          <Bar data={data} options={options} />
        </div>
      </div>
    );
  };

  // Only call saveLayout if not initial load and if there are changes
  const onLayoutChange = (layout, layouts) => {
    if (isInitialLoad.current) return;
    saveLayout(layouts, prevLayouts.current);
  };

  // Function to handle widget resize
  const handleResize = (layout, oldItem, newItem) => {
    // Update the layout state immediately
    const updatedLayouts = { ...layouts };
    updatedLayouts[newItem.i] = {
      ...newItem,
      minW: 1,
      minH: 1,
      maxW: 3,
      maxH: Infinity
    };
    setLayouts(updatedLayouts);
    // Save the changes
    saveLayout(updatedLayouts, prevLayouts.current);
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
          <div className="relative min-h-[500px] overflow-auto rounded-lg bg-white shadow">
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 3, md: 3, sm: 3, xs: 3, xxs: 3 }}
              rowHeight={150}
              onLayoutChange={onLayoutChange}
              onResize={handleResize}
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
            >
              {dashboard?.widgets?.map((widget) => {
                const chartData = widget.visualization_settings?.chartData;
                const isSingleValue = chartData?.data?.length === 1 && 
                  Object.keys(chartData.data[0]).length === 1;
                
                return (
                  <div 
                    key={widget.id}
                    className="bg-white shadow rounded-lg overflow-hidden h-full"
                  >
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        {widget.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {widget.natural_language_query}
                      </p>
                    </div>
                    <div className="h-[calc(100%-80px)] overflow-auto">
                      {isSingleValue ? renderMetricDisplay(widget) : renderBarChart(widget)}
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
    </Layout>
  );
};

export default DashboardView;