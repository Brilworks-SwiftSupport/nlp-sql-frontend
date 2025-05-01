// pages/dashboard.js
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Layout from "../../components/layout/Layout";
import { queryAPI } from "../../lib/api";

export default function Dashboard() {
  const router = useRouter();
  const [recentQueries, setRecentQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [collections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const queriesResponse = await queryAPI.getHistory();
        if (queriesResponse.status === "success") {
          setRecentQueries(queriesResponse.history);
          // Extract unique collections
          const uniqueConnections = [
            ...new Set(
              queriesResponse.history.map((query) => query.connection_name)
            ),
          ];
          setConnections(uniqueConnections);
          setFilteredQueries(queriesResponse.history);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load dashboard data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    if (selectedConnection === "all") {
      setFilteredQueries(recentQueries);
    } else {
      const filtered = recentQueries.filter(
        (query) => query.connection_name === selectedConnection
      );
      setFilteredQueries(filtered);
    }
  }, [selectedConnection, recentQueries]);

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
        <title>Query History - NLP SQL Bot</title>
      </Head>

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Filter */}
          <div className="mb-6">
            <label
              htmlFor="collection"
              className="block text-sm font-medium text-gray-700"
            >
              Filter by Connection
            </label>
            <select
              id="collection"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              value={selectedConnection}
              onChange={(e) => setSelectedConnection(e.target.value)}
            >
              <option value="all">All Connections</option>
              {collections.map((collection) => (
                <option key={collection} value={collection}>
                  {collection}
                </option>
              ))}
            </select>
          </div>

          {/* Recent Queries Section */}
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Your Queries</h2>

            <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {filteredQueries.map((query) => (
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
                        <div className="sm:flex space-x-4">
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
                          <p className="flex items-center text-sm text-gray-500">
                            <svg
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                            </svg>
                            Connection Name: {query.connection_name}
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
                      <div className="mt-2">
                        <pre className="mt-1 text-sm text-gray-600 overflow-x-auto bg-gray-50 p-2 rounded">
                          {query.ai_response}
                        </pre>
                      </div>
                    </div>
                  </li>
                ))}

                {filteredQueries.length === 0 && (
                  <li>
                    <div className="px-4 py-5 sm:px-6 text-center">
                      <p className="text-gray-500">No queries found.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {selectedConnection === "all"
                          ? "Start querying your databases to see your query history."
                          : "No queries found for the selected collection."}
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
