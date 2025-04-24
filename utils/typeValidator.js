export const SQL_TYPES = {
  INTEGER: ['INT', 'INTEGER', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT'],
  DECIMAL: ['DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL'],
  STRING: ['VARCHAR', 'CHAR', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT', 'TINYTEXT'],
  DATE: ['DATE'],
  DATETIME: ['DATETIME', 'TIMESTAMP'],
  TIME: ['TIME'],
  BOOLEAN: ['BOOLEAN', 'BOOL', 'BIT'],
  JSON: ['JSON', 'JSONB']
};

export const MONGODB_TYPES = {
  OBJECT_ID: ['ObjectId'],
  ARRAY: ['Array'],
  EMBEDDED: ['Embedded']
};

export const validateValue = (value, columnType, nullable) => {
  if (!value && nullable) return null; // Valid if null is allowed
  
  const type = columnType.toUpperCase();
  
  // Handle SQL types
  if (SQL_TYPES.INTEGER.includes(type)) {
    const num = Number(value);
    if (isNaN(num)) return 'Must be a number';
    if (type === 'TINYINT' && (num < -128 || num > 127)) return 'Must be between -128 and 127';
    if (type === 'SMALLINT' && (num < -32768 || num > 32767)) return 'Must be between -32768 and 32767';
    if (type === 'MEDIUMINT' && (num < -8388608 || num > 8388607)) return 'Must be between -8388608 and 8388607';
    if (type === 'INT' && (num < -2147483648 || num > 2147483647)) return 'Must be between -2147483648 and 2147483647';
    if (type === 'BIGINT' && (num < -9223372036854775808 || num > 9223372036854775807)) return 'Must be between -9223372036854775808 and 9223372036854775807';
    return null;
  }

  if (SQL_TYPES.DECIMAL.includes(type)) {
    const num = Number(value);
    if (isNaN(num)) return 'Must be a number';
    return null;
  }

  if (SQL_TYPES.DATE.includes(type)) {
    // DATE type should only contain date without time
    const date = new Date(value);
    if (isNaN(date.getTime())) return 'Invalid date format';
    
    // Clear time part
    date.setHours(0, 0, 0, 0);
    
    // Check if the date is valid
    if (date.getTime() !== new Date(date.toISOString().split('T')[0]).getTime()) {
      return 'Invalid date format';
    }
    return null;
  }

  if (SQL_TYPES.TIME.includes(type)) {
    // TIME type should only contain time
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
    if (!timeRegex.test(value)) {
      return 'Invalid time format (HH:MM:SS)';
    }
    return null;
  }

  if (SQL_TYPES.BOOLEAN.includes(type)) {
    if (value.toLowerCase() !== 'true' && value.toLowerCase() !== 'false') {
      return 'Must be true or false';
    }
    return null;
  }

  if (SQL_TYPES.JSON.includes(type)) {
    try {
      JSON.parse(value);
      return null;
    } catch (e) {
      return 'Invalid JSON format';
    }
  }

  // Handle MongoDB types
  if (MONGODB_TYPES.OBJECT_ID.includes(type)) {
    if (!value.match(/^[0-9a-fA-F]{24}$/)) return 'Invalid ObjectId format';
    return null;
  }

  if (MONGODB_TYPES.ARRAY.includes(type)) {
    try {
      const arr = JSON.parse(value);
      if (!Array.isArray(arr)) return 'Value must be an array';
      return null;
    } catch (e) {
      return 'Invalid array format';
    }
  }

  if (MONGODB_TYPES.EMBEDDED.includes(type)) {
    try {
      JSON.parse(value);
      return null;
    } catch (e) {
      return 'Invalid embedded document format';
    }
  }

  // Default validation for other types
  if (!value.trim()) return 'Value cannot be empty';
  return null;
};

export const getInputType = (columnType) => {
  const type = columnType.toUpperCase();
  
  if (SQL_TYPES.INTEGER.includes(type)) return 'number';
  if (SQL_TYPES.DECIMAL.includes(type)) return 'number';
  if (SQL_TYPES.DATE.includes(type)) return 'date';
  if (SQL_TYPES.DATETIME.includes(type)) return 'datetime-local';
  if (SQL_TYPES.TIME.includes(type)) return 'time';
  if (SQL_TYPES.BOOLEAN.includes(type)) return 'checkbox';
  
  return 'text';
};
