// components/connections/ConnectionForm.js
import { useState } from 'react';
import { useRouter } from 'next/router';
import { connectionAPI } from '../../lib/api';
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
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Import our connection manager components 
import { 
  ConnectionDetails, 
  TableSelector, 
  ColumnSelector, 
  RelationshipManager, 
  ConnectionSummary 
} from '../../src/components/ConnectionManager';

// Steps in the connection creation workflow
const steps = [
  'Test Connection',
  'Select Tables',
  'Select Columns',
  'Define Relationships',
  'Review & Save',
];

const ConnectionForm = ({ onSuccess }) => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [connectionData, setConnectionData] = useState({
    name: '',
    db_type: 'sqlserver',
    host: '',
    port: '',
    username: '',
    password: '',
    database: '',
    db_schema: 'dbo',
    selected_tables: [],
    selected_columns: {},
    relationships: []
  });
  
  const [schema, setSchema] = useState(null);
  const [status, setStatus] = useState({
    loading: false,
    error: '',
    success: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Handle change in connection data
  const handleConnectionChange = (newData) => {
    setConnectionData(newData);
    setStatus({ ...status, error: '', success: '' });
  };

  // Test the connection
  const testConnection = async () => {
    // Validate connection details
    const errors = validateConnectionDetails();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setStatus({ loading: true, error: '', success: '' });
    setValidationErrors({});
    
    try {
      const response = await connectionAPI.testConnection({
        ...connectionData,
        test_only: true
      });
      
      if (response.status === 'success') {
        setStatus({ 
          loading: false, 
          error: '', 
          success: 'Connection successful!' 
        });
        
        // Store schema information for table selection
        setSchema(response.schema);
      } else {
        setStatus({ 
          loading: false, 
          error: response.message || 'Failed to connect to database', 
          success: '' 
        });
      }
    } catch (error) {
      setStatus({ 
        loading: false, 
        error: error.response?.data?.message || 'An error occurred while testing the connection', 
        success: '' 
      });
    }
  };

  // Fetch schema if we don't have it yet
  const fetchSchema = async () => {
    if (schema) return;
    
    setStatus({ ...status, loading: true });
    
    try {
      const response = await connectionAPI.testConnection({
        ...connectionData,
        test_only: true
      });
      
      if (response.status === 'success') {
        setSchema(response.schema);
      }
      
      setStatus({ ...status, loading: false });
    } catch (error) {
      setStatus({ 
        loading: false, 
        error: 'Failed to fetch database schema', 
        success: '' 
      });
    }
  };

  // Handle back button click
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setStatus({ ...status, error: '', success: '' });
  };

  // Handle next button click
  const handleNext = () => {
    let canProceed = true;
    
    // Validate current step
    if (activeStep === 0) {
      // Test Connection step - validate connection details
      const errors = validateConnectionDetails();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        canProceed = false;
      } else if (!status.success) {
        // Ensure connection was successfully tested
        setStatus({
          ...status,
          error: 'Please test your connection before proceeding'
        });
        canProceed = false;
      }
    } else if (activeStep === 1) {
      // Select Tables step - validate table selection
      if (!connectionData.selected_tables || connectionData.selected_tables.length === 0) {
        setValidationErrors({ tables: 'At least one table must be selected' });
        canProceed = false;
      } else {
        setValidationErrors({});
      }
    } else if (activeStep === 2) {
      // Select Columns step - validate column selection
      let missingColumns = false;
      
      connectionData.selected_tables.forEach(table => {
        if (!connectionData.selected_columns[table] || connectionData.selected_columns[table].length === 0) {
          missingColumns = true;
        }
      });
      
      if (missingColumns) {
        setValidationErrors({ columns: 'Columns must be selected for each table' });
        canProceed = false;
      } else {
        setValidationErrors({});
      }
    } else if (activeStep === 3) {
      // Define Relationships step - validate relationships
      // if (connectionData.selected_tables.length > 1 && !areAllTablesConnected()) {
      //   setValidationErrors({ relationships: 'All tables must have at least one relationship defined' });
      //   canProceed = false;
      // } else {
        setValidationErrors({});
      // }
    }
    
    if (canProceed) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  // Handle table selection
  const handleTableSelection = (selectedTables) => {
    // Create a new selected columns object with only the selected tables
    const newSelectedColumns = {};
    
    selectedTables.forEach(table => {
      // Preserve existing column selections
      if (connectionData.selected_columns[table]) {
        newSelectedColumns[table] = connectionData.selected_columns[table];
      } else {
        newSelectedColumns[table] = [];
      }
    });
    console.log('Connection data before change:', connectionData);
    setConnectionData(prev => ({
      ...prev,
      selected_tables: selectedTables,
      selected_columns: newSelectedColumns
    }));
    console.log('Connection data after change:', connectionData);
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

  // Create the connection
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
    
    const payload = {
      name: connectionData.name,
      db_type: connectionData.db_type,
      host: connectionData.host,
      port: connectionData.port,
      username: connectionData.username,
      password: connectionData.password,
      database: connectionData.database,
      db_schema: connectionData.db_schema,
      metadata: {
        selected_tables: connectionData.selected_tables,
        selected_columns: connectionData.selected_columns,
        relationships: connectionData.relationships
      }
    };
    
    try {
      const response = await connectionAPI.create(payload);
      
      if (response.status === 'success') {
        setStatus({ 
          loading: false, 
          error: '', 
          success: 'Connection created successfully!'
        });
        
        // Navigate to connections list after successful creation
        if (onSuccess) {
          setTimeout(() => {
            onSuccess(response.connection);
          }, 1000);
        }
      } else {
        setStatus({ 
          loading: false, 
          error: response.message || 'Failed to create connection', 
          success: ''
        });
      }
    } catch (error) {
      setStatus({ 
        loading: false, 
        error: error.response?.data?.message || 'An error occurred while creating the connection', 
        success: ''
      });
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
    
    if (!connectionData.username) {
      errors.username = 'Username is required';
    }
    
    if (!connectionData.password) {
      errors.password = 'Password is required';
    }
    
    if (!connectionData.database) {
      errors.database = 'Database name is required';
    }
    
    // SQL Server requires a schema
    if (connectionData.db_type === 'sqlserver' && !connectionData.db_schema) {
      errors.db_schema = 'Schema is required for SQL Server (usually "dbo")';
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

  // Render appropriate content for current step
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Test Connection
        return (
          <ConnectionDetails
            connectionData={connectionData}
            onChange={handleConnectionChange}
            onTestConnection={testConnection}
          />
        );
      
      case 1: // Select Tables
        return (
          <TableSelector
            schema={schema}
            selectedTables={connectionData.selected_tables}
            onTableSelectionChange={handleTableSelection}
          />
        );
      
      case 2: // Select Columns
        return (
          <ColumnSelector
            schema={schema}
            selectedTables={connectionData.selected_tables}
            selectedColumns={connectionData.selected_columns}
            onColumnSelectionChange={handleColumnSelection}
          />
        );
      
      case 3: // Define Relationships
        return (
          <RelationshipManager
            schema={schema}
            selectedTables={connectionData.selected_tables}
            relationships={connectionData.relationships}
            onRelationshipsChange={handleRelationshipUpdate}
          />
        );
      
      case 4: // Review & Save
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
    <Box sx={{ width: '100%' }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Add Database Connection
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
                Create Connection
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
    </Box>
  );
};

export default ConnectionForm;