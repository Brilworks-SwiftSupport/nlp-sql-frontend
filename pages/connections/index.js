// pages/connections/index.js
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/layout/Layout";
import ConnectionCard from "../../components/connections/ConnectionCard";
import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import { connectionAPI } from "../../lib/api";
import { withAuth } from "../../lib/auth";
import { queryAPI } from "../../lib/api";

const ConnectionsPage = () => {
  const router = useRouter();
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentQueries, setRecentQueries] = useState([]);
  const [visibleConnections, setVisibleConnections] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  useEffect(() => {
    // Fetch connections and recent queries
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch connections
        const connectionsResponse = await connectionAPI.getAll();
        if (connectionsResponse.status === "success") {
          // Sort connections by created_at in descending order
          const sortedConnections = connectionsResponse.connections.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          
          setConnections(sortedConnections);
          sessionStorage.setItem(
            "connections",
            JSON.stringify(sortedConnections)
          );
        } else {
          setError(connectionsResponse.message || "Failed to fetch connections");
          return;
        }

        // Fetch recent queries using the correct method
        const queriesResponse = await queryAPI.getHistory();
        if (queriesResponse.status === "success") {
          setRecentQueries(queriesResponse.history.slice(0, 5));
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(
          err.response?.data?.message ||
            "An error occurred while fetching data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sort connections whenever they change
  const sortedConnections = useMemo(() => {
    return [...connections].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
  }, [connections]);

  // Calculate pagination values after sortedConnections is defined
  const totalPages = Math.ceil(sortedConnections.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setVisibleConnections(page * itemsPerPage);
  };

  const handleFirstPage = () => {
    setCurrentPage(1);
    setVisibleConnections(itemsPerPage);
  };

  const handleLastPage = () => {
    setCurrentPage(totalPages);
    setVisibleConnections(sortedConnections.length);
  };

  // Generate page numbers array
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleShowMore = () => {
    setVisibleConnections(prev => prev + itemsPerPage);
  };

  const handleShowAll = () => {
    setVisibleConnections(sortedConnections.length);
  };

  const handleShowFirst = () => {
    setVisibleConnections(itemsPerPage);
  };

  return (
    <Layout>
      <Head>
        <title>Database Connections - NLP SQL Bot</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">
              Database Connections
            </h1>
            <Link href="/connections/new">
              <Button
                variant="primary"
                icon={
                  <svg
                    className="-ml-1 mr-2 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
              >
                Add Connection
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {error && <Alert type="error" message={error} className="mt-4" />}

          {isLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white shadow rounded-lg p-6">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-blue-400 h-12 w-12"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {sortedConnections.slice(startIndex, endIndex).map((connection) => (
                  <ConnectionCard 
                    key={connection.id} 
                    connection={{
                      ...connection,
                      created_at_formatted: new Date(connection.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    }} 
                  />
                ))}

                {connections.length === 0 && (
                  <div className="col-span-full bg-white shadow rounded-lg p-6 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No connections
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by creating a new database connection.
                    </p>
                    <div className="mt-6">
                      <Link href="/connections/new">
                        <Button
                          variant="primary"
                          icon={
                            <svg
                              className="-ml-1 mr-2 h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          }
                        >
                          New Connection
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
              
              {sortedConnections.length > itemsPerPage && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <button
                    onClick={handleFirstPage}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 text-sm font-medium ${
                      currentPage === 1
                        ? 'text-gray-400 border-gray-200'
                        : 'text-blue-600 border-blue-600 hover:bg-blue-50'
                    } bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    &#171;
                  </button>

                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-600 bg-white border border-blue-600 hover:bg-blue-50'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={handleLastPage}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 text-sm font-medium ${
                      currentPage === totalPages
                        ? 'text-gray-400 border-gray-200'
                        : 'text-blue-600 border-blue-600 hover:bg-blue-50'
                    } bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    &#187;
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Recent Queries Section */}
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Recent Queries
            </h1>

            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {recentQueries.map((query) => (
                  <li key={query.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {query.natural_language_query}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              query.successful
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {query.successful ? "Success" : "Failed"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Connection ID: {query.connection_id}
                          </p>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <p>
                            {new Date(query.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <pre className="mt-1 text-sm text-gray-600 overflow-x-auto bg-gray-50 p-2 rounded">
                          {query.sql_query}
                        </pre>
                      </div>
                    </div>
                  </li>
                ))}

                {recentQueries.length === 0 && (
                  <li>
                    <div className="px-4 py-5 sm:px-6 text-center">
                      <p className="text-gray-500">No recent queries found.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Start querying your databases to see your query history.
                      </p>
                    </div>
                  </li>
                )}
              </ul>

              {recentQueries.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
                  <Link
                    href="/queries/history"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View all queries
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default withAuth(ConnectionsPage);
