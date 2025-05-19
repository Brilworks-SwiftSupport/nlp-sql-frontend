// pages/dashboard.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Layout from "../components/layout/Layout";
import { connectionAPI, dashboardAPI } from "../lib/api";

// Add these template definitions at the top of your component
const connectionTemplates = [
  {
    id: 120, // For production
    // id: 35,
    name: "Fintech",
    type: "Template",
    database: "Banking & Payments",
    description: "Templates for banking, payments, investments, and more.",
    icon: (
      <svg className="h-8 w-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    id: 128, // For production
    // id: 37,
    name: "Retail Tech",
    type: "Template",
    database: "E-commerce & POS",
    description: "Templates for e-commerce, POS, inventory, analytics.",
    icon: (
      <svg className="h-8 w-8 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
      </svg>
    )
  }
];

export default function Dashboard() {
  const router = useRouter();
  const [showConnectionSelector, setShowConnectionSelector] = useState(false);
  const [connections, setConnections] = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, date, connection

  const handleDashboardDelete = (deletedDashboardId) => {
    setDashboards(prevDashboards => 
      prevDashboards.filter(dashboard => dashboard.id !== deletedDashboardId)
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    let mounted = true;

    const fetchDashboards = async (retryCount = 0) => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await dashboardAPI.getAllDashboards();
        
        if (mounted && response.status === 'success') {
          // If we get an empty array but we know there should be dashboards,
          // retry after a short delay (but only up to 2 times)
          if (response.dashboards.length === 0 && retryCount < 2) {
            console.log(`Received empty dashboards array, retrying (${retryCount + 1}/3)...`);
            setTimeout(() => {
              if (mounted) {
                fetchDashboards(retryCount + 1);
              }
            }, 1000); // Wait 1 second before retrying
            return;
          }
          
          setDashboards(response.dashboards);
        }
      } catch (err) {
        if (mounted) {
          console.error('Error fetching dashboards:', err);
          setError(err.response?.data?.message || "Failed to load dashboards");
          setDashboards([]);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchDashboards();
    
    return () => {
      mounted = false;
    };
  }, [router]);

  const filteredAndSortedDashboards = () => {
    let filtered = dashboards.filter(dashboard =>
      dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dashboard.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dashboard.connection.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return new Date(b.created_at) - new Date(a.created_at);
        case "connection":
          return a.connection.name.localeCompare(b.connection.name);
        default:
          return 0;
      }
    });
  };

  const DashboardCard = ({ dashboard, onDelete }) => {
    const handleDelete = async (e) => {
      e.preventDefault(); // Prevent clicking through to the dashboard view
      e.stopPropagation();
      
      if (!confirm('Are you sure you want to delete this dashboard? This action cannot be undone.')) {
        return;
      }

      try {
        const response = await dashboardAPI.deleteDashboard(dashboard.id);
        if (response.status === 'success') {
          onDelete(dashboard.id);
        }
      } catch (err) {
        console.error('Error deleting dashboard:', err);
        alert('Failed to delete dashboard. Please try again.');
      }
    };

    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 rounded-lg p-2">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              {dashboard.is_public && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Public
                </span>
              )}
            </div>
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Delete dashboard"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <Link href={`/connections/${dashboard.connection.id}/dashboard/${dashboard.id}`}>
            <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
              {dashboard.name}
            </h3>
          </Link>

          {dashboard.description && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
              {dashboard.description}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                </svg>
                <span>{dashboard.connection.name}</span>
              </div>
            </div>
            
            <Link 
              href={`/connections/${dashboard.connection.id}/dashboard/${dashboard.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Add new useEffect specifically for fetching connections
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await connectionAPI.getConnections();
        console.log('Connections response:', response); // Debug log
        if (response.status === 'success') {
          setConnections(response.connections);
        } else {
          console.error('Failed to fetch connections:', response);
        }
      } catch (err) {
        console.error('Error fetching connections:', err);
        setError(err.response?.data?.message || "Failed to load connections");
      }
    };

    // Fetch connections when modal is opened
    if (showConnectionSelector) {
      fetchConnections();
    }
  }, [showConnectionSelector]);

  const handleConnectionSelect = async (connectionId) => {
    setShowConnectionSelector(false);
    
    // Find if this is a template from our templates array
    const isTemplate = connectionTemplates.some(template => template.id === connectionId);
    
    // Check if this is a template selection
    if (isTemplate) {
      try {
        setIsLoading(true);
        
        // Find the selected template
        const selectedTemplate = connectionTemplates.find(template => template.id === connectionId);
        
        if (!selectedTemplate) {
          throw new Error("Template not found");
        }
        
        // Generate a unique name with a random number to avoid duplicates
        const randomNum = Math.floor(Math.random() * 100);
        const dashboardName = `${selectedTemplate.name} Dashboard ${randomNum}`;
        
        // Create dashboard using the API
        const response = await dashboardAPI.create({
          connection_id: selectedTemplate.id, // Use template ID as connection ID
          name: dashboardName,
          description: `Auto-generated dashboard using the ${selectedTemplate.name} template.`,
          is_public: false,
          layout: {},
          template_type: selectedTemplate.id // Add template type for reference
        });
        
        if (response && response.dashboard && response.dashboard.id) {
          // Redirect to the dashboard details page
          router.push(`/connections/${selectedTemplate.id}/dashboard/${response.dashboard.id}`);
        } else {
          throw new Error("Failed to create dashboard from template");
        }
      } catch (err) {
        console.error("Error creating dashboard from template:", err);
        setError("Failed to create dashboard from template. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle regular connection selection
      router.push(`/connections/${connectionId}/dashboard/new`);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Dashboards - NLP SQL Bot</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header */}
          <div className="md:flex md:items-center md:justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-gray-900">Dashboards</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and analyze your data through interactive dashboards
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowConnectionSelector(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Create Dashboard
              </button>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex-1 max-w-lg">
                <div className="relative">
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search dashboards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-sm text-gray-700">Sort by:</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">Name</option>
                  <option value="date">Date Created</option>
                  <option value="connection">Connection</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              Array(3).fill(null).map((_, index) => (
                <div key={index} className="bg-white rounded-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))
            ) : filteredAndSortedDashboards().length > 0 ? (
              filteredAndSortedDashboards().map((dashboard) => (
                <DashboardCard 
                  key={dashboard.id} 
                  dashboard={dashboard}
                  onDelete={handleDashboardDelete}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No dashboards found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? "Try adjusting your search terms" : "Get started by creating a new dashboard"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Selector Modal */}
      {showConnectionSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900">Creating Dashboard</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Please wait while we set up your dashboard...
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Choose a Template</h2>
                  <button
                    onClick={() => setShowConnectionSelector(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-4 text-center">
                  Pick a template category to jumpstart your dashboard.
                </p>

                {/* Template Options */}
                <div className="space-y-3 mb-6">
                  {connectionTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleConnectionSelect(template.id)}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div className="mr-3">
                          {template.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-500">
                            {template.description}
                          </div>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>

                {/* Existing Connections Section */}
                {connections.length > 0 && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or use existing connection</span>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {connections.map((connection) => (
                        <button
                          key={connection.id}
                          onClick={() => handleConnectionSelect(connection.id)}
                          className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <div className="font-medium text-gray-900">{connection.name}</div>
                          <div className="text-sm text-gray-500">
                            {connection.type} • {connection.database}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {connections.length === 0 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/connections/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Custom Connection
                    </Link>
                  </div>
                )}

                {/* Back Button */}
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowConnectionSelector(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="mr-2 -ml-1 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
