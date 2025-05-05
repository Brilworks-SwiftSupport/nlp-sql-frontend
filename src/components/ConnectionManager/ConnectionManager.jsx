import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Typography, 
  Paper, 
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Grid,
  Tab,
  Tabs
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ConnectionDetails from './ConnectionDetails';
import TableSelector from './TableSelector';
import ColumnSelector from './ColumnSelector';
import RelationshipManager from './RelationshipManager';
import StandaloneSchemaDesigner from './StandaloneSchemaDesigner';
import ConnectionSummary from './ConnectionSummary';
import { connectionAPI } from '../../../lib/api';

// Steps in the connection creation workflow
const steps = [
  'Test Connection',
  'Select Tables',
  'Visual Schema Designer',
  'Review & Save',
];

const ConnectionManager = ({ onClose, connectionToEdit = null }) => {
  // State for active step
  const [activeStep, setActiveStep] = useState(connectionToEdit ? 1 : 0);
  
  // State for connection data
  const [connectionData, _setConnectionData] = useState({
    id: connectionToEdit?.id || null,
    name: connectionToEdit?.name || '',
    description: connectionToEdit?.description || '',
    db_type: connectionToEdit?.db_type || 'sqlserver',
    host: connectionToEdit?.host || '',
    port: connectionToEdit?.port || '',
    username: connectionToEdit?.username || '',
    password: '',
    database: connectionToEdit?.database || '',
    db_schema: connectionToEdit?.db_schema || '',
    // SSH Configuration
    ssh_enabled: connectionToEdit?.ssh_enabled || false,
    ssh_host: connectionToEdit?.ssh_host || '',
    ssh_port: connectionToEdit?.ssh_port || '22',
    ssh_username: connectionToEdit?.ssh_username || '',
    ssh_auth_method: connectionToEdit?.ssh_auth_method || 'password',
    ssh_password: '',  // Don't populate from connectionToEdit for security
    ssh_private_key: '', // Don't populate from connectionToEdit for security
    // Schema related fields
    selected_tables: connectionToEdit?.selected_tables || [],
    selected_columns: connectionToEdit?.selected_columns || {},
    relationships: connectionToEdit?.relationships || []
  });

  const setConnectionData = useCallback((newValue) => {
    console.log("setConnectionData called with:", newValue);
    console.trace(); // shows you who called this
    _setConnectionData(newValue);
  }, []);
  
  // State for database schema
  const [schema, setSchema] = useState(null);
  
  // State for loading, error, and success
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: '',
    connectionTested: false,  
    connectionId: null        
  });

  // State for filtered relationships
  const [filteredRelationships, setFilteredRelationships] = useState([]);

  // Update filteredRelationships whenever selectedTables, selectedColumns, or relationships change.
  useEffect(() => {
    setFilteredRelationships(
      connectionData.relationships.filter(rel => {
        return (
          connectionData.selected_tables.includes(rel.sourceTable) &&
          connectionData.selected_tables.includes(rel.targetTable)
        );
      })
    );
  }, [
    connectionData.relationships,
    connectionData.selected_tables,
    connectionData.selected_columns // include if changes to columns should trigger an update
  ])

  // State for validation errors by step
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize schema data when editing an existing connection
  useEffect(() => {
    // If we're editing an existing connection, fetch its schema or use the one provided
    if (connectionToEdit && connectionToEdit.id) {
      setStatus({
        ...status,
        connectionTested: true,
        connectionId: connectionToEdit.id
      });
      
      // If the connection already has schema data attached, use it directly
      if (connectionToEdit.schema) {
        setSchema(connectionToEdit.schema);
        setStatus({ 
          ...status, 
          loading: false, 
          error: '', 
          success: 'Schema loaded successfully', 
          connectionTested: true,
          connectionId: connectionToEdit.id
        });
      } else {
        // Otherwise fetch the schema
        fetchSchema(connectionToEdit.id);
      }
      
      // Fetch metadata for the connection
      console.log('Fetching metadata for connection:', connectionToEdit.id);
      connectionAPI.getConnectionMetadata(connectionToEdit.id)
        .then(response => {
          console.log('Metadata response:', response);
          if (response.status === 'success' && response.metadata) {
            // Update connection data with fetched metadata
            setConnectionData(prev => ({
              ...prev,
              id: connectionToEdit.id,
              selected_tables: response.schema_data.metadata.selected_tables || [],
              selected_columns: response.schema_data.metadata.selected_columns || {},
              relationships: response.schema_data.metadata.relationships || []
            }));
            
            console.log('Metadata loaded successfully');
          } else {
            console.error('Error loading metadata:', response.message);
          }
        })
        .catch(error => {
          console.error('Exception loading metadata:', error);
        });
    }
  }, [connectionToEdit]);

  // Fetch schema using only tables API
  const fetchSchema = async (connectionId) => {
    try {
      // Set loading state
      setStatus(prev => ({ ...prev, loading: true, error: '' }));
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem('token');
      
      console.log('Fetching tables for connection:', connectionId);
      
      // Fetch tables data
      const tablesResponse = await fetch(`${apiUrl}/connections/${connectionId}/tables`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const tablesData = await tablesResponse.json();
      console.log('Tables data received:', tablesData);
      
      if (!tablesResponse.ok || tablesData.status !== 'success' || !tablesData.tables) {
        throw new Error(tablesData.message || 'Failed to load tables');
      }
      
      // Process tables data
      const schemaData = {};
      
      tablesData.tables.forEach(tableName => {
        if (!tableName) return;
        
        // If tableName is a string (e.g., 'dbo.TableName'), use it directly
        const name = typeof tableName === 'string' ? tableName : tableName.name;
        if (!name) return;
        
        const columns = [];
        // If table object has columns, process them
        if (tableName.columns && Array.isArray(tableName.columns)) {
          tableName.columns.forEach(col => {
            if (col && col.name) {
              columns.push({
                name: col.name,
                type: col.data_type || 'unknown',
                is_primary_key: col.is_primary_key || false,
                is_foreign_key: col.is_foreign_key || false,
                nullable: col.nullable || true
              });
            }
          });
        }
        
        schemaData[name] = {
          name: name,
          columns: columns
        };
      });
      
      console.log('Processed schema data:', schemaData);
      console.log('Schema has tables:', Object.keys(schemaData).length);
      
      // Don't reset selections when fetching schema
      // Keep existing data to prevent duplicates when saving
      
      // Store the schema in the database
      

      // Display tables data
      setSchema(schemaData);

      handleRelationshipUpdate(tablesData.relationships);
      
      // Update status
      setStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: '', 
        success: 'Schema loaded and stored successfully', 
        connectionTested: true 
      }));
      
    } catch (error) {
      console.error('Error fetching schema:', error);
      setStatus(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.message || 'Failed to load database schema' 
      }));
    }
  };

  // Test the connection
  const testConnection = async () => {
    // Validate connection details
    const errors = validateConnectionDetails();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setStatus({ loading: true, error: '', success: '', connectionTested: false });
    setValidationErrors({});
    
    try {
      const connectionTestData = {
        db_type: connectionData.db_type,
        host: connectionData.host,
        port: connectionData.port,
        username: connectionData.username,
        password: connectionData.password,
        database: connectionData.database,
        db_schema: connectionData.db_schema,
        // Add SSH configuration for testing
        ssh_enabled: connectionData.ssh_enabled,
        ...(connectionData.ssh_enabled && {
          ssh_host: connectionData.ssh_host,
          ssh_port: connectionData.ssh_port,
          ssh_username: connectionData.ssh_username,
          ssh_auth_method: connectionData.ssh_auth_method,
          ...(connectionData.ssh_auth_method === 'password' 
            ? { ssh_password: connectionData.ssh_password }
            : { ssh_private_key: connectionData.ssh_private_key }
          )
        }),
        test_only: true
      };

      const response = await connectionAPI.testConnection(connectionTestData);
      
      if (response.status === 'success') {
        setStatus({ 
          loading: false, 
          error: '', 
          success: 'Connection test successful! Click "Connect & Configure" to proceed.',
          connectionTested: true 
        });
      } else {
        setStatus({ 
          loading: false, 
          error: response.message || 'Connection test failed', 
          success: '',
          connectionTested: false
        });
      }
    } catch (error) {
      setStatus({ 
        loading: false, 
        error: error.response?.data?.message || 'An error occurred during connection test', 
        success: '',
        connectionTested: false
      });
    }
  };

  useEffect(() => {
    if (connectionData.id === null) {
      console.log('connectionData.id was set to null');
      console.trace(); // This logs the call stack to the console
    } else {
      console.log('connectionData.id updated:', connectionData.id);
    }
  }, [connectionData.id]);
  // Create connection and fetch schema
  const connectAndConfigure = async () => {
    // Validate connection details
    const errors = validateConnectionDetails();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setStatus({ ...status, loading: true, error: '', success: 'Creating connection...' });
    
    try {
      const createResponse = await connectionAPI.create({
        name: connectionData.name,
        description: connectionData.description,
        db_type: connectionData.db_type,
        host: connectionData.host,
        port: connectionData.port,
        username: connectionData.username,
        password: connectionData.password,
        database: connectionData.database,
        db_schema: connectionData.db_schema,
        // SSH Configuration
        ssh_enabled: connectionData.ssh_enabled,
        ...(connectionData.ssh_enabled && {
          ssh_host: connectionData.ssh_host,
          ssh_port: connectionData.ssh_port,
          ssh_username: connectionData.ssh_username,
          ssh_auth_method: connectionData.ssh_auth_method,
          ...(connectionData.ssh_auth_method === 'password' 
            ? { ssh_password: connectionData.ssh_password }
            : { ssh_private_key: connectionData.ssh_private_key }
          )
        }),
        // Initialize with empty selections
        selected_tables: [],
        selected_columns: {},
        relationships: []
      });
      
      if (createResponse.status === 'success') {
        // Update connectionData with the new connection ID
        setConnectionData(prev => ({
          ...prev,
          id: createResponse.connection.id
        }));
        
        setStatus({ 
          ...status,
          loading: true, 
          error: '', 
          success: 'Connection created successfully! Fetching database schema...',
          connectionId: createResponse.connection.id,
          connectionTested: true
        });
        
        // Now get the tables for the connection
        fetchSchema(createResponse.connection.id);
      } else {
        setStatus({ 
          ...status,
          loading: false, 
          error: createResponse.message || 'Failed to create connection', 
          success: ''
        });
      }
    } catch (error) {
      setStatus({ 
        ...status,
        loading: false, 
        error: error.response?.data?.message || 'An error occurred during connection creation', 
        success: ''
      });
    }
  };

  // Handle table selection
  const handleTableSelection = (selectedTables) => {
    // Reset column selection if tables change
    const currentTables = connectionData.selected_tables || [];
    const newSelectedColumns = { ...connectionData.selected_columns };
    
    // Remove columns for tables that are no longer selected
    Object.keys(newSelectedColumns).forEach(tableName => {
      if (!selectedTables.includes(tableName)) {
        delete newSelectedColumns[tableName];
      }
    });
    
    // Make sure every selected table has an entry in the columns object
    selectedTables.forEach(tableName => {
      if (!newSelectedColumns[tableName]) {
        newSelectedColumns[tableName] = [];
      }
    });
    setConnectionData(prev => ({
      ...prev,
      selected_tables: selectedTables,
      selected_columns: newSelectedColumns
    }));
    
    // Clear success/error messages when selection changes
    setStatus({ ...status, error: '', success: '' });
  };

  // Handle column selection
  const handleColumnSelection = (selectedColumns) => {
    setConnectionData(prev => ({
      ...prev,
      selected_columns: selectedColumns
    }));
    
    // Clear success/error messages when selection changes
    setStatus({ ...status, error: '', success: '' });
  };

  // Handle relationship definition
  const handleRelationshipUpdate = (relationships) => {
    setConnectionData(prev => ({
      ...prev,
      relationships: relationships
    }));
    
    // Clear success/error messages when relationships change
    setStatus({ ...status, error: '', success: '' });
  };

  // Check if all tables have defined relationships
  const areAllTablesConnected = () => {
    // If only one table is selected, relationships are not required
    if (connectionData.selected_tables.length <= 1) return true;
    
    // Check if all tables are in at least one relationship
    const tablesWithRelationships = new Set();
    
    connectionData.relationships.forEach(rel => {
      tablesWithRelationships.add(rel.source_table);
      tablesWithRelationships.add(rel.target_table);
    });
    
    return connectionData.selected_tables.every(table => tablesWithRelationships.has(table));
  };

  // Save the connection
  const saveConnection = async () => {
    // Validate the entire connection setup
    const errors = validateConnectionForSave();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setStatus({
        loading: false,
        error: 'Please fix the validation errors before saving.',
        success: ''
      });
      return;
    }
    
    setStatus({ loading: true, error: '', success: '' });
    setValidationErrors({});
    
    try {
      // Get the connection ID from status if it's not in connectionData
      const connectionId = connectionData.id || status.connectionId;
      
      console.log('Saving connection with ID:', connectionId);
      console.log('Connection data:', connectionData);
      console.log('Status:', status);
      
      if (!connectionId) {
        setStatus({
          loading: false,
          error: 'Connection ID is missing. Please try reconnecting.',
          success: ''
        });
        return;
      }
      
      // Deduplicate relationships before sending to the API
      const uniqueRelationships = [];
      const uniqueRelationshipKeys = new Set();
      
      // Process all relationships to remove duplicates
      connectionData.relationships.forEach(rel => {
        // Create a unique key for each relationship in both directions
        const forwardKey = `${rel.source_table}.${rel.source_column}=>${rel.target_table}.${rel.target_column}`;
        const reverseKey = `${rel.target_table}.${rel.target_column}=>${rel.source_table}.${rel.source_column}`;
        
        // Only add if we haven't seen this relationship before (in either direction)
        if (!uniqueRelationshipKeys.has(forwardKey) && !uniqueRelationshipKeys.has(reverseKey)) {
          uniqueRelationshipKeys.add(forwardKey);
          uniqueRelationships.push(rel);
        }
      });
      
      const schemaMetadata = {
        selected_tables: connectionData.selected_tables,
        selected_columns: connectionData.selected_columns,
        relationships: uniqueRelationships
      };
      
      console.log('Sending schema metadata:', schemaMetadata);
      
      // Update the connection schema metadata
      const response = await connectionAPI.updateConnectionSchema(
        connectionId, 
        schemaMetadata
      );
      
      if (response.status === 'success') {
        setStatus({ 
          loading: false, 
          error: '', 
          success: `Connection configuration saved successfully!`
        });
        
        if (onClose) {
          setTimeout(() => onClose(true), 1500); // Pass true to indicate successful save
        }
      } else {
        console.error("Error saving connection:", response.data);
        
        // Check if this is a duplicate relationships error
        if (response.data?.duplicates) {
          const duplicates = response.data.duplicates;
          setStatus({ 
            loading: false, 
            error: `Duplicate relationships detected: ${duplicates.join(", ")}`, 
            success: '' 
          });
        } else {
          setStatus({ 
            loading: false, 
            error: response.data?.message || `Failed to save connection configuration`, 
            success: '' 
          });
        }
      }
    } catch (error) {
      console.error("Error saving connection:", error.response?.data);
      
      // Check if this is a duplicate relationships error
      if (error.response?.data?.duplicates) {
        const duplicates = error.response.data.duplicates;
        setStatus({ 
          loading: false, 
          error: `Duplicate relationships detected: ${duplicates.join(", ")}`, 
          success: '' 
        });
      } else {
        setStatus({ 
          loading: false, 
          error: error.response?.data?.message || `An error occurred while saving the connection configuration`, 
          success: '' 
        });
      }
    }
  };

  // Validate connection details
  const validateConnectionDetails = () => {
    const errors = {};
    
    if (!connectionData.name) {
      errors.name = 'Connection name is required';
    }
    
    if (!connectionData.db_type) {
      errors.db_type = 'Database type is required';
    }
    
    if (!connectionData.host) {
      errors.host = 'Host/server is required';
    }
    
    if (!connectionData.port) {
      errors.port = 'Port is required';
    } else if (isNaN(connectionData.port)) {
      errors.port = 'Port must be a number';
    }
    
    if (!connectionData.username && !connectionData.host?.toLowerCase().includes('localhost')) {
      errors.username = 'Username is required';
    }

    if (!connectionData.password && !connectionToEdit && !connectionData.host?.toLowerCase().includes('localhost')) {
      errors.password = 'Password is required';
    }
    
    if (!connectionData.database) {
      errors.database = 'Database name is required';
    }
    
    // SQL Server requires a schema
    if (connectionData.db_type === 'sqlserver' && !connectionData.db_schema) {
      errors.db_schema = 'Schema is required for SQL Server (usually "dbo")';
    }

    // Validate SSH configuration if enabled
    if (connectionData.ssh_enabled) {
      if (!connectionData.ssh_host) {
        errors.ssh_host = 'SSH host is required';
      }
      if (!connectionData.ssh_port) {
        errors.ssh_port = 'SSH port is required';
      }
      if (!connectionData.ssh_username) {
        errors.ssh_username = 'SSH username is required';
      }
      if (connectionData.ssh_auth_method === 'password' && !connectionData.ssh_password && !connectionToEdit) {
        errors.ssh_password = 'SSH password is required';
      }
      if (connectionData.ssh_auth_method === 'private_key' && !connectionData.ssh_private_key && !connectionToEdit) {
        errors.ssh_private_key = 'SSH private key is required';
      }
    }
    
    return errors;
  };

  // Validate the connection for saving
  const validateConnectionForSave = () => {
    const errors = validateConnectionDetails();
    
    // Check if tables are selected
    if (!connectionData.selected_tables || connectionData.selected_tables.length === 0) {
      errors.tables = 'At least one table must be selected';
    }
    
    // Check if columns are selected for each table
    if (connectionData.selected_tables && connectionData.selected_tables.length > 0) {
      let missingColumns = false;
      
      connectionData.selected_tables.forEach(table => {
        if (!connectionData.selected_columns[table] || connectionData.selected_columns[table].length === 0) {
          missingColumns = true;
        }
      });
      
      if (missingColumns) {
        errors.columns = 'Columns must be selected for each table';
      }
    }
    
    // Check if relationships are defined (only if multiple tables are selected)
    // if (connectionData.selected_tables && connectionData.selected_tables.length > 1) {
    //   if (!areAllTablesConnected()) {
    //     errors.relationships = 'All tables must have at least one relationship defined';
    //   }
    // }
    
    return errors;
  };

  // Handle next step
  const handleNext = () => {
    let canProceed = true;
    
    // Validate current step
    if (activeStep === 0) {
      // Test Connection step - validate connection details
      const errors = validateConnectionDetails();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        canProceed = false;
      } else if (!schema) {
        // Ensure schema was loaded (which means connection was tested and created)
        setStatus({
          ...status,
          error: 'Please test your connection and click "Connect & Configure" before proceeding'
        });
        canProceed = false;
      }
    } else if (activeStep === 1) {
      // Configure Schema step - validate table selection at minimum
      if (!schema) {
        setStatus({
          ...status,
          error: 'Schema data is not available. Please retest your connection.'
        });
        canProceed = false;
      } else if (connectionData.selected_tables.length === 0) {
        setValidationErrors({
          ...validationErrors,
          tables: 'Please select at least one table'
        });
        canProceed = false;
      } else {
        // Clear any validation errors for tables if tables are selected
        const newValidationErrors = { ...validationErrors };
        delete newValidationErrors.tables;
        setValidationErrors(newValidationErrors);
      }
    }
    
    if (canProceed) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setStatus({ ...status, error: '', success: '' });
  };

  // Handle form change for connection details
  const handleConnectionChange = (newData) => {
    setConnectionData(newData);
    
    // Clear schema if connection details change
    if (
      newData.db_type !== connectionData.db_type ||
      newData.host !== connectionData.host ||
      newData.port !== connectionData.port ||
      newData.username !== connectionData.username ||
      newData.password !== connectionData.password ||
      newData.database !== connectionData.database ||
      newData.db_schema !== connectionData.db_schema
    ) {
      setSchema(null);
      setStatus({ ...status, error: '', success: '', connectionTested: false, connectionId: null });
    }
    
    // Clear validation errors for the fields that changed
    const newValidationErrors = { ...validationErrors };
    Object.keys(newData).forEach(key => {
      if (newData[key] !== connectionData[key] && newValidationErrors[key]) {
        delete newValidationErrors[key];
      }
    });
    
    setValidationErrors(newValidationErrors);
  };

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Test Connection
        return (
          <ConnectionDetails
            connectionData={connectionData}
            onChange={handleConnectionChange}
            isEdit={!!connectionToEdit}
            onTestConnection={testConnection}
            onConnect={connectAndConfigure}
            connectionTested={status.connectionTested}
          />
        );
      
      case 1: // Select Tables
        // Only render TableSelector if we have schema data loaded
        if (!schema) {
          return (
            <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: '200px' }}>
              <CircularProgress />
              <Typography variant="body1" color="text.secondary" sx={{ ml: 2 }}>
                Loading schema data...
              </Typography>
            </Box>
          );
        }
        
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} width={'100%'}>
              <TableSelector
                schema={schema}
                selectedTables={connectionData.selected_tables}
                onTablesChange={(tables) => {
                  // When tables change, also update selected columns
                  const newSelectedColumns = { ...connectionData.selected_columns };
                  
                  // Remove columns for tables that are no longer selected
                  Object.keys(newSelectedColumns).forEach(tableName => {
                    if (!tables.includes(tableName)) {
                      delete newSelectedColumns[tableName];
                    }
                  });
                  
                  // Make sure every selected table has an entry in the columns object
                  tables.forEach(tableName => {
                    if (!newSelectedColumns[tableName]) {
                      newSelectedColumns[tableName] = [];
                    }
                  });
                  setConnectionData(prev => ({
                    ...prev,
                    selected_tables: tables,
                    selected_columns: newSelectedColumns
                  }));
                }}
                schema_type={connectionData.db_type}
              />
            </Grid>
          </Grid>
        );
      
      case 2: // Visual Schema Designer
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <StandaloneSchemaDesigner
                schema={schema}
                selectedTables={connectionData.selected_tables}
                selectedColumns={connectionData.selected_columns}
                relationships={connectionData.relationships}
                onRelationshipsChange={(relationships) => {
                  setConnectionData(prev => ({
                    ...prev,
                    relationships
                  }));
                }}
                onSelectedColumnsChange={(selectedColumns) => {
                  setConnectionData(prev => ({
                    ...prev,
                    selected_columns: selectedColumns
                  }));
                }}
              />
            </Grid>
          </Grid>
        );
      
      case 3: // Review & Save
        return (
          <ConnectionSummary
            connectionData={connectionData}
            schema={schema}
            selectedTables={connectionData.selected_tables}
            selectedColumns={connectionData.selected_columns}
            relationships={connectionData.relationships}
            validationErrors={validationErrors}
          />
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {connectionToEdit ? 'Edit Connection' : 'Add Database Connection'}
          </Typography>
        </Box>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Status messages */}
        {(status.error || status.success || Object.keys(validationErrors).length > 0) && (
          <Box sx={{ mb: 3 }}>
            {status.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {status.error}
              </Alert>
            )}
            
            {status.success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {status.success}
              </Alert>
            )}
            
            {Object.keys(validationErrors).length > 0 && !status.error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please fix the following errors:
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {Object.entries(validationErrors).map(([field, error]) => (
                    <li key={field}>{error}</li>
                  ))}
                </ul>
              </Alert>
            )}
          </Box>
        )}
        
        {/* Loading overlay */}
        {status.loading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1000
            }}
          >
            <CircularProgress />
          </Box>
        )}
        
        {/* Step content */}
        <Box sx={{ mt: 2, minHeight: '400px' }}>
          {getStepContent(activeStep)}
        </Box>
        
        {/* Navigation buttons */}
        <Divider sx={{ mt: 4, mb: 2 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            color="inherit"
            disabled={activeStep === 0 || status.loading}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={saveConnection}
                disabled={status.loading}
                sx={{ minWidth: '150px' }}
              >
                {connectionToEdit ? 'Update Connection' : 'Create Connection'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={status.loading}
                endIcon={<ArrowForwardIcon />}
                sx={{ minWidth: '150px' }}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* Help card */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
            <HelpOutlineIcon sx={{ mr: 1, fontSize: 'small' }} />
            Connection Setup Tips
          </Typography>
          <Typography variant="body2" paragraph>
            {activeStep === 0 && "Test your database connection before proceeding. All fields marked with * are required."}
            {activeStep === 1 && "Select the tables for your connection."}
            {activeStep === 2 && "Visualize and refine your schema relationships."}
            {activeStep === 3 && "Review your connection setup before saving. All steps must be completed."}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ConnectionManager;
