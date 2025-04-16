// lib/connectionUtils.js

/**
 * Validates if a connection has complete schema configuration
 * @param {Object} connection - Connection object to validate
 * @returns {Object} - Validation result with status and missing configuration
 */
export const validateConnectionSchema = (connection) => {
  if (!connection) {
    return { valid: false, reason: 'No connection provided' };
  }
  
  // Check if connection has any metadata
  const schema = connection.schema;
  if (!schema) {
    return { valid: false, reason: 'No schema configuration found' };
  }
  
  // Check for selected tables
  const selectedTables = schema.selected_tables || [];
  if (selectedTables.length === 0) {
    return { valid: false, reason: 'No tables selected', step: 'tables' };
  }
  
  // Check for selected columns
  const selectedColumns = schema.selected_columns || {};
  let columnsValid = true;
  let missingColumnsForTables = [];
  
  selectedTables.forEach(table => {
    if (!selectedColumns[table] || selectedColumns[table].length === 0) {
      columnsValid = false;
      missingColumnsForTables.push(table);
    }
  });
  
  if (!columnsValid) {
    return { 
      valid: false, 
      reason: `Missing column selection for tables: ${missingColumnsForTables.join(', ')}`,
      step: 'columns'
    };
  }
  
  // Check for relationships if multiple tables are selected
  if (selectedTables.length > 1) {
    const relationships = schema.relationships || [];
    
    // Create a graph to check if all tables are connected
    const graph = {};
    selectedTables.forEach(table => { graph[table] = []; });
    
    relationships.forEach(rel => {
      const sourceTable = rel.source_table;
      const targetTable = rel.target_table;
      
      if (graph[sourceTable]) {
        graph[sourceTable].push(targetTable);
      }
      
      if (graph[targetTable]) {
        graph[targetTable].push(sourceTable);
      }
    });
    
    // Check if all tables are connected (using BFS)
    const visitedTables = new Set();
    const queue = [selectedTables[0]];
    visitedTables.add(selectedTables[0]);
    
    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = graph[current] || [];
      
      for (const neighbor of neighbors) {
        if (!visitedTables.has(neighbor)) {
          visitedTables.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    
    if (visitedTables.size !== selectedTables.length) {
      return { 
        valid: false, 
        reason: 'Not all tables are connected with relationships',
        step: 'relationships'
      };
    }
  }
  
  // All validations passed
  return { valid: true };
};

/**
 * Checks if a connection is ready for use with the query builder
 * @param {Object} connection - Connection object to check
 * @returns {boolean} - True if connection is ready for use
 */
export const isConnectionReady = (connection) => {
  const validation = validateConnectionSchema(connection);
  return validation.valid;
};

/**
 * Checks if the connection has tables matching certain criteria
 * @param {Object} connection - Connection object to check
 * @param {Array} highlightedTables - Optional array of table names to check for
 * @returns {boolean} - True if connection has any of the specified tables or has tables with metadata
 */
export const hasHighlightedTables = (connection, highlightedTables = []) => {
  // Defensive checks: ensure connection exists and has valid schema structure
  if (!connection) return false;
  
  // Handle different schema data formats (direct or nested)
  const schemaData = connection.schema || {};
  const selectedTables = Array.isArray(schemaData.selected_tables) 
    ? schemaData.selected_tables 
    : (connection.selected_tables || []);
  
  // If no specific tables are provided, check if there are any selected tables
  if (!highlightedTables || highlightedTables.length === 0) {
    return selectedTables.length > 0;
  }
  
  // Check if any of the highlighted tables are selected
  return selectedTables.some(table => 
    highlightedTables.includes(table)
  );
};

/**
 * Get suggestions for next steps to complete connection setup
 * @param {Object} connection - Connection object to provide suggestions for
 * @returns {String} - Suggestion message for next steps
 */
export const getConnectionCompletionSuggestion = (connection) => {
  // Return early if connection is invalid
  if (!connection) {
    return 'Connection is invalid or missing';
  }
  
  try {
    const validation = validateConnectionSchema(connection);
    
    if (validation.valid) {
      return 'Connection is fully configured and ready to use';
    }
    
    switch (validation.step) {
      case 'tables':
        return 'You need to select tables for this connection';
      case 'columns':
        return 'You need to select columns for the selected tables';
      case 'relationships':
        return 'You need to define relationships between the selected tables';
      default:
        return validation.reason || 'You need to complete the connection configuration';
    }
  } catch (error) {
    console.error('Error generating connection suggestion:', error);
    return 'There was an error evaluating this connection';
  }
};
