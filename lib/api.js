// lib/api.js
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001/api";

console.log("Using API URL:", API_URL); // For debugging


// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Disable withCredentials for CORS - we'll use Authorization header instead

  withCredentials: false,
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    console.log("Making API request to:", config.url); // For debugging
    const token = localStorage.getItem("token");
    if (token) {
      console.log("Token found, adding to headers"); // Debug token presence
      config.headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.log("No token found in localStorage"); // Debug token absence
    }
    console.log("Request headers:", config.headers); // Debug final headers
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized) by redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Response error:", error);

    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if in browser
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (email, password, name) => {
    // Direct axios call with minimal configuration
    const response = await axios({
      method: "post",
      url: `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      data: { email, password, name },
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

// Database Connection APIs
export const connectionAPI = {
  getConnections: async () => {
    try {
      const response = await api.get("/connections");
      return {
        status: "success",
        connections: response.data.connections || [],
      };
    } catch (error) {
      console.error("Error in getConnections:", error);
      return {
        status: "error",
        message: error.response?.data?.message || "Failed to fetch connections",
        connections: [],
      };
    }
  },

  getConnection: async (connectionId) => {
    try {
      // First, get the basic connection details
      const response = await api.get(`/connections/${connectionId}`);

      if (response.data.status === "success") {
        // Then, get the schema for the connection
        const schemaResponse = await api.get(
          `/connections/${connectionId}/tables`
        );

        if (
          schemaResponse.data.status === "success" &&
          schemaResponse.data.tables
        ) {
          // Transform the tables data into the schema format
          const schemaData = {};

          for (const table of schemaResponse.data.tables) {
            if (!table || !table.name) {
              console.warn("Skipping table without name:", table);
              continue;
            }

            const columns = [];
            if (table.columns && Array.isArray(table.columns)) {
              for (const col of table.columns) {
                if (col && col.name) {
                  columns.push({
                    name: col.name,
                    type: col.data_type || "unknown",
                    is_primary_key: col.is_primary_key || false,
                  });
                }
              }
            }

            schemaData[table.name] = {
              name: table.name,
              columns: columns,
            };
          }

          // Include the schema data with the connection
          return {
            status: "success",
            connection: {
              ...response.data.connection,
              schema: schemaData,
            },
          };
        } else {
          // Return just the connection without schema if we couldn't get schema
          console.warn("Could not load schema for connection:", connectionId);
          return response.data;
        }
      } else {
        // If basic connection details couldn't be fetched, return the error
        return response.data;
      }
    } catch (error) {
      console.error("Error in getConnection:", error);
      return {
        status: "error",
        message:
          error.response?.data?.message ||
          "An error occurred while fetching connection details",
      };
    }
  },

  create: async (connectionData) => {
    // Prepare connection payload
    const payload = {
      name: connectionData.name,
      description: connectionData.description,
      db_type: connectionData.db_type,
      host: connectionData.host,
      port: connectionData.port,
      username: connectionData.username,
      password: connectionData.password,
      database: connectionData.database,
      db_schema: connectionData.db_schema,
      selected_tables: connectionData.selected_tables || [],
      selected_columns: connectionData.selected_columns || {},
      // Add SSH configuration
      ssh_enabled: connectionData.ssh_enabled || false,
      ssh_config: connectionData.ssh_enabled
        ? {
            host: connectionData.ssh_host,
            port: connectionData.ssh_port,
            username: connectionData.ssh_username,
            auth_method: connectionData.ssh_auth_method,
            // Include either password or private key based on auth method
            ...(connectionData.ssh_auth_method === "password"
              ? { password: connectionData.ssh_password }
              : { private_key: connectionData.ssh_private_key }),
          }
        : null,
    };

    try {
      const response = await api.post("/connections", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating connection:", error);
      return {
        status: "error",
        message: error.response?.data?.message || "Failed to create connection",
        error: error.response?.data,
      };
    }
  },

  updateConnection: async (connectionId, connectionData) => {
    // Prepare update payload
    const payload = {
      name: connectionData.name,
      description: connectionData.description,
      db_type: connectionData.db_type,
      host: connectionData.host,
      port: connectionData.port,
      username: connectionData.username,
      // Only include password if it's been changed (not empty)
      ...(connectionData.password && { password: connectionData.password }),
      database: connectionData.database,
      db_schema: connectionData.db_schema,
      // Add SSH configuration
      ssh_enabled: connectionData.ssh_enabled || false,
      ssh_config: connectionData.ssh_enabled
        ? {
            host: connectionData.ssh_host,
            port: connectionData.ssh_port,
            username: connectionData.ssh_username,
            auth_method: connectionData.ssh_auth_method,
            // Include either password or private key based on auth method
            ...(connectionData.ssh_auth_method === "password"
              ? { password: connectionData.ssh_password }
              : { private_key: connectionData.ssh_private_key }),
            // Only include credentials if they've been changed (not empty)
            ...(connectionData.ssh_password && {
              password: connectionData.ssh_password,
            }),
            ...(connectionData.ssh_private_key && {
              private_key: connectionData.ssh_private_key,
            }),
          }
        : null,
    };

    try {
      const response = await api.put(`/connections/${connectionId}`, payload);
      return response.data;
    } catch (error) {
      console.error("Error updating connection:", error);
      return {
        status: "error",
        message: error.response?.data?.message || "Failed to update connection",
        error: error.response?.data,
      };
    }
  },

  updateConnectionSchema: async (connectionId, schemaData) => {
    if (!connectionId) {
      console.error("Connection ID is missing for updateConnectionSchema!");
      return {
        status: "error",
        message: "Connection ID is required to update schema",
      };
    }

    console.log(
      `Updating connection schema for ID: ${connectionId}`,
      schemaData
    );
    try {
      const response = await api.put(
        `/connections/${connectionId}/metadata`,
        schemaData
      );
      console.log("Update connection schema response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating connection schema:", error);
      return {
        status: "error",
        message:
          error.response?.data?.message || "Failed to update connection schema",
      };
    }
  },

  deleteConnection: async (connectionId) => {
    const response = await api.delete(`/connections/${connectionId}`);
    return response.data;
  },

  test: async (connectionId) => {
    const response = await api.get(`/connections/${connectionId}/test`);
    return response.data;
  },

  testConnection: async (connectionData) => {
    // Prepare test connection payload
    const payload = {
      db_type: connectionData.db_type,
      host: connectionData.host,
      port: connectionData.port,
      username: connectionData.username,
      password: connectionData.password,
      database: connectionData.database,
      db_schema: connectionData.db_schema,
      test_only: true,
      // Add SSH configuration for testing
      ssh_enabled: connectionData.ssh_enabled || false,
      ssh_config: connectionData.ssh_enabled
        ? {
            host: connectionData.ssh_host,
            port: connectionData.ssh_port,
            username: connectionData.ssh_username,
            auth_method: connectionData.ssh_auth_method,
            // Include either password or private key based on auth method
            ...(connectionData.ssh_auth_method === "password"
              ? { password: connectionData.ssh_password }
              : { private_key: connectionData.ssh_private_key }),
          }
        : null,
    };

    try {
      const response = await api.post("/connections/test", payload);
      return response.data;
    } catch (error) {
      console.error("Error testing connection:", error);
      return {
        status: "error",
        message: error.response?.data?.message || "Connection test failed",
        error: error.response?.data,
      };
    }
  },

  getTables: async (connectionId) => {
    console.log("getTables called with connectionId:", connectionId);

    try {
      // Use new simplified API endpoint to avoid the "Not enough segments" error
      const response = await api.get(
        `/get-tables-by-connection/${connectionId}`
      );
      console.log("Tables API response:", response.data);
      return response.data;

      /* For debugging: Use mock data
      console.log('Using mock table data for debugging');
      return {
        status: 'success',
        tables: [
          { name: 'users', type: 'table' },
          { name: 'products', type: 'table' },
          { name: 'orders', type: 'table' },
          { name: 'categories', type: 'table' }
        ]
      };
      */
    } catch (error) {
      console.error("Error in getTables:", error);
      return {
        status: "error",
        message: error.response?.data?.message || "Failed to retrieve tables",
      };
    }
  },

  getConnectionMetadata: async (connectionId) => {
    try {
      const response = await api.get(`/connections/${connectionId}/metadata`);
      console.log("Retrieved connection metadata:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error getting connection metadata:", error);
      return {
        status: "error",
        message:
          error.response?.data?.message || "Error fetching connection metadata",
        metadata: {
          selected_tables: [],
          selected_columns: {},
          relationships: [],
        },
      };
    }
  },

  fetchSchema: async (connectionData) => {
    // We need to first test the connection, which is working
    const testResponse = await api.post("/connections", {
      ...connectionData,
      test_only: true,
    });

    if (testResponse.data.status === "success") {
      // Since there's no direct schema fetch endpoint,
      // we'll create a temporary connection to get its tables
      const tempConnection = await api.post("/connections", {
        ...connectionData,
        name: `Temp_${Date.now()}`, // Unique name to identify temporary connection
        selected_tables: [], // Empty array to ensure minimum valid payload
        selected_columns: {},
      });

      if (tempConnection.data.status === "success") {
        const connectionId = tempConnection.data.connection.id;

        // Get tables for the connection
        const tablesResponse = await api.get(
          `/connections/${connectionId}/tables`
        );

        // Delete the temporary connection
        await api.delete(`/connections/${connectionId}`);

        // Return the tables in a format similar to what our component expects
        return {
          status: "success",
          schema: tablesResponse.data.tables.reduce((acc, table) => {
            acc[table.name] = {
              name: table.name,
              columns: table.columns.map((col) => ({
                name: col.name,
                type: col.data_type,
                is_primary_key: col.is_primary_key || false,
              })),
            };
            return acc;
          }, {}),
        };
      }
    }

    return {
      status: "error",
      message: "An error occurred while fetching database schema",
    };
  },

  getSchema: async (connectionId) => {
    try {
      // Try metadata endpoint first
      console.log("Trying metadata endpoint first");
      const metadataResponse = await api.get(
        `/connections/${connectionId}/metadata`
      );
      if (
        metadataResponse.data.status === "success" &&
        metadataResponse.data.schema
      ) {
        console.log("Successfully retrieved schema from metadata endpoint");
        return {
          status: "success",
          schema: metadataResponse.data.schema,
        };
      }

      // Fallback to tables endpoint
      console.log("Falling back to tables endpoint");
      const tablesResponse = await api.get(
        `/connections/${connectionId}/tables`
      );

      if (
        tablesResponse.data.status === "success" &&
        tablesResponse.data.tables
      ) {
        console.log(
          "Successfully retrieved tables:",
          tablesResponse.data.tables.length
        );

        // Process the tables data into a schema object
        const schema = {};

        // Organize tables and columns
        tablesResponse.data.tables.forEach((table) => {
          schema[table.name] = {
            name: table.name,
            columns: table.columns.map((col) => ({
              name: col.name,
              type: col.data_type || "unknown",
              is_primary_key: col.is_primary_key || false,
            })),
          };
        });

        return {
          status: "success",
          schema: schema,
        };
      } else {
        return {
          status: "error",
          message: tablesResponse.data.message || "No tables found",
        };
      }
    } catch (error) {
      console.error("Error fetching schema:", error);
      return {
        status: "error",
        message:
          error.response?.data?.message || "Failed to retrieve database schema",
      };
    }
  },

  storeSchema: async (connectionId, tables) => {
    const response = await api.post(`/connections/${connectionId}/schema`, {
      tables,
    });
    return response.data;
  },

  getSavedSchema: async (connectionId) => {
    const response = await api.get(`/connections/${connectionId}/schema`);
    return response.data;
  },

  getDashboards: async (connectionId) => {
    try {
      const response = await api.get(`/connections/${connectionId}/dashboards`);
      return {
        status: "success",
        dashboards: response.data.dashboards || [],
      };
    } catch (error) {
      console.error("Error fetching dashboards:", error);
      return {
        status: "error",
        message: error.response?.data?.message || "Failed to fetch dashboards",
        dashboards: [],
      };
    }
  },
};

// Query APIs
export const queryAPI = {
  // Keep track of in-flight queries to prevent duplicates
  _pendingQueries: {},

  executeQuery: async (connectionId, query, pairs = []) => {
    // Create a unique key for this query
    const queryKey = `${connectionId}:${query}`;

    // If this exact query is already in progress, return the existing promise
    if (queryAPI._pendingQueries[queryKey]) {
      console.log("Query already in progress, returning existing promise");
      return queryAPI._pendingQueries[queryKey];
    }

    // Create a new promise for this query
    const queryPromise = (async () => {
      try {
        const response = await api.post(`/queries/execute/${connectionId}`, {
          query,
          pairs,
        });
        return response.data;
      } finally {
        // Remove this query from the pending queries once completed
        delete queryAPI._pendingQueries[queryKey];
      }
    })();

    // Store the promise for this query
    queryAPI._pendingQueries[queryKey] = queryPromise;

    // Return the promise
    return queryPromise;
  },

  getHistory: async () => {
    const response = await api.get("/queries/history");
    return response.data;
  },

  getQueryDetail: async (queryId) => {
    const response = await api.get(`/queries/history/${queryId}`);
    return response.data;
  },

  rerunQuery: async (queryId) => {
    const response = await api.post(`/queries/history/${queryId}/rerun`);
    return response.data;
  },

  saveQueryExample: async (data) => {
    const response = await api.post("/queries/save_query", { data });
    return response.data;
  },
};

export const dashboardAPI = {
  create: async ({ connection_id, name, description, is_public, layout }) => {
    const response = await api.post("/dashboards", {
      connection_id,
      name,
      description,
      is_public,
      layout,
    });
    return response.data;
  },

  addWidget: async ({
    dashboard_id,
    name,
    widget_type,
    natural_language_query,
    sql_query,
    visualization_settings,
    position,
    refresh_interval = 0,
  }) => {
    const response = await api.post(`/dashboards/${dashboard_id}/widgets`, {
      name,
      widget_type,
      natural_language_query,
      sql_query,
      visualization_settings,
      position,
      refresh_interval,
    });
    return response.data;
  },

  getDashboard: async (dashboardId) => {
    try {
      const response = await api.get(`/dashboards/${dashboardId}`);
      return {
        status: 'success',
        dashboard: response.data
      };
    } catch (error) {
      throw error;
    }
  },

  refreshDashboard: async (dashboardId) => {
    try {
      await api.put(`/dashboards/${dashboardId}/refresh`);
      const response = await api.get(`/dashboards/${dashboardId}`);
      return {
        status: 'success',
        dashboard: response.data
      };
    } catch (error) {
      throw error;
    }
  },

  getDashboardsByCollection: async (connectionId) => {
    try {
      const response = await api.get(`/dashboards/${connectionId}/dashboards`);
      return {
        status: "success",
        dashboards: response.data.dashboards || [],
      };
    } catch (error) {
      console.error("Error fetching dashboards for collection:", error);
      return {
        status: "error",
        message:
          error.response?.data?.message ||
          "Failed to fetch dashboards for this collection",
        dashboards: [],
      };
    }
  },

  updateLayout: async (id, layout) => {
    const response = await api.put(`/dashboards/${id}/layout`, { layout });
    return response.data;
  },

  getAllDashboards: async () => {
    const response = await api.get("/dashboards/all");
    return response.data;
  },

  deleteDashboard: async (dashboardId) => {
    try {
      const response = await api.delete(`/dashboards/${dashboardId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting dashboard:", error);
      throw error;
    }
  },

  deleteWidget: async (widgetId) => {
    try {
      const response = await api.delete(`/dashboards/widgets/${widgetId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting widget:", error);
      throw error;
    }
  },

  updateWidget: async (widgetId, updateData) => {
    try {
      const response = await api.put(`/dashboards/widgets/${widgetId}`, updateData);
      return response.data;
    } catch (error) {
      console.error("Error updating widget:", error);
      throw error;
    }
  },
};

export default api;
