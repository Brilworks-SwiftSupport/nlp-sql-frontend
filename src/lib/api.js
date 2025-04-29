export const dashboardAPI = {
  // ... existing methods ...

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

  // ... other methods ...
};