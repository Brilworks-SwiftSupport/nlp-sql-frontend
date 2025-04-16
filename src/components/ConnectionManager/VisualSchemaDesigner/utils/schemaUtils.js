/**
 * Utility functions for schema management and relationship handling
 */

/**
 * Gets column type from schema
 * @param {Object} schema - The database schema
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 * @returns {string} The column type or empty string if not found
 */
export const getColumnType = (schema, tableName, columnName) => {
  if (!schema || !schema[tableName] || !schema[tableName].columns) return '';
  
  const column = schema[tableName].columns.find(col => col.name === columnName);
  return column ? (column.data_type || column.type || '') : '';
};

/**
 * Checks if data types are compatible for creating relationships
 * @param {string} sourceType - Source column data type
 * @param {string} targetType - Target column data type
 * @returns {boolean} Whether the types are compatible
 */
export const areDataTypesCompatible = (sourceType, targetType) => {
  // Check for exact matches
  if (sourceType === targetType) {
    console.log('Exact type match - compatible');
    return true;
  }

  // Special handling for INTEGER types
  if (sourceType.toUpperCase().includes('INTEGER') && 
      targetType.toUpperCase().includes('INTEGER')) {
    console.log('INTEGER to INTEGER connection allowed');
    return true;
  }

  // For common compatible types
  const numericTypes = ['int', 'float', 'double', 'decimal', 'number', 'bigint', 'smallint', 'tinyint', 'numeric'];
  const stringTypes = ['varchar', 'text', 'char', 'string', 'nvarchar', 'nchar'];
  const dateTypes = ['date', 'datetime', 'timestamp', 'time'];

  // Check if both types are in the same category
  const isSourceNumeric = numericTypes.some(t => sourceType.toLowerCase().includes(t));
  const isTargetNumeric = numericTypes.some(t => targetType.toLowerCase().includes(t));
  if (isSourceNumeric && isTargetNumeric) {
    console.log('Both types are numeric - compatible');
    return true;
  }

  const isSourceString = stringTypes.some(t => sourceType.toLowerCase().includes(t));
  const isTargetString = stringTypes.some(t => targetType.toLowerCase().includes(t));
  if (isSourceString && isTargetString) {
    console.log('Both types are strings - compatible');
    return true;
  }

  const isSourceDate = dateTypes.some(t => sourceType.toLowerCase().includes(t));
  const isTargetDate = dateTypes.some(t => targetType.toLowerCase().includes(t));
  if (isSourceDate && isTargetDate) {
    console.log('Both types are dates - compatible');
    return true;
  }

  console.log('Types are incompatible');
  return false;
};

/**
 * Checks if column is an ID field by name
 * @param {string} columnName - Column name to check
 * @returns {boolean} Whether it appears to be an ID field
 */
export const isIdField = (columnName) => {
  return columnName.toLowerCase().includes('id');
};

/**
 * Checks if a table is an Ad Spend table
 * @param {string} tableName - Table name to check
 * @returns {boolean} Whether it's an Ad Spend table
 */
export const isAdSpendTable = (tableName) => {
  const adSpendTables = [
    'Community', 
    'ChallengeFree', 
    'ChallengePaid', 
    'ChallengeHybrid',
    'LowTicketAcquisition', 
    'HighTicketVSL', 
    'InstagramDM', 
    'WebinarBase', 
    'WebinarAdvance'
  ];
  return adSpendTables.includes(tableName);
};

/**
 * Creates a unique edge ID for a relationship
 * @param {string} sourceTable - Source table name
 * @param {string} sourceColumn - Source column name
 * @param {string} targetTable - Target table name
 * @param {string} targetColumn - Target column name
 * @returns {string} Unique edge ID
 */
export const createEdgeId = (sourceTable, sourceColumn, targetTable, targetColumn) => {
  return `${sourceTable}__${sourceColumn}->${targetTable}__${targetColumn}`;
};

/**
 * Gets table columns data from schema
 * @param {Object} schema - The database schema
 * @param {string} tableName - Table name
 * @returns {Array} Array of column objects with additional metadata
 */
export const getTableColumnsData = (schema, tableName) => {
  if (!schema || !schema[tableName] || !schema[tableName].columns) return [];

  return schema[tableName].columns.map(col => ({
    name: col.name,
    type: col.type,
    isPrimaryKey: col.is_primary_key || col.key === 'PRI',
    isNullable: col.is_nullable,
    isIndexed: col.is_indexed || col.key === 'MUL' || col.key === 'UNI',
    isAdSpendColumn: ['AdSpend', 'AdSpendMeta', 'AdSpendGoogle', 'AdSpendYouTube', 'AdSpendTiktok', 'TotalAdSpend'].includes(col.name)
  }));
};

/**
 * Identifies potential foreign keys in table schema
 * @param {Object} tableSchema - Schema for a specific table
 * @returns {Object} Updated schema with identified foreign keys
 */
export const identifyPotentialForeignKeys = (tableSchema) => {
  if (!tableSchema || !tableSchema.columns) return tableSchema;

  // Make a deep copy to avoid mutating the original schema
  const updatedSchema = JSON.parse(JSON.stringify(tableSchema));

  updatedSchema.columns = updatedSchema.columns.map(column => {
    // Check if it's already marked as a foreign key
    if (column.isForeignKey) {
      return column;
    }

    // Common patterns for foreign keys
    const name = column.name.toLowerCase();
    const type = (column.type || '').toLowerCase();

    // Check for common foreign key naming patterns
    const isLikelyFK = 
      name.endsWith('_id') || 
      (name.endsWith('id') && name !== 'id') || // Exclude primary ID columns
      name.startsWith('fk_') || 
      name.includes('foreign') ||
      (type.includes('int') && name.includes('_'));

    if (isLikelyFK) {
      column.isForeignKey = true;
      console.log(`Identified likely foreign key: ${column.name}`);
    }

    return column;
  });

  return updatedSchema;
};

/**
 * Checks if data types are compatible for relationship between specific columns
 * @param {Object} schema - The database schema
 * @param {string} sourceTable - Source table name
 * @param {string} sourceColumn - Source column name  
 * @param {string} targetTable - Target table name
 * @param {string} targetColumn - Target column name
 * @returns {boolean} Whether the data types are compatible
 */
export const checkColumnCompatibility = (schema, sourceTable, sourceColumn, targetTable, targetColumn) => {
  if (!schema || !schema[sourceTable] || !schema[targetTable]) return false;

  const sourceColumns = schema[sourceTable].columns || [];
  const targetColumns = schema[targetTable].columns || [];

  const sourceCol = sourceColumns.find(col => col.name === sourceColumn);
  const targetCol = targetColumns.find(col => col.name === targetColumn);

  if (!sourceCol || !targetCol) return false;

  // Get data types
  const sourceType = (sourceCol.data_type || sourceCol.type || '').toLowerCase();
  const targetType = (targetCol.data_type || targetCol.type || '').toLowerCase();

  // Log for debugging
  console.log(`Checking compatibility: ${sourceTable}.${sourceColumn}(${sourceType}) -> ${targetTable}.${targetColumn}(${targetType})`);

  // For exact matches
  if (sourceType === targetType) {
    console.log('Exact type match - compatible');
    return true;
  }

  // Explicitly allow INTEGER to INTEGER connections
  if (sourceType.toUpperCase().includes('INTEGER') && 
      targetType.toUpperCase().includes('INTEGER')) {
    console.log('INTEGER to INTEGER connection allowed');
    return true;
  }

  // For common compatible types
  const numericTypes = ['int', 'float', 'double', 'decimal', 'number', 'bigint', 'smallint', 'tinyint', 'numeric'];
  const stringTypes = ['varchar', 'text', 'char', 'string', 'nvarchar', 'nchar'];
  const dateTypes = ['date', 'datetime', 'timestamp', 'time'];

  // Check if both types are in the same category
  const isSourceNumeric = numericTypes.some(t => sourceType.includes(t));
  const isTargetNumeric = numericTypes.some(t => targetType.includes(t));
  if (isSourceNumeric && isTargetNumeric) {
    console.log('Both types are numeric - compatible');
    return true;
  }

  const isSourceString = stringTypes.some(t => sourceType.includes(t));
  const isTargetString = stringTypes.some(t => targetType.includes(t));
  if (isSourceString && isTargetString) {
    console.log('Both types are strings - compatible');
    return true;
  }

  const isSourceDate = dateTypes.some(t => sourceType.includes(t));
  const isTargetDate = dateTypes.some(t => targetType.includes(t));
  if (isSourceDate && isTargetDate) {
    console.log('Both types are dates - compatible');
    return true;
  }

  // Special case for common ID relationships
  if ((sourceColumn.toLowerCase().includes('id') || targetColumn.toLowerCase().includes('id')) && 
      (isSourceNumeric || isTargetNumeric)) {
    console.log('ID field to numeric type - compatible');
    return true;
  }

  console.log('Types are incompatible');
  return false;
};
