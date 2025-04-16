// lib/helpers.js
/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
    if (!dateString) return '';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    return new Date(dateString).toLocaleString(undefined, mergedOptions);
  };
  
  /**
   * Truncate a string to a maximum length
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  export const truncateString = (str, maxLength = 100) => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    
    return `${str.substring(0, maxLength)}...`;
  };
  
  /**
   * Format SQL query with proper indentation
   * @param {string} sql - SQL query to format
   * @returns {string} Formatted SQL query
   */
  export const formatSql = (sql) => {
    if (!sql) return '';
    
    // Simple SQL formatting - this could be enhanced with a proper SQL formatter library
    return sql
      .replace(/\s+/g, ' ')
      .replace(/ (SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|ON|AND|OR) /gi, '\n$1 ')
      .replace(/ (UNION|UNION ALL) /gi, '\n\n$1\n\n')
      .replace(/,/g, ',\n  ');
  };
  
  /**
   * Parse JWT token and extract payload
   * @param {string} token - JWT token
   * @returns {object|null} Decoded token payload or null if invalid
   */
  export const parseJwt = (token) => {
    if (!token) return null;
    
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (error) {
      return null;
    }
  };
  
  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} True if token is expired or invalid
   */
  export const isTokenExpired = (token) => {
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return true;
    
    const expiration = new Date(payload.exp * 1000);
    return expiration <= new Date();
  };
  
  /**
   * Get user from localStorage
   * @returns {object|null} User object or null if not found
   */
  export const getStoredUser = () => {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  };
  
  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  export const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    return !isTokenExpired(token);
  };